import { useState, useRef, useEffect } from 'react';
import { SearchIcon, CloseIcon, SparklesIcon } from '../common/Icons.tsx';
import type { SearchResponse } from '../../types/search.types.ts';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCandidatesCount: number;
  filteredCount: number;
  // Backend search state
  isSearching?: boolean;
  searchResponse?: SearchResponse | null;
  searchError?: string | null;
  isBackendSearch?: boolean;
}

const EXAMPLE_QUERIES = [
  'Find Priya Sharma',
  "Who's in Interview right now?",
  'Who has been stuck in Screening for more than a week?',
  'Who moved to Interview since Monday?',
  'Everyone except rejected candidates',
];

export function SearchSection({
  searchQuery,
  onSearchChange,
  totalCandidatesCount,
  filteredCount,
  isSearching = false,
  searchResponse = null,
  searchError = null,
  isBackendSearch = false,
}: SearchSectionProps) {
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close examples popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowExamples(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: '/' focuses search, 'Esc' clears or closes
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === '/' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        inputRef.current?.focus();
      } else if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        if (searchQuery) {
          onSearchChange('');
        } else {
          inputRef.current?.blur();
        }
        setShowExamples(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, onSearchChange]);

  const handleSelectExample = (example: string) => {
    onSearchChange(example);
    setShowExamples(false);
    inputRef.current?.focus();
  };

  const isFiltering = searchQuery.trim().length > 0;
  const interpretation = searchResponse?.interpreted_query?.explanation;

  return (
    <div className="relative mb-6" ref={containerRef}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
          {isSearching ? (
            <svg
              className="w-4 h-4 animate-spin text-indigo-500"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <SearchIcon className="w-4.5 h-4.5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search candidates or ask a question..."
          className="w-full pl-10 pr-24 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-xs transition-all"
        />

        {/* Right side controls: Clear or Examples */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowExamples((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${showExamples
              ? 'bg-slate-100 text-slate-800'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200/70'
              }`}
          >
            <SparklesIcon className="w-3 h-3 text-indigo-500" />
            <span>Examples</span>
          </button>
        </div>
      </div>

      {/* Examples Popover */}
      {showExamples && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg p-3 z-20">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Natural-Language Query Examples</span>
            </div>
            <span className="text-[11px] text-slate-400">Click to try</span>
          </div>

          <div className="space-y-1">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleSelectExample(example)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span>&ldquo;{example}&rdquo;</span>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-600 font-normal">
                  Insert
                </span>
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by AI natural language search</span>
            <span className="text-slate-500">Press Esc to dismiss</span>
          </div>
        </div>
      )}

      {/* Subtle helper info / match feedback */}
      <div className="mt-1.5 flex items-center justify-between px-1 text-xs text-slate-500">
        <div className="flex items-center gap-2 min-w-0">
          {isFiltering && isBackendSearch ? (
            isSearching ? (
              <span className="text-indigo-500 animate-pulse">Searching…</span>
            ) : searchError ? (
              <span className="text-rose-500">{searchError}</span>
            ) : (
              <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span>
                  Showing{' '}
                  <strong className="text-slate-700 font-medium">{filteredCount}</strong> of{' '}
                  {totalCandidatesCount} candidates
                </span>
                {interpretation && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-medium max-w-xs truncate"
                    title={interpretation}
                  >
                    <SparklesIcon className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{interpretation}</span>
                  </span>
                )}
              </span>
            )
          ) : isFiltering ? (
            <span>
              Showing <strong className="text-slate-700 font-medium">{filteredCount}</strong> of{' '}
              {totalCandidatesCount} candidates
            </span>
          ) : (
            <span className="text-slate-400">
              Filter by candidate name, email, or stage. Press{' '}
              <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200">
                /
              </kbd>{' '}
              to search
            </span>
          )}
        </div>

        {isFiltering && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 shrink-0 ml-2"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
