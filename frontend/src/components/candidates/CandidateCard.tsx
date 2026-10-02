import type { Candidate } from '../../types/candidate.types.ts';
import { formatStageDuration } from '../../utils/date.utils.ts';
import { getAvatarDetails, getStageConfig } from '../../utils/stage.utils.ts';

interface CandidateCardProps {
  candidate: Candidate;
  onClick: (candidate: Candidate) => void;
  isSelected?: boolean;
}

export function CandidateCard({ candidate, onClick, isSelected = false }: CandidateCardProps) {
  const avatar = getAvatarDetails(candidate.name);
  const stageConfig = getStageConfig(candidate.current_stage);

  // Compute duration using current_stage_since or fallback to created_at
  const stageDate = candidate.current_stage_since || candidate.created_at;
  const durationText = formatStageDuration(stageDate);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(candidate)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(candidate);
        }
      }}
      className={`group relative w-full text-left bg-white rounded-xl border p-3.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
        isSelected
          ? 'border-slate-900 ring-1 ring-slate-900 shadow-xs'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs hover:bg-slate-50/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar Initials */}
        <div
          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-medium text-xs border border-slate-100 ${avatar.bg} ${avatar.text}`}
        >
          {avatar.initials}
        </div>

        {/* Candidate Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-sm font-semibold text-slate-900 truncate tracking-tight group-hover:text-slate-950">
              {candidate.name}
            </h4>
          </div>

          <p className="text-xs text-slate-500 truncate mt-0.5" title={candidate.email}>
            {candidate.email}
          </p>

          {/* Status & Duration footer */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-normal">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${stageConfig.dotColor}`}
              aria-hidden="true"
            />
            <span className="truncate">
              {durationText} in {candidate.current_stage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
