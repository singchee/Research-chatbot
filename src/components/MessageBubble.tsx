import ReactMarkdown from 'react-markdown';

import type { Message } from '../types';

interface MessageBubbleProps {
  message: Pick<Message, 'role' | 'content' | 'timestamp'>;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const bubbleBase = isUser
    ? 'ml-auto bg-[var(--nh-navy)] text-white rounded-[16px_16px_4px_16px]'
    : 'mr-auto bg-white text-[var(--text-primary)] border border-[var(--border)] rounded-[16px_16px_16px_4px]';

  return (
    <div className={`max-w-[85%] px-4 py-3 shadow-sm ${bubbleBase}`}>
      {isUser ? (
        <p className="m-0 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
      ) : (
        <div className="text-sm leading-6 text-[var(--text-primary)]">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="my-2 whitespace-pre-wrap">{children}</p>,
              ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              h1: ({ children }) => (
                <h1 className="my-2 text-base font-semibold text-[var(--nh-navy)]">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="my-2 text-base font-semibold text-[var(--nh-navy)]">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="my-2 text-sm font-semibold text-[var(--nh-navy)]">{children}</h3>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-[var(--nh-navy)]">{children}</strong>
              ),
              code: ({ children }) => (
                <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-xs">{children}</code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}
      {isStreaming && (
        <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-[var(--nh-teal)] align-middle" />
      )}
      <div
        className={`mt-2 text-[11px] ${
          isUser ? 'text-white/70' : 'text-[var(--text-muted)]'
        }`}
      >
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
