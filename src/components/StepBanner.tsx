import type { StepNumber } from '../types';

interface StepBannerProps {
  from: StepNumber;
  to: StepNumber;
}

export function StepBanner({ from, to }: StepBannerProps) {
  return (
    <div className="animate-slide-in rounded-md bg-[var(--nh-navy)] px-4 py-3 text-sm font-semibold tracking-wide text-white">
      <span className="mr-2">✓</span>
      STEP {from} COMPLETE <span className="mx-2">→</span> STEP {to}
    </div>
  );
}
