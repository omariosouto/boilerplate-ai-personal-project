import { JSONUIProvider, Renderer, validateSpec, type Spec } from '@repo/generative-ui';
import { useOnDeviceAi, type OnDeviceAi } from '@repo/on-device-ai';
import { useSheetTabs } from '@repo/sheet-db';
import { Button, Input, useTheme } from '@repo/ui';
import { MessageCircle, Minus, SendHorizontal, X } from 'lucide-react-native';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SheetFactsContext, sheetChatRegistry } from '@/components/sheet-chat-catalog';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { ANSWER_INSTRUCTIONS, answerSchema, answerToSpec, parseSheetAnswer } from '@/utils/sheet-answer';
import { computeSheetFacts, describeSheetFacts } from '@/utils/sheet-facts';

type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; spec: Spec }
  | { id: number; role: 'error'; text: string };

// The chat floats over the page: `fixed` keeps it in the corner while the page scrolls on the web.
const FLOATING_POSITION = Platform.OS === 'web' ? ('fixed' as 'absolute') : 'absolute';

/**
 * A floating chat (bottom-right) that answers questions about the linked spreadsheet with the
 * on-device model (`@repo/on-device-ai`), rendering charts/tables through json-render
 * (`@repo/generative-ui`). Minimize keeps the conversation; close clears it. Both leave the bubble.
 */
export function SheetChat({ spreadsheetId, tabs }: { spreadsheetId: string; tabs: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const ai = useOnDeviceAi();
  const sheet = useSheetTabs({ spreadsheetId, tabs });
  const facts = useMemo(() => computeSheetFacts(sheet.data), [sheet.data]);

  if (!isOpen) return <ChatBubble onPress={() => setIsOpen(true)} />;

  return (
    <ChatPanel
      ai={ai}
      messages={messages}
      setMessages={setMessages}
      isSheetLoading={sheet.isLoading}
      onMinimize={() => setIsOpen(false)}
      onClose={() => {
        setIsOpen(false);
        setMessages([]);
      }}
      facts={facts}
    />
  );
}

function ChatBubble({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open chat"
      onPress={onPress}
      style={({ pressed }) => [styles.bubble, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
      <MessageCircle color={theme.primaryForeground} size={24} />
    </Pressable>
  );
}

function ChatPanel({
  ai,
  messages,
  setMessages,
  isSheetLoading,
  onMinimize,
  onClose,
  facts,
}: {
  ai: OnDeviceAi;
  messages: Message[];
  setMessages: (update: (current: Message[]) => Message[]) => void;
  isSheetLoading: boolean;
  onMinimize: () => void;
  onClose: () => void;
  facts: ReturnType<typeof computeSheetFacts>;
}) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const nextId = useRef(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const canAsk = ai.availability !== 'unavailable' && ai.availability !== 'checking' && !isSheetLoading;

  async function ask() {
    const question = draft.trim();
    if (!question || isThinking || !canAsk) return;
    setDraft('');
    setIsThinking(true);
    setMessages((current) => [...current, { id: nextId.current++, role: 'user', text: question }]);

    let reply: Message;
    try {
      const raw = await ai.prompt(`Spreadsheet summary:\n${describeSheetFacts(facts)}\n\nQuestion: ${question}`, {
        system: ANSWER_INSTRUCTIONS,
        responseConstraint: answerSchema(facts),
      });
      const answer = parseSheetAnswer(raw);
      const spec = answer && answerToSpec(answer, facts);
      reply =
        spec && validateSpec(spec).valid
          ? { id: nextId.current++, role: 'assistant', spec }
          : { id: nextId.current++, role: 'error', text: "I couldn't turn that into an answer. Try rephrasing." };
    } catch (e) {
      reply = {
        id: nextId.current++,
        role: 'error',
        text: e instanceof Error ? e.message : 'Something went wrong.',
      };
    }
    setMessages((current) => [...current, reply]);
    setIsThinking(false);
  }

  const panelSize = {
    width: Math.min(380, width - Spacing.three * 2),
    height: Math.min(560, height - Spacing.three * 2),
  };

  return (
    <View
      style={[styles.panel, panelSize, { backgroundColor: theme.background, borderColor: theme.border }]}
      accessibilityLabel="Sheet chat">
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText type="smallBold" style={styles.headerTitle}>
          Ask your sheet
        </ThemedText>
        <Button variant="ghost" size="icon-sm" accessibilityLabel="Minimize chat" onPress={onMinimize}>
          <Minus color={theme.text} size={16} />
        </Button>
        <Button variant="ghost" size="icon-sm" accessibilityLabel="Close chat" onPress={onClose}>
          <X color={theme.text} size={16} />
        </Button>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        <AvailabilityNotice ai={ai} isSheetLoading={isSheetLoading} isEmpty={messages.length === 0} />
        <SheetFactsContext.Provider value={facts}>
          <JSONUIProvider registry={sheetChatRegistry}>
            {messages.map((message) =>
              message.role === 'assistant' ? (
                <View key={message.id} style={[styles.message, { backgroundColor: theme.backgroundElement }]}>
                  <Renderer spec={message.spec} registry={sheetChatRegistry} includeStandard={false} />
                </View>
              ) : (
                <View
                  key={message.id}
                  style={[
                    styles.message,
                    message.role === 'user'
                      ? [styles.userMessage, { backgroundColor: theme.primary }]
                      : { backgroundColor: theme.backgroundElement },
                  ]}>
                  <ThemedText
                    type="small"
                    style={{
                      color: message.role === 'user' ? theme.primaryForeground : theme.destructive,
                    }}>
                    {message.text}
                  </ThemedText>
                </View>
              )
            )}
          </JSONUIProvider>
        </SheetFactsContext.Provider>
        {isThinking && (
          <ThemedText type="small" themeColor="textSecondary">
            {ai.availability === 'downloading' && ai.downloadProgress !== null
              ? `Downloading the model… ${Math.round(ai.downloadProgress * 100)}%`
              : 'Thinking…'}
          </ThemedText>
        )}
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: theme.border }]}>
        <Input
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={canAsk ? 'How many rows does each tab have?' : 'Chat unavailable'}
          disabled={!canAsk || isThinking}
          onSubmitEditing={ask}
          returnKeyType="send"
        />
        <Button
          size="icon"
          accessibilityLabel="Send"
          disabled={!canAsk || isThinking || !draft.trim()}
          onPress={ask}>
          <SendHorizontal color={theme.primaryForeground} size={16} />
        </Button>
      </View>
    </View>
  );
}

