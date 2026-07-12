// Auto-titles for conversations, ChatGPT/Claude style. Tries the LLM with a
// strict short prompt; anything that doesn't look like a title (dev-mock
// paragraphs, refusals, over-length output) falls back to a heuristic cut of
// the first user message — so a title always lands, online or offline.
import { ApiService } from './api.ts';

const MAX_TITLE_LENGTH = 48;

export function heuristicTitle(firstMessage: string): string {
  const cleaned = firstMessage
    .replace(/\s+/g, ' ')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .trim();
  if (!cleaned) return 'New chat';
  if (cleaned.length <= MAX_TITLE_LENGTH) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).replace(/[.?!,;:]+$/, '');
  }
  // Cut at a word boundary
  const slice = cleaned.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 20 ? slice.slice(0, lastSpace) : slice;
  return cut.charAt(0).toUpperCase() + cut.slice(1).replace(/[.?!,;:]+$/, '') + '…';
}

export async function generateConversationTitle(
  firstMessage: string,
  model?: string
): Promise<string> {
  try {
    const prompt =
      'Generate a concise 3–6 word title for a conversation that starts with the ' +
      'following message. Reply with ONLY the title — no quotes, no punctuation at ' +
      'the end, no explanation.\n\nMessage: """' +
      firstMessage.slice(0, 500) +
      '"""';
    const result = await ApiService.sendMessage(prompt, model);
    const title = result.response
      .split('\n')[0]
      .trim()
      .replace(/^["'`#*\s]+|["'`.*\s]+$/g, '');
    // Reject anything that doesn't look like a title (e.g. the offline mock
    // responses are full paragraphs and blow past this length check).
    if (title.length >= 3 && title.length <= 60 && !/\bdevelopment environment\b/i.test(result.response)) {
      return title;
    }
  } catch {
    // fall through to heuristic
  }
  return heuristicTitle(firstMessage);
}
