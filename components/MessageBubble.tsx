import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Stethoscope, Bookmark, Copy, Check } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  onBookmarkToggle?: (message: Message) => void;
  isBookmarked?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onBookmarkToggle,
  isBookmarked = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${
          isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'
        }`}>
          {isUser ? <User size={20} /> : <Stethoscope size={20} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`group relative px-5 py-4 rounded-2xl shadow-xs text-sm md:text-base leading-relaxed overflow-hidden ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
          }`}>
            
            {/* Action Bar for AI responses */}
            {!isUser && (
              <div className="flex items-center gap-1.5 justify-end mb-2 border-b border-slate-100 pb-2 text-slate-400">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] hover:text-slate-700 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
                  title="Copy response text"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {onBookmarkToggle && (
                  <button
                    type="button"
                    onClick={() => onBookmarkToggle(message)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                      isBookmarked
                        ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                        : 'hover:text-teal-700 hover:bg-teal-50'
                    }`}
                    title={isBookmarked ? 'Remove from saved insights' : 'Save to health insights'}
                  >
                    <Bookmark
                      size={12}
                      className={isBookmarked ? 'fill-teal-600 text-teal-600' : ''}
                    />
                    <span>{isBookmarked ? 'Saved' : 'Save Insight'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Attachments (Images) */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt="User attachment" 
                    className="h-32 w-auto rounded-lg border border-white/20 object-cover"
                  />
                ))}
              </div>
            )}

            {/* Content */}
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="prose prose-sm prose-slate max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
          
          <span className="text-xs text-slate-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

