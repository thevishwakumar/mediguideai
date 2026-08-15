import React, { useState } from 'react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, FileText, CheckCircle2, Activity, ShieldAlert, BookOpen } from 'lucide-react';

interface HealthSummaryBannerProps {
  summary: string | null;
  isGenerating: boolean;
  onRefresh: () => void;
  messageCount: number;
  onOpenArticles?: (query?: string) => void;
}

const HealthSummaryBanner: React.FC<HealthSummaryBannerProps> = ({
  summary,
  isGenerating,
  onRefresh,
  messageCount,
  onOpenArticles,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If there are no user messages yet (only initial greeting)
  const isInitialState = messageCount <= 1;

  // Split summary into sentences if available
  const sentences = summary
    ? summary
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="bg-gradient-to-r from-teal-900 via-teal-850 to-slate-900 text-white rounded-2xl shadow-md border border-teal-700/50 mb-4 overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <div className="px-4 py-3 sm:px-5 flex items-center justify-between gap-2 border-b border-teal-800/60 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
            <Sparkles size={16} className="text-teal-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                AI Health Summary
              </h3>
              <span className="bg-teal-500/20 text-teal-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-teal-500/30 hidden sm:inline-block">
                3-Sentence Findings
              </span>
            </div>
            <p className="text-[10px] text-teal-200/80 hidden sm:block">
              Synthesized from active chat session • Auto-updates as findings develop
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Refresh Summary Button */}
          <button
            onClick={onRefresh}
            disabled={isGenerating || isInitialState}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-all flex items-center gap-1 text-xs font-medium"
            title="Re-generate 3-sentence health summary"
          >
            <RefreshCw size={13} className={isGenerating ? 'animate-spin text-teal-300' : ''} />
            <span className="hidden md:inline text-[11px]">Update</span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? 'Expand Summary' : 'Collapse Summary'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Body Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 text-xs leading-relaxed space-y-3">
          {isGenerating ? (
            <div className="flex items-center gap-3 py-2 text-teal-200">
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Synthesizing current session's findings into a 3-sentence clinical summary...</span>
            </div>
          ) : isInitialState ? (
            <div className="flex items-start gap-2.5 text-teal-200/90 italic py-1">
              <Activity size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
              <span>
                As you describe your symptoms with MediGuide AI, a 3-sentence summary highlighting primary concerns, potential causes, and recommended next steps will automatically generate here.
              </span>
            </div>
          ) : summary && sentences.length > 0 ? (
            <div className="space-y-2.5">
              {/* Render as structured sentences or 3 distinct key callouts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Sentence 1: Chief Concern */}
                {sentences[0] && (
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1">
                      <FileText size={12} /> 1. Chief Concerns
                    </span>
                    <p className="text-teal-50 font-medium text-[11px] leading-snug">
                      {sentences[0]}
                    </p>
                  </div>
                )}

                {/* Sentence 2: Potential Causes */}
                {sentences[1] && (
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      <Activity size={12} /> 2. Clinical Observations
                    </span>
                    <p className="text-teal-50 font-medium text-[11px] leading-snug">
                      {sentences[1]}
                    </p>
                  </div>
                )}

                {/* Sentence 3: Recommended Next Steps */}
                {sentences[2] && (
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={12} /> 3. Recommended Steps
                    </span>
                    <p className="text-teal-50 font-medium text-[11px] leading-snug">
                      {sentences[2]}
                    </p>
                  </div>
                )}
              </div>

              {/* Full Paragraph View if extra sentences or for smooth reading */}
              <div className="pt-2 text-[11px] text-teal-200/90 border-t border-teal-800/50 flex items-center justify-between gap-2 flex-wrap">
                <span className="italic flex-1 min-w-[200px]">
                  " {summary} "
                </span>
                
                {onOpenArticles && (
                  <button
                    type="button"
                    onClick={() => onOpenArticles(sentences[0] || summary)}
                    className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 rounded-lg font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-2xs hover:text-white"
                    title="Search verified medical literature using Google Search Grounding"
                  >
                    <BookOpen size={13} className="text-teal-300" />
                    <span>Search Verified Articles</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-teal-200">
              <span>No findings synthesized yet for this conversation.</span>
              <button
                onClick={onRefresh}
                className="text-teal-300 hover:text-white underline font-semibold text-xs"
              >
                Generate Summary
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthSummaryBanner;
