import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Clock,
  Bookmark,
  Trash2,
  ChevronRight,
  Download,
  Search,
  MessageSquare,
  Sparkles,
  Stethoscope,
  Copy,
  Check,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { ChatSession, SavedInsight, Message } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  savedInsights: SavedInsight[];
  onRemoveInsight: (id: string) => void;
  onOpenExport: () => void;
  onOpenTrends: () => void;
  onOpenArticles?: () => void;
  currentMessages: Message[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  savedInsights,
  onRemoveInsight,
  onOpenExport,
  onOpenTrends,
  onOpenArticles,
  currentMessages,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'insights'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInsights = savedInsights.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyInsight = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl border-r border-slate-200 z-50 animate-in slide-in-from-left duration-250">
        
        {/* Header */}
        <div className="p-4 bg-teal-800 text-white flex items-center justify-between border-b border-teal-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-700 rounded-lg">
              <Stethoscope size={18} className="text-teal-200" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Symptom & Insight History</h2>
              <p className="text-[11px] text-teal-200">Past consultations & saved notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-teal-700 text-teal-200 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action: New Session, Trends & Articles Buttons */}
        <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs hover:shadow-md active:scale-98"
          >
            <PlusCircle size={16} />
            Start New Symptom Assessment
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenTrends();
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-2.5 rounded-xl text-[11px] transition-all shadow-xs hover:shadow-md active:scale-98"
            >
              <TrendingUp size={14} className="text-teal-300" />
              Pain Analytics
            </button>

            {onOpenArticles && (
              <button
                onClick={() => {
                  onOpenArticles();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 bg-teal-900 hover:bg-teal-950 text-white font-semibold py-2 px-2.5 rounded-xl text-[11px] transition-all shadow-xs hover:shadow-md active:scale-98 border border-teal-700/50"
              >
                <BookOpen size={14} className="text-teal-300" />
                Find Articles
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-3 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock size={15} />
            Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-3 px-3 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'insights'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bookmark size={15} />
            Saved Insights ({savedInsights.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'history' ? 'Search past sessions...' : 'Search saved insights...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeTab === 'history' ? (
            /* Sessions List */
            filteredSessions.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-500">
                  {searchQuery ? 'No matching sessions found.' : 'No past symptom assessments saved yet.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Start asking questions to build your history.
                </p>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isActive = s.id === currentSessionId;
                const formattedDate = new Date(s.updatedAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={s.id}
                    className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 border-teal-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      onSelectSession(s.id);
                      onClose();
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {s.title || 'Symptom Assessment'}
                        </span>
                        {isActive && (
                          <span className="bg-teal-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span>{s.messages.length} messages</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(s.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Session"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* Insights List */
            filteredInsights.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Sparkles size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-500">
                  {searchQuery ? 'No matching insights found.' : 'No bookmarked insights yet.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click the bookmark icon on any AI response to save key medical notes here.
                </p>
              </div>
            ) : (
              filteredInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-teal-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800 flex items-center gap-1 truncate">
                      <Bookmark size={12} className="text-teal-600 flex-shrink-0" />
                      {insight.title}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyInsight(insight.id, insight.content)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                        title="Copy text"
                      >
                        {copiedId === insight.id ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                      <button
                        onClick={() => onRemoveInsight(insight.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Remove bookmark"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed bg-white p-2 rounded-lg border border-slate-200">
                    {insight.content}
                  </p>

                  <div className="text-[10px] text-slate-400">
                    Saved {new Date(insight.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer: Export Action */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          <button
            onClick={() => {
              onOpenExport();
              onClose();
            }}
            disabled={currentMessages.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Download size={15} />
            Export Current Session ({currentMessages.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
