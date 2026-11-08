import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  SubjectMeta, 
  SyllabusTopic, 
  PYQQuestion, 
  StudyTask, 
  VideoResource, 
  PdfResource, 
  Flashcard, 
  ExamSession,
  SubjectFile 
} from '../types';
import { 
  buildSearchIndex, 
  executeSearch, 
  getHighlightedChunks, 
  SearchIndexItem, 
  SearchResultGroup 
} from '../utils/searchService';
import { 
  Search, 
  X, 
  BookOpen, 
  Layers, 
  FileText, 
  Video, 
  Flame, 
  Brain, 
  CheckSquare, 
  Folder, 
  CornerDownLeft,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface GlobalSearchBarProps {
  activeExamId: string;
  examSessions: ExamSession[];
  subjects: SubjectMeta[];
  topics: SyllabusTopic[];
  questions?: PYQQuestion[];
  tasks?: StudyTask[];
  videos?: VideoResource[];
  pdfs?: PdfResource[];
  flashcards?: Flashcard[];
  files?: SubjectFile[];
  onNavigateToSearchResult: (item: SearchIndexItem) => void;
  className?: string;
  isMobile?: boolean;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  activeExamId,
  examSessions,
  subjects,
  topics,
  questions = [],
  tasks = [],
  videos = [],
  pdfs = [],
  flashcards = [],
  files = [],
  onNavigateToSearchResult,
  className = '',
  isMobile = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchAllExams, setSearchAllExams] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isScreenMobile, setIsScreenMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const checkMobile = () => setIsScreenMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isMobileEffective = isMobile || isScreenMobile;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query by ~150ms to ensure zero lag with hundreds of items
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global keyboard shortcut: pressing "/" focuses search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) && !(e.target as HTMLElement)?.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close search results dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // In-memory search index built whenever data changes
  const searchIndex = useMemo(() => {
    return buildSearchIndex(
      activeExamId,
      examSessions,
      searchAllExams,
      {
        subjects,
        topics,
        questions,
        tasks,
        videos,
        pdfs,
        flashcards,
        files
      }
    );
  }, [activeExamId, examSessions, searchAllExams, subjects, topics, questions, tasks, videos, pdfs, flashcards, files]);

  // Execute search against in-memory index
  const searchResult = useMemo(() => {
    return executeSearch(searchIndex, debouncedQuery);
  }, [searchIndex, debouncedQuery]);

  const activeExam = examSessions.find(e => e.id === activeExamId) || { name: 'Current Exam' };

  // Flatten visible items for keyboard Up/Down navigation
  const visibleItems = useMemo(() => {
    const items: SearchIndexItem[] = [];
    searchResult.groups.forEach(g => {
      const isExpanded = !!expandedGroups[g.group];
      const slice = isExpanded ? g.items : g.items.slice(0, 5);
      slice.forEach(item => items.push(item));
    });
    return items;
  }, [searchResult.groups, expandedGroups]);

  // Handle keyboard events (Up/Down/Enter/Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || visibleItems.length === 0) {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < visibleItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : visibleItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < visibleItems.length) {
        handleItemClick(visibleItems[focusedIndex]);
      } else if (visibleItems.length > 0) {
        handleItemClick(visibleItems[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleItemClick = (item: SearchIndexItem) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
    setFocusedIndex(-1);
    onNavigateToSearchResult(item);
  };

  const toggleGroupExpand = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'Subjects':
        return <Folder className="w-3.5 h-3.5 text-blue-500" />;
      case 'Units':
        return <Layers className="w-3.5 h-3.5 text-amber-500" />;
      case 'Topics':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Notes & Files':
        return <FileText className="w-3.5 h-3.5 text-cyan-500" />;
      case 'Videos':
        return <Video className="w-3.5 h-3.5 text-red-500" />;
      case 'PYQs':
        return <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />;
      case 'Flashcards':
        return <Brain className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Tasks':
        return <CheckSquare className="w-3.5 h-3.5 text-teal-500" />;
      default:
        return <Search className="w-3.5 h-3.5 text-paper-muted" />;
    }
  };

  let currentItemIndex = -1;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-paper-muted dark:text-night-muted absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsSearchOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isMobileEffective ? "Search topics, PYQs, or notes..." : "Search topics, PYQs, or notes... (Press /)"}
          className="w-full pl-8 pr-14 py-1.5 text-xs rounded-xl instrument-well text-paper-ink dark:text-night-text placeholder-paper-muted dark:placeholder-night-muted focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
                setIsSearchOpen(false);
              }}
              className="p-1 text-paper-muted hover:text-paper-ink dark:hover:text-night-text"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-paper-muted dark:text-night-muted bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border rounded shadow-xs">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isSearchOpen && debouncedQuery.trim().length > 0 && (
        <div 
          className="absolute left-0 top-full mt-2 w-full sm:w-[500px] lg:w-[560px] max-w-[calc(100vw-32px)] sm:max-w-none bg-paper-card dark:bg-night-card border border-paper-border dark:border-night-border shadow-2xl rounded-2xl z-50 overflow-hidden animate-scale-up"
          style={{ maxHeight: '72vh' }}
        >
          {/* Header Controls: Search All Exams Switch & Result Counter */}
          <div className="px-3 py-2 bg-paper-cardElevated dark:bg-night-cardElevated border-b border-paper-border dark:border-night-border flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-paper-ink dark:text-night-text text-[11px]">
                {searchResult.totalResults} result{searchResult.totalResults !== 1 ? 's' : ''}
              </span>
              {searchResult.isTypoMatch && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Similar results</span>
                </span>
              )}
            </div>

            {/* "Search all exams" toggle switch */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-paper-muted dark:text-night-muted hover:text-paper-ink dark:hover:text-night-text select-none">
              <span>Search all exams</span>
              <input
                type="checkbox"
                checked={searchAllExams}
                onChange={(e) => setSearchAllExams(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-paper-border dark:bg-night-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-transparent after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600 relative"></div>
            </label>
          </div>

          {/* Results List */}
          <div className="p-2 space-y-3 overflow-y-auto max-h-[calc(72vh-50px)]">
            {searchResult.groups.length > 0 ? (
              searchResult.groups.map(group => {
                const isExpanded = !!expandedGroups[group.group];
                const displayItems = isExpanded ? group.items : group.items.slice(0, 5);
                const hasMore = group.items.length > 5;

                return (
                  <div key={group.group} className="space-y-1">
                    {/* Group Header */}
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-paper-muted dark:text-night-muted">
                      <div className="flex items-center gap-1.5">
                        {getGroupIcon(group.group)}
                        <span>{group.group} ({group.totalCount})</span>
                      </div>
                      {searchResult.isTypoMatch && (
                        <span className="text-[10px] lowercase italic font-normal">typo tolerance</span>
                      )}
                    </div>

                    {/* Group Items */}
                    <div className="space-y-1">
                      {displayItems.map(item => {
                        currentItemIndex++;
                        const isFocused = currentItemIndex === focusedIndex;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`p-2.5 rounded-xl cursor-pointer transition-colors border text-left ${
                              isFocused 
                                ? 'bg-emerald-500/10 border-emerald-500/40' 
                                : 'hover:bg-paper-cardElevated dark:hover:bg-night-cardElevated border-transparent hover:border-paper-border'
                            }`}
                          >
                            <div className="space-y-1">
                              {/* Title: wrapped onto 2 or 3 lines, NEVER cut with "..." */}
                              <div className="text-xs font-semibold text-paper-ink dark:text-night-text whitespace-normal break-words leading-snug line-clamp-3">
                                {getHighlightedChunks(item.title, searchResult.queryWords).map((chunk, cIdx) => (
                                  chunk.isMatch ? (
                                    <mark 
                                      key={cIdx} 
                                      className="bg-amber-300/40 dark:bg-amber-400/30 text-paper-ink dark:text-night-text font-bold rounded-xs px-0.5"
                                    >
                                      {chunk.text}
                                    </mark>
                                  ) : (
                                    <span key={cIdx}>{chunk.text}</span>
                                  )
                                ))}
                              </div>

                              {/* Subtitle / Snippet if present */}
                              {item.subtitle && (
                                <div className="text-[11px] text-paper-muted dark:text-night-muted whitespace-normal break-words line-clamp-2">
                                  {getHighlightedChunks(item.subtitle, searchResult.queryWords).map((chunk, cIdx) => (
                                    chunk.isMatch ? (
                                      <mark 
                                        key={cIdx} 
                                        className="bg-amber-300/30 dark:bg-amber-400/20 text-paper-ink dark:text-night-text font-bold rounded-xs px-0.5"
                                      >
                                        {chunk.text}
                                      </mark>
                                    ) : (
                                      <span key={cIdx}>{chunk.text}</span>
                                    )
                                  ))}
                                </div>
                              )}

                              {/* Breadcrumb: Exam > Subject > Unit wrapping normally */}
                              <div className="text-[11px] text-paper-muted dark:text-night-muted flex items-center gap-1 flex-wrap pt-0.5 leading-normal">
                                <span className="font-medium">{item.breadcrumb}</span>
                                {item.subjectAccent && (
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full inline-block shrink-0 ml-0.5" 
                                    style={{ backgroundColor: item.subjectAccent }} 
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Show More Button if more than 5 results in group */}
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => toggleGroupExpand(group.group)}
                        className="w-full py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1"
                      >
                        <span>{isExpanded ? 'Show fewer' : `Show ${group.totalCount - 5} more in ${group.group}`}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              /* No Results State */
              <div className="py-8 px-4 text-center space-y-1.5">
                <Search className="w-6 h-6 text-paper-muted mx-auto opacity-40" />
                <div className="text-xs font-bold text-paper-ink dark:text-night-text">
                  No results for '{debouncedQuery}'
                </div>
                <p className="text-[11px] text-paper-muted dark:text-night-muted max-w-xs mx-auto">
                  {!searchAllExams 
                    ? `No matches in ${activeExam.name}. Try toggling "Search all exams" above.` 
                    : 'No matches found across any subjects, units, topics, or notes.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Keyboard Hints */}
          <div className="px-3 py-1.5 bg-paper-cardElevated/50 dark:bg-night-cardElevated/50 border-t border-paper-border dark:border-night-border hidden sm:flex items-center justify-between text-[10px] text-paper-muted font-mono">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>esc to close</span>
          </div>

        </div>
      )}
    </div>
  );
};
