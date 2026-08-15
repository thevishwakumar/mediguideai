import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Mic, MicOff, AlertCircle, Smile } from 'lucide-react';

export const MOOD_LEVELS = [
  { level: 1, emoji: '😫', label: 'Very Low', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { level: 2, emoji: '🙁', label: 'Low', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { level: 3, emoji: '😐', label: 'Neutral', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { level: 4, emoji: '🙂', label: 'Good', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { level: 5, emoji: '😁', label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
];

interface InputAreaProps {
  onSendMessage: (text: string, images: string[], mood?: number) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [showMoodBar, setShowMoodBar] = useState<boolean>(true);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check Web Speech API availability
  const SpeechRecognition =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleSend = () => {
    if ((!text.trim() && images.length === 0 && selectedMood === null) || isLoading) return;

    // Stop speech recognition if active when sending
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    }

    onSendMessage(text, images, selectedMood || undefined);
    setText('');
    setImages([]);
    setSelectedMood(null);
    setInterimTranscript('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      setInterimTranscript('');
    } else {
      setSpeechError(null);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              currentFinal += transcriptChunk;
            } else {
              currentInterim += transcriptChunk;
            }
          }

          if (currentFinal) {
            setText((prev) =>
              prev.trim() ? `${prev.trim()} ${currentFinal.trim()}` : currentFinal.trim()
            );
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event error:', event.error);
          setIsListening(false);
          setInterimTranscript('');

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setSpeechError('Microphone permission was denied. Please allow mic access in your browser.');
          } else if (event.error !== 'no-speech') {
            setSpeechError(`Voice capture notice: ${event.error}`);
          }
          setTimeout(() => setSpeechError(null), 5000);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to initiate SpeechRecognition:', err);
        setSpeechError('Unable to start microphone.');
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 4000);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file as Blob);
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-10 w-full max-w-4xl mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] space-y-2">
      
      {/* Daily Mood Quick Selector Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
          <Smile size={15} className="text-teal-600" />
          <span>Daily Mood Check:</span>
          {selectedMood ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
              {MOOD_LEVELS.find((m) => m.level === selectedMood)?.emoji}{' '}
              {MOOD_LEVELS.find((m) => m.level === selectedMood)?.label} ({selectedMood}/5)
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-normal">Select 1-5 to pair with chat/logs</span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {MOOD_LEVELS.map((m) => {
            const isSelected = selectedMood === m.level;
            return (
              <button
                key={m.level}
                type="button"
                onClick={() => setSelectedMood(isSelected ? null : m.level)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                  isSelected
                    ? `${m.color} ring-2 ring-teal-500 scale-105 shadow-xs`
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={`Mood ${m.level}/5: ${m.label}`}
              >
                <span className="text-sm">{m.emoji}</span>
                <span className="hidden sm:inline text-[11px]">{m.level}</span>
              </button>
            );
          })}
          {selectedMood !== null && (
            <button
              type="button"
              onClick={() => setSelectedMood(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Voice Recording / Listening Active Status Banner */}
      {isListening && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-rose-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span>Listening to voice input... Speak your symptoms clearly.</span>
          </div>

          <button
            type="button"
            onClick={toggleListening}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline"
          >
            Stop Mic
          </button>
        </div>
      )}

      {/* Speech Error Notice */}
      {speechError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-amber-800 animate-in fade-in">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Image Preview Area */}
      {images.length > 0 && (
        <div className="flex gap-3 mb-1 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <div key={idx} className="relative group flex-shrink-0">
              <img src={img} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all">
        {/* Upload Image Button */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
          title="Upload image"
          disabled={isLoading}
        >
          <ImageIcon size={22} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*" 
          multiple 
        />

        {/* Microphone / Voice Input Button */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={isLoading}
          className={`p-3 rounded-xl transition-all ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300'
              : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
          }`}
          title={isListening ? 'Stop listening' : 'Dictate symptoms using Voice/Microphone'}
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        
        <div className="flex-1 flex flex-col justify-center">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening... Speak now...'
                : "Describe symptoms (e.g., 'I have a red rash on my arm that itches...')"
            }
            className="w-full bg-transparent border-none resize-none focus:ring-0 text-slate-800 placeholder-slate-400 py-3 max-h-32 min-h-[48px]"
            rows={1}
            disabled={isLoading}
          />

          {/* Real-time Interim Speech Result Preview */}
          {interimTranscript && (
            <p className="px-1 pb-1 text-xs text-teal-700 italic font-medium truncate">
              Speaking: "{interimTranscript}..."
            </p>
          )}
        </div>
        
        <button 
          onClick={handleSend}
          disabled={(!text.trim() && images.length === 0 && selectedMood === null) || isLoading}
          className={`p-3 rounded-xl flex items-center justify-center transition-all ${
            (!text.trim() && images.length === 0 && selectedMood === null) || isLoading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg active:scale-95'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
      <p className="text-center text-xs text-slate-400 mt-1">
        AI can make mistakes. Consider checking important information.
      </p>
    </div>
  );
};

export default InputArea;