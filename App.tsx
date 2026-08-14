import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldCheck, Info, User, Heart, Edit3 } from 'lucide-react';
import DisclaimerModal from './components/DisclaimerModal';
import HealthProfileModal from './components/HealthProfileModal';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import { Message, HealthProfile } from './types';
import { sendMessageToGemini } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'mediguide_health_profile';

const App: React.FC = () => {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error loading health profile from localStorage', e);
      return {};
    }
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAcceptDisclaimer = () => {
    setHasAcceptedDisclaimer(true);
    // Add initial greeting
    setMessages([
      {
        id: 'init-1',
        role: 'model',
        content: "# Welcome to MediGuide AI \n\nI'm here to help you understand your symptoms. You can describe how you're feeling or upload a photo of any visible conditions (like a rash).\n\n**Please note:** I am an AI, not a doctor. In emergencies, call your local emergency number.",
        timestamp: Date.now()
      }
    ]);
  };

  const handleSaveHealthProfile = (updatedProfile: HealthProfile) => {
    setHealthProfile(updatedProfile);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.error('Error saving health profile to localStorage', e);
    }
  };

  const handleSendMessage = async (text: string, images: string[]) => {
    // 1. Add user message to UI
    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: images
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Call Gemini Service with current health profile
      const responseText = await sendMessageToGemini(messages, text, images, healthProfile);

      // 3. Add model response to UI
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm having trouble connecting to the service right now. Please try again in a moment.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasProfileData = Boolean(
    healthProfile.age || healthProfile.gender || healthProfile.preExistingConditions
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {!hasAcceptedDisclaimer && <DisclaimerModal onAccept={handleAcceptDisclaimer} />}

      <HealthProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={healthProfile}
        onSaveProfile={handleSaveHealthProfile}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-2 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">MediGuide AI</h1>
              <p className="text-xs text-teal-600 font-medium">Symptom & Visual Analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health Profile Button */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
                hasProfileData
                  ? 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <User size={16} className={hasProfileData ? 'text-teal-600' : 'text-slate-500'} />
              <span className="hidden sm:inline">
                {hasProfileData ? 'Health Profile' : 'Set Health Profile'}
              </span>
              {hasProfileData && (
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 border-l border-slate-200 pl-4">
              <div className="flex items-center gap-1">
                <ShieldCheck size={16} className="text-teal-600" />
                <span>Private & Secure</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Context Banner */}
      <div className="bg-teal-900/5 border-b border-teal-100 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <Heart size={14} className="text-teal-600 flex-shrink-0" />
            <span className="font-semibold text-slate-700">AI Context:</span>
            {hasProfileData ? (
              <span className="truncate text-slate-600">
                {[
                  healthProfile.age ? `Age: ${healthProfile.age}` : null,
                  healthProfile.gender ? `Sex: ${healthProfile.gender}` : null,
                  healthProfile.preExistingConditions ? `Conditions: ${healthProfile.preExistingConditions}` : null
                ].filter(Boolean).join(' • ')}
              </span>
            ) : (
              <span className="text-slate-400 italic">No health profile set (click 'Set Health Profile' to add age, gender & conditions)</span>
            )}
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1 flex-shrink-0 ml-2 hover:underline"
          >
            <Edit3 size={12} />
            {hasProfileData ? 'Edit' : 'Add'}
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
