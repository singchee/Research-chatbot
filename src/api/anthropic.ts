const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicStreamEvent {
  type?: string;
  delta?: { text?: string };
  error?: { message?: string };
}

export async function sendMessage(
  messages: ApiMessage[],
  systemPrompt: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error(
      'Missing Anthropic API key. Set VITE_ANTHROPIC_API_KEY in your environment.',
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const fallback = `Anthropic request failed (${response.status})`;
    let details = fallback;
    try {
      const body = await response.json();
      details = body?.error?.message ?? fallback;
    } catch {
      // Keep fallback message when response body is not JSON.
    }
    throw new Error(details);
  }

  if (!response.body) {
    throw new Error('Anthropic response stream was empty.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let assembled = '';

  const parseEventData = (eventBlock: string): AnthropicStreamEvent | null => {
    const dataLines = eventBlock
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6))
      .join('\n');

    if (!dataLines || dataLines === '[DONE]') {
      return null;
    }

    try {
      return JSON.parse(dataLines) as AnthropicStreamEvent;
    } catch {
      return null;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const eventBlock of events) {
      const parsed = parseEventData(eventBlock);
      if (!parsed) {
        continue;
      }

      if (parsed.type === 'error' && parsed.error?.message) {
        throw new Error(parsed.error.message);
      }

      if (parsed.type === 'content_block_delta') {
        const deltaText = parsed.delta?.text ?? '';
        if (deltaText) {
          assembled += deltaText;
          onChunk?.(deltaText);
        }
      }
    }
  }

  return assembled;
}
