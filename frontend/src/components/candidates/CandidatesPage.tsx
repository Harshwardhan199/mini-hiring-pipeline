import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Candidate, Stage } from '../../types/candidate.types.ts';
import type { SearchCandidate, SearchResponse } from '../../types/search.types.ts';
import { candidateService } from '../../services/candidate.service.ts';
import { CandidatePipeline } from './CandidatePipeline.tsx';
import { CandidateCard } from './CandidateCard.tsx';
import { CandidateDetailDrawer } from './CandidateDetailDrawer.tsx';
import { AddCandidateModal } from './AddCandidateModal.tsx';
import { SearchSection } from './SearchSection.tsx';
import { CandidateSkeleton } from './CandidateSkeleton.tsx';
import { Toast, type ToastMessage } from '../common/Toast.tsx';
import { PlusIcon, RefreshIcon, AlertCircleIcon, BanIcon, SparklesIcon } from '../common/Icons.tsx';

/** How many ms to wait after the last keystroke before firing the search API call */
const SEARCH_DEBOUNCE_MS = 500;

/**
 * Map a SearchCandidate (from the search API) to a Candidate,
 * preferring the richer local copy when available.
 */
function toCandidate(r: SearchCandidate, local: Map<number, Candidate>): Candidate {
  const cached = local.get(r.id);
  if (cached) return cached;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    current_stage: r.current_stage,
    created_at: r.created_at,
    current_stage_since: r.current_stage_since ?? undefined,
  };
}

