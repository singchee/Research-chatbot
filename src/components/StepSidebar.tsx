import type { ResearchSession, StepNumber } from '../types';

interface StepSidebarProps {
  session: ResearchSession;
}

const STEP_ITEMS: Array<{ step: StepNumber; label: string }> = [
  { step: 1, label: 'Question Definition' },
  { step: 2, label: 'Literature Background' },
  { step: 3, label: 'Methodology' },
  { step: 4, label: 'Project Artefacts' },
];

export function StepSidebar({ session }: StepSidebarProps) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-white px-5 py-6">
      <div>
        <p className="text-2xl font-bold tracking-tight text-[var(--nh-navy)]">Northern Health</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Research Assistant
        </p>
      </div>

      <div className="mt-8 grow">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Lifecycle Progress
        </h2>
        <ol className="relative ml-1 space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-[var(--border)]">
          {STEP_ITEMS.map((item) => {
            const complete = item.step < session.currentStep;
            const active = item.step === session.currentStep;
            const circleClass = complete
              ? 'bg-[var(--nh-navy)] text-white border-[var(--nh-navy)]'
              : active
                ? 'bg-[var(--nh-teal)] text-white border-[var(--nh-teal)] animate-pulse-soft'
                : 'bg-white text-[var(--text-muted)] border-[var(--border)]';

            return (
              <li key={item.step} className="relative flex items-center gap-3">
                <div
                  className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${circleClass}`}
                >
                  {complete ? '✓' : item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--nh-navy)]">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">Step {item.step}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text-muted)]">
        <p className="font-semibold text-[var(--nh-navy)]">Session Metadata</p>
        <p className="mt-1">PI: {session.piName}</p>
        <p className="mt-1">
          Started:{' '}
          {session.sessionStarted.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p className="mt-1">Current step: {session.currentStep}</p>
      </div>
    </aside>
  );
}
