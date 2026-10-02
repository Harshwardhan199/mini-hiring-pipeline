import { useState, useEffect } from 'react';
import type { Candidate, PipelineStage } from '../../types/candidate.types.ts';
import { PIPELINE_STAGES } from '../../services/candidate.service.ts';
import { getStageConfig } from '../../utils/stage.utils.ts';
import { CandidateCard } from './CandidateCard.tsx';
import { CandidateColumn } from './CandidateColumn.tsx';
import { ChevronLeftIcon, ChevronRightIcon } from '../common/Icons.tsx';

interface CandidatePipelineProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  selectedCandidateId?: number | null;
}

export function CandidatePipeline({
  candidates,
  onSelectCandidate,
  selectedCandidateId,
}: CandidatePipelineProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'stage' | 'all'>('stage');

  // Group candidates by stage
  const candidatesByStage = PIPELINE_STAGES.reduce<Record<PipelineStage, Candidate[]>>(
    (acc, stage) => {
      acc[stage] = candidates.filter((c) => c.current_stage === stage);
      return acc;
    },
    {
      Applied: [],
      Screening: [],
      Interview: [],
      Offer: [],
      Hired: [],
    }
  );

  const currentStage = PIPELINE_STAGES[currentStageIndex];
  const currentConfig = getStageConfig(currentStage);
  const currentCandidates = candidatesByStage[currentStage];
  const currentCandidatesCount = currentCandidates.length;

  const prevStage = currentStageIndex > 0 ? PIPELINE_STAGES[currentStageIndex - 1] : null;
  const nextStage =
    currentStageIndex < PIPELINE_STAGES.length - 1
      ? PIPELINE_STAGES[currentStageIndex + 1]
      : null;

  const handlePrevStage = () => {
    if (prevStage) {
      setCurrentStageIndex((idx) => Math.max(0, idx - 1));
    }
  };

  const handleNextStage = () => {
    if (nextStage) {
      setCurrentStageIndex((idx) => Math.min(PIPELINE_STAGES.length - 1, idx + 1));
    }
  };

  // Keyboard navigation with ArrowLeft / ArrowRight
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        setCurrentStageIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentStageIndex((idx) => Math.min(PIPELINE_STAGES.length - 1, idx + 1));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      {/* Stage Controller: < (btn to previous) ("Stage Name") > (btn to next stage) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="grid grid-cols-3 items-center gap-2">
          {/* < (btn to previous stage) */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handlePrevStage}
              disabled={!prevStage}
              aria-label={prevStage ? `Go to previous stage: ${prevStage}` : 'No previous stage'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed rounded-xl border border-slate-200/80 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/10 shrink-0"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{prevStage || 'Previous'}</span>
            </button>
          </div>

          {/* Center: ("Stage Name") locked dead-center at 50% */}
          <div className="flex flex-col items-center justify-center min-w-0 px-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {currentConfig.label}
              </h2>
            </div>

            {/* Stage Progress Dots / Stepper */}
            <div className="flex items-center justify-center gap-2 mt-2">
              {PIPELINE_STAGES.map((stg, idx) => {
                const isCurrent = idx === currentStageIndex;
                const dotConfig = getStageConfig(stg);
                return (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => setCurrentStageIndex(idx)}
                    title={`Jump to ${stg}`}
                    className={`transition-all rounded-full ${
                      isCurrent
                        ? `w-6 h-2 ${dotConfig.dotColor}`
                        : 'w-2 h-2 bg-slate-200 hover:bg-slate-400'
                    }`}
                    aria-label={`Stage ${idx + 1}: ${stg}`}
                  />
                );
              })}
              <span className="text-[11px] text-slate-400 ml-1 font-medium hidden md:inline">
                Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length}
              </span>
            </div>
          </div>

          {/* > (btn to next stage) */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNextStage}
              disabled={!nextStage}
              aria-label={nextStage ? `Go to next stage: ${nextStage}` : 'No next stage'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed rounded-xl border border-slate-200/80 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/10 shrink-0"
            >
              <span className="hidden sm:inline">{nextStage || 'Next'}</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View mode toggle: Stage View vs. All Columns */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="hidden sm:inline">
            Use <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200">&larr;</kbd>{' '}
            and <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200">&rarr;</kbd> arrow keys to navigate stages
          </span>
          <span className="sm:hidden">
            Stage {currentStageIndex + 1} of {PIPELINE_STAGES.length}
          </span>

          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('stage')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'stage'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Stage View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All Columns
            </button>
          </div>
        </div>
      </div>

      {/* Content Area Below:
          In 'stage' mode: Shows ONLY candidates corresponding to the current < ("Stage Name") >
          In 'all' mode: Shows all 5 columns
      */}
      {viewMode === 'stage' ? (
        <div className="bg-slate-50/75 rounded-2xl p-4 sm:p-5 border border-slate-200/70 transition-all">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${currentConfig.dotColor}`} />
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight">
                {currentConfig.label} Candidates
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {currentCandidatesCount} {currentCandidatesCount === 1 ? 'candidate' : 'candidates'}
            </span>
          </div>

          {currentCandidates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {currentCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={onSelectCandidate}
                  isSelected={selectedCandidateId === candidate.id}
                />
              ))}
            </div>
          ) : (
            <div className="h-44 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-6 text-center">
              <div
                className={`w-9 h-9 rounded-xl mb-2 flex items-center justify-center ${currentConfig.badgeBg}`}
              >
                <span className={`w-2 h-2 rounded-full ${currentConfig.dotColor}`} />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                No candidates in {currentConfig.label}
              </span>
              <span className="text-xs text-slate-400 mt-1 max-w-sm">
                Candidates who enter or move into {currentConfig.label} will be shown here.
              </span>
            </div>
          )}
        </div>
      ) : (
        /* All Columns Kanban layout */
        <div className="flex xl:grid xl:grid-cols-5 gap-3.5 overflow-x-auto pb-4 xl:overflow-x-visible xl:pb-0 scroll-smooth snap-x snap-mandatory">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="flex-1 min-w-0">
              <CandidateColumn
                stage={stage}
                candidates={candidatesByStage[stage]}
                onSelectCandidate={onSelectCandidate}
                selectedCandidateId={selectedCandidateId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