export function CandidatesPage() {
  // ── Master candidate list (loaded once, kept in sync after mutations) ──
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── View controls ──
  const [viewTab, setViewTab] = useState<'active' | 'rejected'>('active');

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Modals & Drawers ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ id: `${Date.now()}-${Math.random()}`, type, message });
    },
    []
  );

  // ── Fast lookup map: id → Candidate ──
  const candidateMap = useMemo<Map<number, Candidate>>(() => {
    const m = new Map<number, Candidate>();
    candidates.forEach((c) => m.set(c.id, c));
    return m;
  }, [candidates]);

  // ── Load all candidates ──
  const handleReload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await candidateService.getCandidates();
      setCandidates(data);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Unable to load candidates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    candidateService
      .getCandidates()
      .then((data) => {
        if (isMounted) { setCandidates(data); setIsLoading(false); }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const apiErr = err as { message?: string };
          setError(apiErr?.message || 'Unable to load candidates. Please try again.');
          setIsLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // ── Re-run the active search query (used after mutations while search is active) ──
  const activeQueryRef = useRef('');
  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await candidateService.searchCandidates(trimmed);
      setSearchResponse(result);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setSearchError(apiErr?.message || 'Search failed. Please try again.');
      setSearchResponse(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ── Debounced search effect ──
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = searchQuery.trim();
    activeQueryRef.current = trimmed;

    if (!trimmed) {
      setSearchResponse(null);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => runSearch(trimmed), SEARCH_DEBOUNCE_MS);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchQuery, runSearch]);

  // ── Handlers ──
  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => setIsDrawerOpen(false);

  const handleTransitionSuccess = (updatedCandidate: Candidate, nextStage: Stage) => {
    const patch = { ...updatedCandidate, current_stage: nextStage, current_stage_since: new Date().toISOString() };
    setCandidates((prev) => prev.map((c) => (c.id === updatedCandidate.id ? { ...c, ...patch } : c)));
    setSelectedCandidate((prev) => prev?.id === updatedCandidate.id ? { ...prev, ...patch } : prev);
    showToast(`${updatedCandidate.name} moved to ${nextStage}`, 'success');
    // Re-run search so result set stays accurate
    if (activeQueryRef.current) runSearch(activeQueryRef.current);
  };

  const handleRejectSuccess = (rejectedCandidate: Candidate) => {
    const patch = { ...rejectedCandidate, current_stage: 'Rejected' as Stage, current_stage_since: new Date().toISOString() };
    setCandidates((prev) => prev.map((c) => (c.id === rejectedCandidate.id ? { ...c, ...patch } : c)));
    setSelectedCandidate((prev) => prev?.id === rejectedCandidate.id ? { ...prev, ...patch } : prev);
    showToast(`${rejectedCandidate.name} has been marked as Rejected`, 'info');
    // Re-run search so result set stays accurate
    if (activeQueryRef.current) runSearch(activeQueryRef.current);
  };

  const handleCandidateAdded = (newCandidate: Candidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    showToast(`Added candidate ${newCandidate.name}`, 'success');
    if (viewTab === 'rejected') setViewTab('active');
  };

  // ── Derived state ──
  const isSearchActive = searchQuery.trim().length > 0;

  /**
   * Search results as Candidate[], preserving backend ordering.
   * Only populated when isSearchActive and we have a valid candidate_search response.
   */
  const searchResultCandidates = useMemo<Candidate[]>(() => {
    if (!isSearchActive || !searchResponse) return [];
    if (searchResponse.interpreted_query.query_type === 'invalid') return [];
    return searchResponse.results.map((r) => toCandidate(r, candidateMap));
  }, [isSearchActive, searchResponse, candidateMap]);

  // Normal (non-search) partition
  const totalActiveCount = useMemo(
    () => candidates.filter((c) => c.current_stage !== 'Rejected').length,
    [candidates]
  );
  const totalRejectedCount = useMemo(
    () => candidates.filter((c) => c.current_stage === 'Rejected').length,
    [candidates]
  );
  const rejectedCandidates = useMemo(
    () => candidates.filter((c) => c.current_stage === 'Rejected'),
    [candidates]
  );

  // Count shown in SearchSection feedback
  const filteredCount = isSearchActive ? searchResultCandidates.length : candidates.length;

  // ── Render helpers ──

  /** Flat grid of CandidateCards — used for both search results and the rejected archive */
  function CandidateGrid({ items }: { items: Candidate[] }) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onClick={handleSelectCandidate}
            isSelected={selectedCandidate?.id === candidate.id}
          />
        ))}
      </div>
    );
  }

  /**
   * Search Results Panel — rendered INSTEAD OF CandidatePipeline when isSearchActive.
   * Never filtered by the pipeline's selected stage.
   */
  function SearchResultsPanel() {
    const iq = searchResponse?.interpreted_query;

    // Still searching
    if (isSearching) return <CandidateSkeleton />;

    // Network / service error
    if (searchError) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircleIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Search failed</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{searchError}</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            Clear search
          </button>
        </div>
      );
    }

    // No response yet (debounce hasn't fired)
    if (!searchResponse) return null;

    // Invalid / unrecognised query
    if (iq?.query_type === 'invalid') {
      return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center max-w-md mx-auto my-12 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Couldn't understand that</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs mx-auto">
            {iq.explanation ?? 'Try rephrasing your search, e.g. "Who\'s in Interview?" or "Find Priya Sharma".'}
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            Clear search
          </button>
        </div>
      );
    }

    // Valid search, zero results
    if (searchResultCandidates.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
          <div className="text-3xl mb-3">🔍</div>
          <h3 className="text-base font-semibold text-slate-900">No candidates found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            No candidates matched your search. Try a different query.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            Clear search
          </button>
        </div>
      );
    }

    // Valid search, has results
    return (
      <div className="bg-slate-50/75 rounded-2xl p-4 sm:p-5 border border-slate-200/70">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight">
              Search results
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {searchResultCandidates.length}{' '}
            {searchResultCandidates.length === 1 ? 'candidate' : 'candidates'}
          </span>
        </div>
        <CandidateGrid items={searchResultCandidates} />
      </div>
    );
  }

  // ── Main render ──
  return (
    <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Candidates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your hiring pipeline from application to offer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/20 shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add candidate</span>
        </button>
      </div>

      {/* Search Input Section */}
      <SearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCandidatesCount={candidates.length}
        filteredCount={filteredCount}
        isSearching={isSearching}
        searchResponse={searchResponse}
        searchError={searchError}
        isBackendSearch={isSearchActive}
      />

      {/* View Switcher — only relevant in normal mode, kept visible for orientation */}
      {!isSearchActive && (
        <div className="flex items-center justify-between border-b border-slate-200/80 mb-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setViewTab('active')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                viewTab === 'active'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Active Pipeline</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  viewTab === 'active' ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-500'
                }`}
              >
                {totalActiveCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab('rejected')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                viewTab === 'rejected'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <BanIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>Rejected</span>
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  viewTab === 'rejected'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-50 text-slate-500'
                }`}
              >
                {totalRejectedCount}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleReload}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            title="Reload candidates"
            aria-label="Reload candidates"
          >
            <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* ================================================================
          RENDERING DECISION
          ================================================================
          SEARCH MODE  (isSearchActive === true)
            → SearchResultsPanel (never touches selectedStage)
          NORMAL MODE  (isSearchActive === false)
            → existing pipeline / rejected archive / loading / error states
          ================================================================ */}

      {isSearchActive ? (
        /* ── SEARCH MODE ── */
        <SearchResultsPanel />
      ) : isLoading ? (
        /* ── NORMAL: loading ── */
        <CandidateSkeleton />
      ) : error ? (
        /* ── NORMAL: error ── */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircleIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Unable to load candidates</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      ) : candidates.length === 0 ? (
        /* ── NORMAL: empty pipeline ── */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4">
            <PlusIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Your pipeline is empty</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Get started by adding your first candidate to the hiring pipeline.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add candidate</span>
          </button>
        </div>
      ) : viewTab === 'active' ? (
        /* ── NORMAL: active pipeline kanban ── */
        <CandidatePipeline
          candidates={candidates.filter((c) => c.current_stage !== 'Rejected')}
          onSelectCandidate={handleSelectCandidate}
          selectedCandidateId={selectedCandidate?.id}
        />
      ) : (
        /* ── NORMAL: rejected archive ── */
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Rejected Candidates</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Archived candidates disqualified from the hiring process. Click to view history.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
              {rejectedCandidates.length} candidates
            </span>
          </div>

          {rejectedCandidates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rejectedCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={handleSelectCandidate}
                  isSelected={selectedCandidate?.id === candidate.id}
                />
              ))}
            </div>
          ) : (
            <div className="h-32 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-4 text-center">
              <span className="text-xs font-medium text-slate-500">No rejected candidates</span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Rejected candidates will be archived here.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCandidateAdded={handleCandidateAdded}
      />

      {/* Candidate Detail Drawer */}
      {selectedCandidate && (
        <CandidateDetailDrawer
          key={selectedCandidate.id}
          candidate={selectedCandidate}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onTransitionSuccess={handleTransitionSuccess}
          onRejectSuccess={handleRejectSuccess}
        />
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}
