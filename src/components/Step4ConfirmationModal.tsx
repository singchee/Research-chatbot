import type { Step4Details } from '../types';

interface Step4ConfirmationModalProps {
  isOpen: boolean;
  details: Step4Details;
  canGenerate: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onChange: (next: Step4Details) => void;
}

const SITES = ['EPP', 'BMS', 'CRB', 'BUN'] as const;

export function Step4ConfirmationModal({
  isOpen,
  details,
  canGenerate,
  onClose,
  onGenerate,
  onChange,
}: Step4ConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--border)] bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-[var(--nh-navy)]">Confirm before generating</h2>

        <div className="mt-4 space-y-4 text-sm">
          <label className="block">
            <span className="mb-1 block font-medium text-[var(--nh-navy)]">
              Study acronym (2–6 chars)
            </span>
            <input
              value={details.studyAcronym}
              onChange={(event) =>
                onChange({
                  ...details,
                  studyAcronym: event.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6),
                })
              }
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--nh-teal)]"
            />
          </label>

          <fieldset>
            <legend className="mb-2 font-medium text-[var(--nh-navy)]">
              Site code(s): EPP / BMS / CRB / BUN
            </legend>
            <div className="flex flex-wrap gap-2">
              {SITES.map((site) => {
                const selected = details.sites.includes(site);
                return (
                  <button
                    key={site}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      selected
                        ? 'border-[var(--nh-teal)] bg-[var(--nh-teal)] text-white'
                        : 'border-[var(--border)] bg-white text-[var(--text-muted)]'
                    }`}
                    onClick={() => {
                      const nextSites = selected
                        ? details.sites.filter((item) => item !== site)
                        : [...details.sites, site];
                      onChange({ ...details, sites: nextSites });
                    }}
                  >
                    {site}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1 block font-medium text-[var(--nh-navy)]">
              Anticipated enrolment n
            </span>
            <input
              type="number"
              min={1}
              value={details.enrolment}
              onChange={(event) =>
                onChange({
                  ...details,
                  enrolment: event.target.value ? Number(event.target.value) : '',
                })
              }
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--nh-teal)]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-medium text-[var(--nh-navy)]">Co-investigators</span>
            <input
              value={details.coInvestigators}
              onChange={(event) => onChange({ ...details, coInvestigators: event.target.value })}
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--nh-teal)]"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="rounded-md bg-[var(--nh-teal)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate Files
          </button>
        </div>
      </div>
    </div>
  );
}
