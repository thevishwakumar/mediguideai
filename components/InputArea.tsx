import React, { useState, useRef, ChangeEvent } from 'react';
import { Send, Image as ImageIcon, X, Paperclip } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string, images: string[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!text.trim() && images.length === 0) || isLoading) return;
    onSendMessage(text, images);
    setText('');
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        // Fix: Explicitly cast file to Blob as Array.from might return unknown[]
        reader.readAsDataURL(file as Blob);
      });
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-10 w-full max-w-4xl mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      {/* Image Preview Area */}
      {images.length > 0 && (
        <div className="flex gap-3 mb-3 overflow-x-auto pb-2 scrollbar-hide">
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
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe symptoms (e.g., 'I have a red rash on my arm that itches...')"
          className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-slate-800 placeholder-slate-400 py-3 max-h-32 min-h-[48px]"
          rows={1}
          disabled={isLoading}
        />
        
        <button 
          onClick={handleSend}
          disabled={(!text.trim() && images.length === 0) || isLoading}
          className={`p-3 rounded-xl flex items-center justify-center transition-all ${
            (!text.trim() && images.length === 0) || isLoading
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
      <p className="text-center text-xs text-slate-400 mt-2">
        AI can make mistakes. Consider checking important information.
      </p>
    </div>
  );
};

export default InputArea;