import { answerSchema, answerToSpec, parseSheetAnswer } from './sheet-answer';
import { computeSheetFacts, rowsPerTab, valueCounts } from './sheet-facts';

// Run with: npx tsx app/src/utils/sheet-chat.test.ts
function expectEqual(name: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

const facts = computeSheetFacts({
  Tasks: [
    ['title', 'status', ''],
    ['Write spec', 'done'],
    ['', '', ''],
    ['Ship it', 'todo', 'x'],
    ['Review', 'done'],
  ],
  Settings: [['key', 'value']],
});

expectEqual('header becomes columns, blank header gets its position', facts.tabs[0].columns, [
  'title',
  'status',
  'Column 3',
]);
expectEqual('blank rows are not data rows', facts.tabs[0].rows.length, 3);
expectEqual('rows per tab', rowsPerTab(facts), [
  { label: 'Tasks', value: 3 },
  { label: 'Settings', value: 0 },
]);
expectEqual('value counts, most frequent first', valueCounts(facts.tabs[0], 'status'), [
  { label: 'done', value: 2 },
  { label: 'todo', value: 1 },
]);
expectEqual('value counts of an unknown column', valueCounts(facts.tabs[0], 'nope'), []);

const schema = answerSchema(facts) as { properties: Record<string, { enum?: string[] }> };
expectEqual('schema enumerates the real tabs', schema.properties.tab.enum, ['Tasks', 'Settings']);

expectEqual('parses a valid answer', parseSheetAnswer('{"text":"Hi","visual":"table","tab":"Tasks"}'), {
  text: 'Hi',
  visual: 'table',
  tab: 'Tasks',
  column: undefined,
});
expectEqual('rejects an unknown visual', parseSheetAnswer('{"text":"Hi","visual":"pie"}'), null);
expectEqual('rejects invalid JSON', parseSheetAnswer('not json'), null);

const chart = answerToSpec({ text: 'Statuses', visual: 'valueCounts', tab: 'Tasks', column: 'status' }, facts);
expectEqual('value-counts answer renders a bar chart', chart.elements.visual, {
  type: 'BarChart',
  props: { title: 'status in Tasks', tab: 'Tasks', column: 'status' },
});
expectEqual('root lists the message and the visual', chart.elements.answer.children, ['message', 'visual']);

const unknownTab = answerToSpec({ text: 'Rows', visual: 'rowCount', tab: 'Ghost' }, facts);
expectEqual('a visual on an unknown tab is dropped', unknownTab.elements.answer.children, ['message']);

console.log('ok - sheet chat');
