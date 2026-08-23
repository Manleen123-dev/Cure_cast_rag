function formatCheckedAt(value) {
  if (!value) {
    return "Saved result";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function HistoryPanel({
  history,
  onRestore,
  onRemove,
}) {
  return (
    <aside className="medical-card h-fit overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Past Checks
          </p>

          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-50 px-2 text-xs font-bold text-brand-700">
            {history.length}
          </span>
        </div>

        <span className="text-xs text-slate-400">Recent</span>
      </div>

      {/* Content */}
      <div className="p-5">
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
            <p className="text-sm font-medium text-slate-700">
              No saved checks yet
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your previous symptom checks will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const disease =
                entry.prediction?.disease ||
                "Prediction unavailable";

              const confidence =
                entry.prediction?.confidence ?? 0;

              const symptoms =
                entry.selectedSymptoms || [];

              return (
                <article
                  key={entry.id}
                  className="
                    group
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-4
                    transition-all
                    duration-200
                    hover:border-slate-300
                    hover:shadow-sm
                  "
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        {formatCheckedAt(entry.checkedAt)}
                      </p>

                      <h3 className="mt-1.5 truncate text-sm font-bold text-slate-900">
                        {disease}
                      </h3>
                    </div>

                    {/* Confidence */}
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
                      {confidence.toFixed(1)}%
                    </span>
                  </div>

                  {/* Symptoms */}
                  {symptoms.length > 0 && (
                    <div className="mt-3">
                      <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                        {symptoms.join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRestore(entry)}
                      className="
                        flex-1
                        rounded-xl
                        bg-slate-950
                        px-3
                        py-2
                        text-xs
                        font-bold
                        text-white
                        transition
                        hover:bg-slate-800
                        active:scale-[0.98]
                      "
                    >
                      Reopen
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(entry.id)}
                      className="
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-2
                        text-xs
                        font-semibold
                        text-slate-500
                        transition
                        hover:border-rose-200
                        hover:bg-rose-50
                        hover:text-rose-600
                        active:scale-[0.98]
                      "
                      aria-label={`Remove history item for ${disease}`}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}