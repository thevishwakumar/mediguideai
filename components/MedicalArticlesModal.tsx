import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  X,
  Search,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Bookmark,
  Check,
  Copy,
  RefreshCw,
  AlertCircle,
  FileText,
  Building2,
  Globe,
  ArrowRight
} from 'lucide-react';
import { HealthProfile, MedicalArticleSearchResult } from '../types';
import { searchMedicalArticles } from '../services/geminiService';

interface MedicalArticlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  healthProfile?: HealthProfile;
  onSaveInsight?: (title: string, content: string) => void;
}

const PRESET_TOPICS = [
  'Migraine with Aura vs Tension Headache',
  'Acid Reflux & GERD Triggers',
  'Sciatica Pain & Disc Herniation',
  'Hypertension Guidelines 2026',
  'Anxiety & Heart Palpitations',
  'Plantars Fasciitis Treatment',
  'Acute Bronchitis vs Asthma',
];

const MedicalArticlesModal: React.FC<MedicalArticlesModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  healthProfile,
  onSaveInsight,
}) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [searchResult, setSearchResult] = useState<MedicalArticleSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-search if initial query is provided when modal opens
  useEffect(() => {
    if (isOpen && initialQuery && !searchResult && !isLoading) {
      setQuery(initialQuery);
      handleExecuteSearch(initialQuery);
    } else if (isOpen && !query && !searchResult) {
      setQuery('Migraine symptoms and triggers');
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleExecuteSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setError(null);
    setSaved(false);

    try {
      const result = await searchMedicalArticles(searchTerm.trim(), healthProfile);
      setSearchResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to search verified medical sources. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!searchResult) return;
    const sourcesText = searchResult.sources
      .map((s) => `- ${s.title} (${s.domain || s.url}): ${s.url}`)
      .join('\n');
    const fullText = `Medical Article Context: ${searchResult.query}\n\n${searchResult.summary}\n\nVerified Sources:\n${sourcesText}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToInsights = () => {
    if (!searchResult || !onSaveInsight) return;
    const title = `Medical Literature: ${searchResult.query.slice(0, 35)}`;
    onSaveInsight(title, searchResult.summary);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between border-b border-teal-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30 flex items-center justify-center">
              <BookOpen size={20} className="text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Verified Medical Articles</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Google Search Grounded
                </span>
              </div>
              <p className="text-xs text-teal-200/90 mt-0.5">
                Retrieve peer-reviewed literature, clinical guidelines & educational context from trusted sources
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar & Quick Preset Topics */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteSearch(query);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search symptoms, conditions, or treatments (e.g., 'Migraine with visual aura', 'GERD management')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-2xs transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs active:scale-98"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-teal-200" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search size={15} />
                  <span>Find Articles</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Topics */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              Popular Topics:
            </span>
            {PRESET_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  setQuery(topic);
                  handleExecuteSearch(topic);
                }}
                className="bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-slate-700 font-medium px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors shadow-2xs"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
                <Sparkles size={18} className="absolute inset-0 m-auto text-teal-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Searching Verified Medical Institutions...
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Using Google Search grounding to retrieve current peer-reviewed articles, clinical guidelines, and authoritative healthcare context for <span className="font-semibold text-teal-700">"{query}"</span>.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Search Error</h4>
                <p className="mt-1">{error}</p>
                <button
                  onClick={() => handleExecuteSearch(query)}
                  className="mt-2 text-xs font-bold text-red-700 underline hover:text-red-900"
                >
                  Retry Search
                </button>
              </div>
            </div>
          ) : searchResult ? (
            <div className="space-y-6">
              
              {/* Summary Action Bar & Educational Breakdown Header */}
              <div className="bg-teal-50/60 border border-teal-200/80 p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                      <Sparkles size={13} className="text-teal-600" /> Synthesized Educational Overview
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                      Clinical Context for "{searchResult.query}"
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Overview</span>
                        </>
                      )}
                    </button>

                    {onSaveInsight && (
                      <button
                        type="button"
                        onClick={handleSaveToInsights}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                          saved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-teal-700 hover:bg-teal-800 text-white'
                        }`}
                      >
                        {saved ? (
                          <>
                            <Check size={14} />
                            <span>Saved to Insights</span>
                          </>
                        ) : (
                          <>
                            <Bookmark size={14} />
                            <span>Bookmark Article</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Markdown Educational Context */}
                <div className="prose prose-sm prose-teal max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed bg-white p-4 rounded-xl border border-teal-100 shadow-2xs">
                  <ReactMarkdown>{searchResult.summary}</ReactMarkdown>
                </div>
              </div>

              {/* Verified Sources Grounding Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Building2 size={14} className="text-teal-600" />
                    Verified Medical Sources & External References ({searchResult.sources.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Click to open source directly in new tab
                  </span>
                </div>

                {searchResult.sources.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                    No explicit source links were returned for this grounded query, but the educational content is grounded on Google Search medical indexes.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResult.sources.map((src, index) => (
                      <a
                        key={index}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-3 bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md rounded-xl transition-all flex flex-col justify-between space-y-2 text-left"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center gap-1">
                              <Globe size={11} /> {src.domain || 'Medical Institution'}
                            </span>
                            <ExternalLink size={13} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
                          </div>

                          <h5 className="text-xs font-bold text-slate-800 group-hover:text-teal-700 line-clamp-2 leading-snug">
                            {src.title}
                          </h5>
                          {src.snippet && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {src.snippet}
                            </p>
                          )}
                        </div>

                        <div className="pt-1 text-[10px] font-medium text-teal-600 flex items-center gap-1 group-hover:underline">
                          <span>Read full article at {src.domain || 'source'}</span>
                          <ArrowRight size={11} />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Grounded Search Queries Executed */}
              {searchResult.searchQueries && searchResult.searchQueries.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Search size={12} /> Google Grounding Search Queries Executed
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {searchResult.searchQueries.map((q, i) => (
                      <span
                        key={i}
                        className="bg-white border border-slate-200 text-slate-600 text-[11px] px-2 py-0.5 rounded-md font-mono"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <FileText size={36} className="mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Ready to Search Verified Literature</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Type symptoms or a medical condition in the search bar above to fetch peer-reviewed articles, hospital guidelines, and educational context.
              </p>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="p-3 bg-amber-50/80 border-t border-amber-200 text-amber-900 text-[11px] flex items-center gap-2.5">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <p>
            <strong>Educational Disclaimer:</strong> Articles provided via Google Search grounding are for informational reference only and do not replace professional diagnosis, medical advice, or direct clinical care.
          </p>
        </div>

      </div>
    </div>
  );
};

export default MedicalArticlesModal;
