import type { GeneratedFile, Message, StepTransition } from '../types';
import { DocumentCard } from './DocumentCard';
import { MessageBubble } from './MessageBubble';
import { StepBanner } from './StepBanner';

interface ChatThreadProps {
  messages: Message[];
  transitions: StepTransition[];
  generatedFiles: GeneratedFile[];
  error: string | null;
  onRetry: () => void;
  onDismissError: () => void;
  isStreaming: boolean;
  streamingContent: string;
  onDownloadFile: (file: GeneratedFile) => void;
}

export function ChatThread({
  messages,
  transitions,
  generatedFiles,
  error,
  onRetry,
  onDismissError,
  isStreaming,
  streamingContent,
  onDownloadFile,
}: ChatThreadProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-5">
      {messages.map((message) => {
        const messageTransitions = transitions.filter(
          (transition) => transition.afterMessageId === message.id,
        );
        return (
          <div key={message.id} className="space-y-3">
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <MessageBubble message={message} />
            </div>
            {messageTransitions.map((transition) => (
              <StepBanner key={transition.id} from={transition.from} to={transition.to} />
            ))}
          </div>
        );
      })}

      {isStreaming && streamingContent && (
        <div className="flex justify-start">
          <MessageBubble
            message={{
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date(),
            }}
            isStreaming
          />
        </div>
      )}

      {isStreaming && !streamingContent && (
        <div className="mr-auto flex items-center gap-2 rounded-[16px_16px_16px_4px] border border-[var(--border)] bg-white px-4 py-3">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--nh-teal)] [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--nh-teal)] [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--nh-teal)]" />
        </div>
      )}

      {error ? (
        <div className="rounded-lg border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-900">
          <p className="mb-2 font-medium">Unable to reach Anthropic API: {error}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md bg-[var(--nh-teal)] px-3 py-2 text-xs font-semibold text-white"
              onClick={onRetry}
            >
              Retry
            </button>
            <button
              type="button"
              className="rounded-md border border-amber-700 px-3 py-2 text-xs font-semibold text-amber-900"
              onClick={onDismissError}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {generatedFiles.length > 0 && (
        <section className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Generated Documents
          </h3>
          {generatedFiles.map((file) => (
            <DocumentCard key={file.filename} file={file} onDownload={onDownloadFile} />
          ))}
        </section>
      )}
    </div>
  );
}
