import { useState } from 'react';

import type { SummaryBlock } from '../types';

interface SummaryPanelProps {
  summaryBlock: SummaryBlock | null;
}

export function SummaryPanel({ summaryBlock }: SummaryPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${collapsed ? 'w-12' : 'w-[320px]'} flex h-full shrink-0 border-l border-[var(--border)] bg-white transition-all duration-200`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="h-full w-12 border-r border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface)]"
        aria-label={collapsed ? 'Open summary panel' : 'Collapse summary panel'}
      >
        {collapsed ? '◀' : '▶'}
      </button>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Current Step Summary
          </h2>
          {summaryBlock ? (
            <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--nh-teal)]">
                Step {summaryBlock.step}
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-[var(--text-primary)]">
                {summaryBlock.content}
              </pre>
              {summaryBlock.confirmedAt ? (
                <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                  Confirmed{' '}
                  {summaryBlock.confirmedAt.toLocaleString([], {
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
              No summary block detected yet. Step summaries will appear here after assistant
              responses include structured markers.
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
