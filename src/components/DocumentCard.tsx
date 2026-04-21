import type { GeneratedFile } from '../types';

interface DocumentCardProps {
  file: GeneratedFile;
  onDownload: (file: GeneratedFile) => void;
}

export function DocumentCard({ file, onDownload }: DocumentCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="text-2xl">{file.type === 'docx' ? '📄' : '📊'}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--nh-navy)]">{file.filename}</p>
        {file.note ? <p className="mt-1 text-xs text-[var(--text-muted)]">{file.note}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onDownload(file)}
        className="rounded-md bg-[var(--nh-teal)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
      >
        Download
      </button>
    </div>
  );
}
