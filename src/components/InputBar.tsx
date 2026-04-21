import { useState } from 'react';

interface InputBarProps {
  disabled?: boolean;
  showExampleChips?: boolean;
  onSend: (value: string) => Promise<void>;
}

const EXAMPLE_CHIPS = [
  'I want to study sepsis outcomes in ICU patients',
  'I have a QI idea about medication reconciliation',
  'Can we look at frailty and readmission in our ED?',
];

export function InputBar({ disabled = false, showExampleChips = true, onSend }: InputBarProps) {
  const [value, setValue] = useState('');

  const submit = async () => {
    if (!value.trim() || disabled) {
      return;
    }
    const payload = value;
    setValue('');
    await onSend(payload);
  };

  return (
    <div className="border-t border-[var(--border)] bg-white px-4 py-4">
      {showExampleChips ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setValue(chip)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)] transition hover:border-[var(--nh-teal)] hover:text-[var(--nh-teal)]"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          placeholder="Start by describing your research idea below."
          rows={3}
          className="min-h-[72px] flex-1 resize-y rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--nh-teal)] focus:ring-2 focus:ring-[var(--nh-teal)]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          onKeyDown={async (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              await submit();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setValue('');
            }
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="rounded-lg bg-[var(--nh-navy)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        Enter to send · Shift+Enter for newline · Esc to clear
      </p>
    </div>
  );
}
