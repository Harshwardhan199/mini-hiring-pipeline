import type { Candidate, Stage } from '../../types/candidate.types.ts';
import { getStageConfig } from '../../utils/stage.utils.ts';
import { CandidateCard } from './CandidateCard.tsx';

interface CandidateColumnProps {
  stage: Stage;
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  selectedCandidateId?: number | null;
}

export function CandidateColumn({
  stage,
  candidates,
  onSelectCandidate,
  selectedCandidateId,
}: CandidateColumnProps) {
  const config = getStageConfig(stage);

  return (
    <div
      id={`pipeline-column-${stage.toLowerCase()}`}
      className="flex flex-col w-[85vw] sm:w-[320px] xl:w-auto xl:min-w-0 xl:flex-1 shrink-0 xl:shrink snap-center sm:snap-start bg-slate-50/75 rounded-2xl p-3 border border-slate-200/70 transition-all"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 py-1 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight truncate">
            {config.label}
          </h3>
        </div>

        {/* Count Chip */}
        <span
          className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium rounded-full shrink-0 ${
            candidates.length > 0
              ? 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
              : 'text-slate-400'
          }`}
        >
          {candidates.length}
        </span>
      </div>

      {/* Candidates List / Scroll area */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5 max-h-[58vh] sm:max-h-[65vh] xl:max-h-[calc(100vh-275px)] min-h-[140px]">
        {candidates.length > 0 ? (
          candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={onSelectCandidate}
              isSelected={selectedCandidateId === candidate.id}
            />
          ))
        ) : (
          <div className="h-28 rounded-xl border border-dashed border-slate-200/90 flex flex-col items-center justify-center p-3 text-center">
            <span className="text-xs font-medium text-slate-400">No candidates</span>
            <span className="text-[11px] text-slate-400/80 mt-0.5">
              Empty in {config.label.toLowerCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
