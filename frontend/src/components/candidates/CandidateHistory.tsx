import type { StageEvent } from '../../types/candidate.types.ts';
import { formatDateTime } from '../../utils/date.utils.ts';
import { getStageConfig } from '../../utils/stage.utils.ts';
import { ArrowRightIcon } from '../common/Icons.tsx';

interface CandidateHistoryProps {
  history: StageEvent[];
}

export function CandidateHistory({ history }: CandidateHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-xs text-slate-400 py-3 text-center">
        No stage events recorded
      </div>
    );
  }

  // Display newest first (audit trail with latest event at the top)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Stage History
        </h4>
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute top-2 bottom-2 left-2.5 w-px bg-slate-200" aria-hidden="true" />

        {sortedHistory.map((event, index) => {
          const toStageConfig = getStageConfig(event.to_stage);
          const isLatest = index === 0;

          return (
            <div key={event.id || `${event.to_stage}-${event.occurred_at}`} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${isLatest
                    ? `${toStageConfig.dotColor} ring-3 ring-slate-100`
                    : 'bg-slate-300'
                  }`}
                aria-hidden="true"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Event Content */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    {event.from_stage ? (
                      <>
                        <span className="text-slate-600">{event.from_stage}</span>
                        <ArrowRightIcon className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className={toStageConfig.badgeText}>{event.to_stage}</span>
                      </>
                    ) : (
                      <span className={toStageConfig.badgeText}>{event.to_stage}</span>
                    )}
                  </div>

                  <time
                    dateTime={event.occurred_at}
                    className="text-[11px] text-slate-400 font-normal shrink-0"
                  >
                    {formatDateTime(event.occurred_at)}
                  </time>
                </div>

                <div className="mt-1 text-[11px] text-slate-500">
                  {event.from_stage ? (
                    <span>Transitioned into {event.to_stage}</span>
                  ) : (
                    <span>Candidate application received</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
