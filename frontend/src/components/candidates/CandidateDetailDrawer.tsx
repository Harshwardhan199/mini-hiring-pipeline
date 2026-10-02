import { useState, useEffect } from 'react';
import type { Candidate, CandidateDetail, Stage } from '../../types/candidate.types.ts';
import { candidateService } from '../../services/candidate.service.ts';
import { formatStageDuration, formatShortDate } from '../../utils/date.utils.ts';
import { getAvatarDetails, getStageConfig } from '../../utils/stage.utils.ts';
import { StageBadge } from '../common/Badge.tsx';
import { CandidateHistory } from './CandidateHistory.tsx';
import {
  CloseIcon,
  ArrowRightIcon,
  BanIcon,
  SpinnerIcon,
  MailIcon,
  ClockIcon,
  AlertCircleIcon,
} from '../common/Icons.tsx';

interface CandidateDetailDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onTransitionSuccess: (updated: Candidate, nextStage: Stage) => void;
  onRejectSuccess: (updated: Candidate) => void;
}

export function CandidateDetailDrawer({
  candidate,
  isOpen,
  onClose,
  onTransitionSuccess,
  onRejectSuccess,
}: CandidateDetailDrawerProps) {
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [actionLoading, setActionLoading] = useState<'transition' | 'reject' | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const candidateId = candidate?.id;

  // Fetch full details when candidate changes
  useEffect(() => {
    if (!candidateId) return;

    let isMounted = true;

    candidateService
      .getCandidateById(candidateId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setIsLoadingDetail(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setIsLoadingDetail(false);
          const error = err as { message?: string };
          setErrorMessage(error?.message || 'Failed to load candidate details');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [candidateId]);

  // Handle escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        if (showRejectConfirm) {
          setShowRejectConfirm(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showRejectConfirm, onClose]);

  if (!isOpen || !candidate) return null;

  const currentStage = detail?.current_stage || candidate.current_stage;
  const stageConfig = getStageConfig(currentStage);
  const avatar = getAvatarDetails(candidate.name);

  const nextStage = candidateService.getNextStage(currentStage);
  const canAdvance = candidateService.canAdvance(currentStage);
  const canReject = candidateService.canReject(currentStage);

  const stageDate = detail?.current_stage_since || candidate.current_stage_since || candidate.created_at;
  const formattedSince = formatShortDate(stageDate);
  const durationText = formatStageDuration(stageDate);

  const handleAdvance = async () => {
    if (!nextStage || actionLoading) return;
    setActionLoading('transition');
    setErrorMessage(null);

    try {
      const updated = await candidateService.advanceStage(candidate.id, nextStage);
      onTransitionSuccess(updated, nextStage);
      // Reload detail
      const refreshedDetail = await candidateService.getCandidateById(candidate.id);
      setDetail(refreshedDetail);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMessage(error?.message || 'Failed to advance candidate stage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (actionLoading) return;
    setActionLoading('reject');
    setErrorMessage(null);

    try {
      const updated = await candidateService.rejectCandidate(candidate.id);
      setShowRejectConfirm(false);
      onRejectSuccess(updated);
      // Reload detail
      const refreshedDetail = await candidateService.getCandidateById(candidate.id);
      setDetail(refreshedDetail);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMessage(error?.message || 'Failed to reject candidate');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <aside className="w-screen sm:w-[440px] max-w-full bg-white sm:border-l border-slate-200 shadow-xl flex flex-col h-full overflow-hidden transition-transform duration-200 animate-in slide-in-from-right">
          {/* Header */}
          <div className="p-5 border-b border-slate-200/80 bg-white sticky top-0 z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-medium text-sm border border-slate-100 ${avatar.bg} ${avatar.text}`}
                >
                  {avatar.initials}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 truncate">
                    {candidate.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                    <span className="truncate">{candidate.email}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                aria-label="Close candidate details"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Current Stage Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-normal">Stage:</span>
              <StageBadge stage={currentStage} size="sm" />
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Error banner if action failed */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* Current Stage Info Box */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Current Stage
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {stageConfig.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-[11px] text-slate-400 block">Entered Stage</span>
                  <span className="text-xs font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                    Since {formattedSince}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Time in Stage</span>
                  <span className="text-xs font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                    <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                    {durationText}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </h4>

              {canAdvance || canReject ? (
                <div className="space-y-2">
                  {/* Advance button */}
                  {canAdvance && nextStage && (
                    <button
                      type="button"
                      disabled={!!actionLoading}
                      onClick={handleAdvance}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-sm font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    >
                      {actionLoading === 'transition' ? (
                        <>
                          <SpinnerIcon className="w-4 h-4 text-white" />
                          <span>Moving to {nextStage}...</span>
                        </>
                      ) : (
                        <>
                          <span>Move to {nextStage}</span>
                          <ArrowRightIcon className="w-4 h-4 text-slate-300" />
                        </>
                      )}
                    </button>
                  )}

                  {/* Reject button */}
                  {canReject && !showRejectConfirm && (
                    <button
                      type="button"
                      disabled={!!actionLoading}
                      onClick={() => setShowRejectConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-rose-50/50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      <BanIcon className="w-3.5 h-3.5" />
                      <span>Reject candidate</span>
                    </button>
                  )}

                  {/* Rejection confirmation dialog */}
                  {showRejectConfirm && (
                    <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2 text-rose-800">
                        <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-rose-900">
                            Reject {candidate.name}?
                          </p>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            This candidate will be moved to the terminal <strong>Rejected</strong> status.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setShowRejectConfirm(false)}
                          disabled={actionLoading === 'reject'}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={actionLoading === 'reject'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 rounded-lg transition-colors shadow-2xs"
                        >
                          {actionLoading === 'reject' ? (
                            <>
                              <SpinnerIcon className="w-3 h-3 text-white" />
                              <span>Rejecting...</span>
                            </>
                          ) : (
                            <span>Confirm Rejection</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-xs text-slate-500 font-medium">
                    {currentStage === 'Hired'
                      ? 'Candidate is hired. No further stage transitions.'
                      : 'Candidate was rejected. No further actions.'}
                  </span>
                </div>
              )}
            </div>

            {/* History Section */}
            <div className="pt-2 border-t border-slate-200/80">
              {isLoadingDetail ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <SpinnerIcon className="w-5 h-5 text-slate-400" />
                  <span className="text-xs">Loading stage history...</span>
                </div>
              ) : (
                <CandidateHistory history={detail?.history || []} />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
