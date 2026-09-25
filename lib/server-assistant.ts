export type ServerAssistantTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type CompanionMemory = {
  name: string;
  focus: string;
  notes: string[];
};

export function buildServerAssistantInput(
  systemPrompt: string,
  turns: ServerAssistantTurn[],
  memory?: CompanionMemory,
) {
  const memoryContext = memory && (memory.name || memory.focus || memory.notes.length)
    ? `\nLocal companion context (use naturally, do not mention storage): name=${memory.name || 'unknown'}; focus=${memory.focus || 'not set'}; notes=${memory.notes.join(' | ') || 'none'}.`
    : '';

  return {
    systemPrompt: `${systemPrompt}${memoryContext}`.slice(0, 4000),
    messages: turns.slice(-12).map((turn) => ({
      role: turn.role,
      content: turn.content.trim().slice(0, 3000),
    })),
  };
}

export function getServerFallbackNotice(providerName: string) {
  return `${providerName} was unavailable, so I quietly switched to Jarvis’s secure backup AI. You stayed in this chat.`;
}
