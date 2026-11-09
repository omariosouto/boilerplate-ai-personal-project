/**
 * What the on-device model answers with, and how that becomes a json-render spec.
 *
 * The model only picks WHAT to show (a sentence + one visual); the numbers come from `sheet-facts`.
 * The answer is a small flat object so Gemini Nano can follow it reliably: `answerSchema()` is passed
 * as the Prompt API's `responseConstraint`, with the real tab/column names as enums so the model
 * can't reference something that doesn't exist.
 */
import type { Spec } from '@repo/generative-ui';

import { findTab, type SheetFacts } from './sheet-facts';

export const VISUALS = ['none', 'rowCount', 'rowsPerTab', 'valueCounts', 'table'] as const;

export type SheetAnswer = {
  text: string;
  visual: (typeof VISUALS)[number];
  tab?: string;
  column?: string;
};

/** JSON Schema for `responseConstraint`, built from the current spreadsheet. */
export function answerSchema(facts: SheetFacts): Record<string, unknown> {
  const tabs = facts.tabs.map((tab) => tab.name);
  const columns = [...new Set(facts.tabs.flatMap((tab) => tab.columns))];
  return {
    type: 'object',
    properties: {
      text: { type: 'string' },
      visual: { type: 'string', enum: VISUALS },
      ...(tabs.length > 0 && { tab: { type: 'string', enum: tabs } }),
      ...(columns.length > 0 && { column: { type: 'string', enum: columns } }),
    },
    required: ['text', 'visual'],
    additionalProperties: false,
  };
}

export const ANSWER_INSTRUCTIONS = `You answer questions about the user's spreadsheet. Reply in English with a JSON object:
- "text": a short, direct answer (1-2 sentences). Use ONLY the numbers given in the spreadsheet summary; never estimate or count yourself.
- "visual": what to show under the text:
  - "rowCount": the number of data rows of one tab (set "tab").
  - "rowsPerTab": a bar chart of data rows per tab.
  - "valueCounts": a bar chart of how often each value appears in one column (set "tab" and "column").
  - "table": the first rows of one tab (set "tab").
  - "none": text only.
Prefer a visual when the user asks for a chart, a count or to see data.`;

/** Parses the model's raw output; `null` when it isn't the expected shape. */
export function parseSheetAnswer(raw: string): SheetAnswer | null {
  try {
    const value = JSON.parse(raw) as Partial<SheetAnswer>;
    if (typeof value.text !== 'string' || !VISUALS.includes(value.visual as SheetAnswer['visual'])) return null;
    return {
      text: value.text,
      visual: value.visual as SheetAnswer['visual'],
      tab: typeof value.tab === 'string' ? value.tab : undefined,
      column: typeof value.column === 'string' ? value.column : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Turns an answer into a json-render spec (see the catalog in `sheet-chat-catalog.tsx`). A visual
 * that points at a tab/column the sheet doesn't have is dropped — the text still shows.
 */
export function answerToSpec(answer: SheetAnswer, facts: SheetFacts): Spec {
  const elements: Spec['elements'] = {
    message: { type: 'Message', props: { text: answer.text } },
  };
  const tab = findTab(facts, answer.tab);

  if (answer.visual === 'rowsPerTab' && facts.tabs.length > 0) {
    elements.visual = { type: 'BarChart', props: { title: 'Data rows per tab', tab: null, column: null } };
  } else if (answer.visual === 'rowCount' && tab) {
    elements.visual = { type: 'Stat', props: { label: `Data rows in ${tab.name}`, tab: tab.name } };
  } else if (answer.visual === 'valueCounts' && tab && answer.column && tab.columns.includes(answer.column)) {
    elements.visual = {
      type: 'BarChart',
      props: { title: `${answer.column} in ${tab.name}`, tab: tab.name, column: answer.column },
    };
  } else if (answer.visual === 'table' && tab) {
    elements.visual = { type: 'Table', props: { tab: tab.name, limit: 5 } };
  }

  return {
    root: 'answer',
    elements: {
      answer: { type: 'Answer', props: {}, children: Object.keys(elements) },
      ...elements,
    },
  };
}