function AvailabilityNotice({
  ai,
  isSheetLoading,
  isEmpty,
}: {
  ai: OnDeviceAi;
  isSheetLoading: boolean;
  isEmpty: boolean;
}) {
  let text: string | null = null;
  if (ai.availability === 'checking') text = 'Checking on-device AI…';
  else if (ai.availability === 'unavailable')
    text = "On-device AI isn't available here. Use Chrome 148+ on a desktop (Windows, macOS, Linux or ChromeOS).";
  else if (isSheetLoading) text = 'Reading your spreadsheet…';
  else if (ai.availability === 'downloadable' && isEmpty)
    text = 'Your first question downloads Gemini Nano to this browser (one time). Everything runs on your device.';
  else if (isEmpty)
    text = 'Ask about your spreadsheet — e.g. "chart the rows per tab". Runs on your device; your data never leaves it.';
  if (!text) return null;
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {text}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: FLOATING_POSITION,
    right: Spacing.three,
    bottom: Spacing.three,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
  },
  pressed: { opacity: 0.85 },
  panel: {
    position: FLOATING_POSITION,
    right: Spacing.three,
    bottom: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1 },
  messages: { flex: 1 },
  messagesContent: { gap: Spacing.two, padding: Spacing.three },
  message: { padding: Spacing.two, borderRadius: Radius.md, maxWidth: '100%' },
  userMessage: { alignSelf: 'flex-end', maxWidth: '85%' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderTopWidth: 1,
  },
  input: { flex: 1 },
});
