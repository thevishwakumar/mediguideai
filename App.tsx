import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, ShieldCheck, User, Heart, Edit3, Menu, Download, PlusCircle, Bell, TrendingUp, BookOpen, Phone, ShieldAlert, MoreVertical, ChevronDown } from 'lucide-react';
import DisclaimerModal from './components/DisclaimerModal';
import HealthProfileModal from './components/HealthProfileModal';
import RemindersModal from './components/RemindersModal';
import ReminderToast from './components/ReminderToast';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import Sidebar from './components/Sidebar';
import ExportModal from './components/ExportModal';
import SymptomTrendsModal from './components/SymptomTrendsModal';
import HealthSummaryBanner from './components/HealthSummaryBanner';
import MedicalArticlesModal from './components/MedicalArticlesModal';
import EmergencyActionModal from './components/EmergencyActionModal';
import { Message, HealthProfile, ChatSession, SavedInsight, Reminder, SymptomLog } from './types';
import { sendMessageToGemini, generateHealthSummary } from './services/geminiService';
import { playNotificationChime, sendBrowserNotification } from './utils/notificationUtils';

const PROFILE_STORAGE_KEY = 'mediguide_health_profile';
const SESSIONS_STORAGE_KEY = 'mediguide_chat_sessions';
const INSIGHTS_STORAGE_KEY = 'mediguide_saved_insights';
const REMINDERS_STORAGE_KEY = 'mediguide_reminders';
const SYMPTOM_LOGS_STORAGE_KEY = 'mediguide_symptom_logs';

const DEFAULT_SYMPTOM_LOGS: SymptomLog[] = [
  {
    id: 'sample-1',
    date: '2026-08-05',
    timestamp: Date.now() - 86400000 * 10,
    symptomName: 'Headache / Migraine',
    painLevel: 3,
    temperature: 98.6,
    mood: 4,
    trigger: 'Lack of Sleep',
    notes: 'Mild dull pain in temple area',
    tags: ['Mild', 'Recurrent'],
  },
  {
    id: 'sample-2',
    date: '2026-08-07',
    timestamp: Date.now() - 86400000 * 8,
    symptomName: 'Fever / Chills',
    painLevel: 5,
    temperature: 100.4,
    mood: 2,
    trigger: 'Weather / Pressure Changes',
    notes: 'Body aches and mild fever after evening commute',
    tags: ['Moderate', 'Sudden Onset'],
  },
  {
    id: 'sample-3',
    date: '2026-08-09',
    timestamp: Date.now() - 86400000 * 6,
    symptomName: 'Headache / Migraine',
    painLevel: 7,
    temperature: 101.2,
    mood: 1,
    trigger: 'Stress / Anxiety',
    notes: 'Throbbing migraine aggravated by bright lights',
    tags: ['Severe', 'Recurrent'],
  },
  {
    id: 'sample-4',
    date: '2026-08-11',
    timestamp: Date.now() - 86400000 * 4,
    symptomName: 'Joint Stiffness / Pain',
    painLevel: 4,
    temperature: 99.1,
    mood: 3,
    trigger: 'Physical Exertion',
    notes: 'Knee stiffness after morning walk',
    tags: ['Moderate', 'Post-Workout'],
  },
  {
    id: 'sample-5',
    date: '2026-08-13',
    timestamp: Date.now() - 86400000 * 2,
    symptomName: 'Lower Back Pain',
    painLevel: 3,
    temperature: 98.4,
    mood: 3,
    trigger: 'Stress / Anxiety',
    notes: 'Lower back tension relieved with hot compress',
    tags: ['Mild', 'Chronic'],
  },
  {
    id: 'sample-6',
    date: '2026-08-15',
    timestamp: Date.now(),
    symptomName: 'Headache / Migraine',
    painLevel: 2,
    temperature: 98.6,
    mood: 5,
    trigger: 'Dehydration',
    notes: 'Feeling much better today after rest and hydration',
    tags: ['Mild', 'Improving'],
  },
];

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'default-1',
    title: 'Check Fever & Symptom Progression',
    type: 'symptom_check',
    time: '09:00',
    frequency: 'daily',
    notes: 'Log any changes in temperature or pain level',
    enabled: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'default-2',
    title: 'Take Daily Morning Medication',
    type: 'medication',
    time: '08:30',
    frequency: 'daily',
    notes: 'Take with breakfast and a glass of water',
    enabled: true,
    createdAt: Date.now() - 86400000,
  },
];

const INITIAL_GREETING: Message = {
  id: 'init-1',
  role: 'model',
  content: "# Welcome to MediGuide AI \n\nI'm here to help you understand your symptoms. You can describe how you're feeling or upload a photo of any visible conditions (like a rash).\n\n**Please note:** I am an AI, not a doctor. In emergencies, call your local emergency number.",
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error loading health profile', e);
      return {};
    }
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading sessions', e);
      return [];
    }
  });

  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>(() => {
    try {
      const saved = localStorage.getItem(INSIGHTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading insights', e);
      return [];
    }
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem(REMINDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
    } catch (e) {
      console.error('Error loading reminders', e);
      return DEFAULT_REMINDERS;
    }
  });

  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>(() => {
    try {
      const saved = localStorage.getItem(SYMPTOM_LOGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SYMPTOM_LOGS;
    } catch (e) {
      console.error('Error loading symptom logs', e);
      return DEFAULT_SYMPTOM_LOGS;
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return 'session-' + Date.now();
  });

  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isArticlesModalOpen, setIsArticlesModalOpen] = useState(false);
  const [articlesInitialQuery, setArticlesInitialQuery] = useState('');
  const [activeTriggeredReminder, setActiveTriggeredReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Evaluate if AI detected urgent / red-flag symptoms in current assessment
  const urgentStatus = useMemo(() => {
    if (!messages || messages.length <= 1) return { isUrgent: false, matchedKeyword: '' };
    const latestAi = [...messages].reverse().find((m) => m.role === 'model');
    const fullText = (latestAi?.content || '') + ' ' + (currentSummary || '');
    const lower = fullText.toLowerCase();

    const keywords = [
      'emergency room',
      'emergency department',
      'call 911',
      'call emergency',
      'immediate medical attention',
      'seek immediate',
      'life-threatening',
      'chest pain',
      'difficulty breathing',
      'anaphylaxis',
      'stroke',
      'severe bleeding',
      'urgency assessment: emergency',
      'urgency assessment: high',
      'immediate er',
    ];

    const matched = keywords.find((kw) => lower.includes(kw));
    if (matched) {
      return { isUrgent: true, matchedKeyword: matched };
    }
    return { isUrgent: false, matchedKeyword: '' };
  }, [messages, currentSummary]);

  const handleOpenArticlesModal = (queryOverride?: string) => {
    if (queryOverride && queryOverride.trim()) {
      setArticlesInitialQuery(queryOverride);
    } else if (currentSummary) {
      setArticlesInitialQuery(currentSummary.split('.')[0] || currentSummary);
    } else {
      const userMsg = messages.find((m) => m.role === 'user');
      setArticlesInitialQuery(userMsg ? userMsg.content : 'Migraine symptoms and treatment');
    }
    setIsArticlesModalOpen(true);
  };

  const handleSaveArticleInsight = (title: string, content: string) => {
    const newInsight: SavedInsight = {
      id: 'insight-' + Date.now(),
      messageId: 'article-' + Date.now(),
      title,
      content,
      timestamp: Date.now(),
    };
    setSavedInsights((prev) => [newInsight, ...prev]);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving sessions', e);
    }
  }, [sessions]);

  // Sync saved insights to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(savedInsights));
    } catch (e) {
      console.error('Error saving insights', e);
    }
  }, [savedInsights]);

  // Sync reminders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    } catch (e) {
      console.error('Error saving reminders', e);
    }
  }, [reminders]);

  // Sync symptom logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SYMPTOM_LOGS_STORAGE_KEY, JSON.stringify(symptomLogs));
    } catch (e) {
      console.error('Error saving symptom logs', e);
    }
  }, [symptomLogs]);

  const handleAddSymptomLog = (newLogData: Omit<SymptomLog, 'id' | 'timestamp'>) => {
    const newLog: SymptomLog = {
      ...newLogData,
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
    };
    setSymptomLogs((prev) => [newLog, ...prev]);
  };

  const handleDeleteSymptomLog = (id: string) => {
    setSymptomLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateSymptomLog = (updatedLog: SymptomLog) => {
    setSymptomLogs((prev) =>
      prev.map((l) => (l.id === updatedLog.id ? updatedLog : l))
    );
  };

  // Background timer loop to trigger due reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toISOString().slice(0, 10);

      reminders.forEach((reminder) => {
        if (!reminder.enabled) return;

        if (
          reminder.time === currentTimeStr &&
          reminder.lastTriggeredDate !== todayDateStr
        ) {
          // Trigger reminder!
          playNotificationChime();
          sendBrowserNotification(
            reminder.type === 'medication' ? '💊 Medication Reminder' : '🩺 Symptom Check-in',
            {
              body: `${reminder.title}${reminder.notes ? ` - ${reminder.notes}` : ''}`,
            }
          );

          setActiveTriggeredReminder(reminder);

          // Mark triggered for today
          setReminders((prev) =>
            prev.map((r) =>
              r.id === reminder.id ? { ...r, lastTriggeredDate: todayDateStr } : r
            )
          );
        }
      });
    };

    // Check every 15 seconds
    const interval = setInterval(checkReminders, 15000);
    checkReminders(); // Run immediate initial check

    return () => clearInterval(interval);
  }, [reminders]);

  const handleAcceptDisclaimer = () => {
    setHasAcceptedDisclaimer(true);
  };

  const handleSaveHealthProfile = (updatedProfile: HealthProfile) => {
    setHealthProfile(updatedProfile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (e) {
      console.error('Error saving health profile', e);
    }
  };

  const handleAddReminder = (newReminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newReminder: Reminder = {
      ...newReminderData,
      id: 'reminder-' + Date.now(),
      createdAt: Date.now(),
    };
    setReminders((prev) => [newReminder, ...prev]);
  };

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleTriggerTestReminder = (reminder: Reminder) => {
    playNotificationChime();
    sendBrowserNotification(
      reminder.type === 'medication' ? '💊 Medication Reminder (Test)' : '🩺 Symptom Check-in (Test)',
      {
        body: `${reminder.title}${reminder.notes ? ` - ${reminder.notes}` : ''}`,
      }
    );
    setActiveTriggeredReminder(reminder);
  };

  const handleSnoozeReminder = (reminder: Reminder) => {
    setActiveTriggeredReminder(null);
    // Add snooze time 15 minutes from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const snoozeHours = String(now.getHours()).padStart(2, '0');
    const snoozeMinutes = String(now.getMinutes()).padStart(2, '0');
    const snoozeTimeStr = `${snoozeHours}:${snoozeMinutes}`;

    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminder.id
          ? { ...r, time: snoozeTimeStr, lastTriggeredDate: undefined }
          : r
      )
    );
  };

  const handleCheckInWithAIFromReminder = (reminder: Reminder) => {
    setActiveTriggeredReminder(null);
    const promptText = `I am doing a scheduled symptom check-in for: "${reminder.title}". ${
      reminder.notes ? `Notes: ${reminder.notes}.` : ''
    } Can you guide me through a quick symptom assessment?`;

    handleSendMessage(promptText, []);
  };

  const saveCurrentSessionState = (updatedMessages: Message[], summaryOverride?: string) => {
    const userFirstMsg = updatedMessages.find((m) => m.role === 'user');
    const title = userFirstMsg
      ? userFirstMsg.content.slice(0, 32) + (userFirstMsg.content.length > 32 ? '...' : '')
      : 'New Assessment';

    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentSessionId);
      const sessionData: ChatSession = {
        id: currentSessionId,
        title,
        createdAt: existingIdx >= 0 ? prev[existingIdx].createdAt : Date.now(),
        updatedAt: Date.now(),
        messages: updatedMessages,
        healthProfile,
        summary: summaryOverride !== undefined ? summaryOverride : (existingIdx >= 0 ? prev[existingIdx].summary : currentSummary || undefined),
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = sessionData;
        return copy;
      } else {
        return [sessionData, ...prev];
      }
    });
  };

  const handleUpdateSummary = async (
    msgList: Message[] = messages,
    currentProfile: HealthProfile = healthProfile
  ) => {
    if (msgList.length <= 1) return;
    setIsSummaryLoading(true);
    try {
      const newSummary = await generateHealthSummary(msgList, currentProfile);
      setCurrentSummary(newSummary);
      saveCurrentSessionState(msgList, newSummary);
    } catch (e) {
      console.error('Failed to generate health summary', e);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSendMessage = async (text: string, images: string[], mood?: number) => {
    // If mood is provided, save or update symptom log for today
    if (mood !== undefined && mood !== null) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const existingTodayLogIndex = symptomLogs.findIndex((l) => l.date === todayStr);

      if (existingTodayLogIndex >= 0) {
        setSymptomLogs((prev) =>
          prev.map((l, idx) =>
            idx === existingTodayLogIndex
              ? {
                  ...l,
                  mood,
                  notes: text.trim() ? (l.notes ? `${l.notes}; ${text.trim()}` : text.trim()) : l.notes,
                }
              : l
          )
        );
      } else {
        const newMoodLog: SymptomLog = {
          id: 'log-' + Date.now(),
          date: todayStr,
          timestamp: Date.now(),
          symptomName: text.trim() ? 'Symptom & Mood Check' : 'Daily Mood Log',
          painLevel: 0,
          mood,
          notes: text.trim() ? text.trim() : `Recorded daily mood score ${mood}/5`,
        };
        setSymptomLogs((prev) => [newMoodLog, ...prev]);
      }
    }

    const effectiveText =
      mood !== undefined && mood !== null && !text.trim()
        ? `[Logged Daily Mood Rating: ${mood}/5]`
        : text;

    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: effectiveText,
      timestamp: Date.now(),
      attachments: images,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(messages, effectiveText, images, healthProfile);

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, modelMessage];
      setMessages(finalMessages);
      saveCurrentSessionState(finalMessages);

      // Automatically update the AI Health Summary as conversation progresses
      handleUpdateSummary(finalMessages, healthProfile);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm having trouble connecting to the service right now. Please try again in a moment.",
        timestamp: Date.now(),
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveCurrentSessionState(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewSession = () => {
    const newId = 'session-' + Date.now();
    setCurrentSessionId(newId);
    setMessages([INITIAL_GREETING]);
    setCurrentSummary(null);
  };

  const handleSelectSession = (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      setCurrentSummary(session.summary || null);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (id === currentSessionId) {
      handleStartNewSession();
    }
  };

  const handleToggleBookmark = (msg: Message) => {
    const existingIdx = savedInsights.findIndex((i) => i.messageId === msg.id);
    if (existingIdx >= 0) {
      setSavedInsights((prev) => prev.filter((i) => i.messageId !== msg.id));
    } else {
      const userMsg = messages.find((m) => m.role === 'user');
      const title = userMsg ? userMsg.content.slice(0, 30) : 'Medical Insight';

      const newInsight: SavedInsight = {
        id: 'insight-' + Date.now(),
        messageId: msg.id,
        title,
        content: msg.content,
        timestamp: Date.now(),
      };
      setSavedInsights((prev) => [newInsight, ...prev]);
    }
  };

  const handleRemoveInsight = (id: string) => {
    setSavedInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const hasProfileData = Boolean(
    healthProfile.age || healthProfile.gender || healthProfile.preExistingConditions
  );

  const activeRemindersCount = reminders.filter((r) => r.enabled).length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans relative">
      {!hasAcceptedDisclaimer && <DisclaimerModal onAccept={handleAcceptDisclaimer} />}

      {/* Triggered Reminder Notification Toast */}
      {activeTriggeredReminder && (
        <ReminderToast
          reminder={activeTriggeredReminder}
          onDismiss={() => setActiveTriggeredReminder(null)}
          onSnooze={handleSnoozeReminder}
          onCheckInWithAI={handleCheckInWithAIFromReminder}
        />
      )}

      <HealthProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={healthProfile}
        onSaveProfile={handleSaveHealthProfile}
      />

      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminders={reminders}
        onAddReminder={handleAddReminder}
        onToggleReminder={handleToggleReminder}
        onDeleteReminder={handleDeleteReminder}
        onTriggerTestReminder={handleTriggerTestReminder}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleStartNewSession}
        onDeleteSession={handleDeleteSession}
        savedInsights={savedInsights}
        onRemoveInsight={handleRemoveInsight}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenTrends={() => setIsTrendsModalOpen(true)}
        onOpenArticles={() => handleOpenArticlesModal()}
        currentMessages={messages}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        messages={messages}
        healthProfile={healthProfile}
      />

      <SymptomTrendsModal
        isOpen={isTrendsModalOpen}
        onClose={() => setIsTrendsModalOpen(false)}
        logs={symptomLogs}
        onAddLog={handleAddSymptomLog}
        onDeleteLog={handleDeleteSymptomLog}
        onUpdateLog={handleUpdateSymptomLog}
        onAskAIComparison={(promptText) => {
          setIsTrendsModalOpen(false);
          handleSendMessage(promptText, []);
        }}
      />

      <MedicalArticlesModal
        isOpen={isArticlesModalOpen}
        onClose={() => setIsArticlesModalOpen(false)}
        initialQuery={articlesInitialQuery}
        healthProfile={healthProfile}
        onSaveInsight={handleSaveArticleInsight}
      />

      <EmergencyActionModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        healthProfile={healthProfile}
        currentSummary={currentSummary}
        latestMessages={messages}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors relative"
              title="Open History & Saved Insights"
            >
              <Menu size={20} />
              {savedInsights.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-600 border-2 border-white" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="bg-teal-600 p-2 rounded-lg text-white">
                <Activity size={22} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">MediGuide AI</h1>
                <p className="text-[11px] text-teal-600 font-medium">Symptom & Visual Analysis</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick-Access Call/Message Button (Prominent when urgent, or subtle shortcut) */}
            {(urgentStatus.isUrgent || healthProfile.emergencyContact) && (
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  urgentStatus.isUrgent
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce shadow-rose-200 ring-2 ring-rose-400'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                }`}
                title={
                  urgentStatus.isUrgent
                    ? '🚨 URGENT SYMPTOMS DETECTED: Click to Call/Message Emergency Contact'
                    : 'Emergency Contact & Doctor Quick Access'
                }
              >
                <Phone size={15} className={urgentStatus.isUrgent ? 'animate-pulse' : 'text-rose-600'} />
                <span className="inline">
                  {urgentStatus.isUrgent ? '🚨 Call/Message Doctor' : 'Emergency Contact'}
                </span>
              </button>
            )}

            {/* Verified Medical Articles Button */}
            <button
              onClick={() => handleOpenArticlesModal()}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-teal-900 bg-teal-100/80 hover:bg-teal-200/80 border border-teal-300/80 transition-colors"
              title="Search Verified Medical Articles with Google Search Grounding"
            >
              <BookOpen size={15} className="text-teal-700" />
              <span>Articles</span>
            </button>

            {/* Symptom Trends Analytics Button */}
            <button
              onClick={() => setIsTrendsModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
              title="View Symptom & Pain Level Trends"
            >
              <TrendingUp size={15} className="text-teal-600" />
              <span>Trends</span>
            </button>

            {/* Reminders Button */}
            <button
              onClick={() => setIsRemindersModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors relative"
              title="Reminders & Medication Alerts"
            >
              <Bell size={15} className="text-teal-700" />
              <span className="hidden md:inline">Reminders</span>
              {activeRemindersCount > 0 && (
                <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {activeRemindersCount}
                </span>
              )}
            </button>

            {/* New Session Quick Button */}
            <button
              onClick={handleStartNewSession}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Start New Assessment"
            >
              <PlusCircle size={15} />
              <span>New Chat</span>
            </button>

            {/* Health Profile Button */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs ${
                hasProfileData
                  ? 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <User size={15} className={hasProfileData ? 'text-teal-600' : 'text-slate-500'} />
              <span className="hidden md:inline">
                {hasProfileData ? 'Profile' : 'Set Profile'}
              </span>
              {hasProfileData && (
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              )}
            </button>

            {/* Dropdown Menu for All Devices */}
            <div className="relative">
              <button
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Open Actions Menu"
              >
                <MoreVertical size={16} />
                <span className="hidden sm:inline">Menu</span>
                <ChevronDown size={14} />
              </button>

              {isHeaderMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsHeaderMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        handleOpenArticlesModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition-colors"
                    >
                      <BookOpen size={15} className="text-teal-600" /> Medical Articles
                    </button>
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsTrendsModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition-colors"
                    >
                      <TrendingUp size={15} className="text-teal-600" /> Pain Trends & Analytics
                    </button>
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsRemindersModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center justify-between transition-colors sm:hidden"
                    >
                      <span className="flex items-center gap-2">
                        <Bell size={15} className="text-teal-600" /> Reminders
                      </span>
                      {activeRemindersCount > 0 && (
                        <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {activeRemindersCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        handleStartNewSession();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition-colors sm:hidden"
                    >
                      <PlusCircle size={15} className="text-teal-600" /> New Chat
                    </button>
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsExportModalOpen(true);
                      }}
                      disabled={messages.length <= 1}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition-colors disabled:opacity-40"
                    >
                      <Download size={15} className="text-teal-600" /> Export Doctor Report
                    </button>
                    <div className="border-t border-slate-100 my-1 pt-1">
                      <button
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition-colors md:hidden"
                      >
                        <User size={15} className="text-teal-600" /> Health Profile
                      </button>
                      <button
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          setIsSidebarOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 flex items-center gap-2 transition-colors"
                      >
                        <Menu size={15} className="text-teal-600" /> Chat History & Saved Insights
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Urgent Symptom Warning Banner */}
      {urgentStatus.isUrgent && (
        <div className="bg-rose-600 text-white px-4 py-2.5 shadow-inner">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert size={18} className="animate-pulse text-white flex-shrink-0" />
              <span>
                <strong>Urgent Symptom Detected:</strong> AI evaluation flagged potential high-urgency symptoms in your chat. Please evaluate immediate care.
              </span>
            </div>
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="bg-white text-rose-800 font-extrabold px-3 py-1.5 rounded-lg text-xs hover:bg-rose-50 transition-colors flex-shrink-0 shadow-xs"
            >
              Call / Message Contact Now
            </button>
          </div>
        </div>
      )}

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
              <span className="text-slate-400 italic">No health profile set (click 'Set Profile' to add age, gender & conditions)</span>
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
          {/* AI Health Summary Section */}
          <HealthSummaryBanner
            summary={currentSummary}
            isGenerating={isSummaryLoading}
            onRefresh={() => handleUpdateSummary(messages, healthProfile)}
            messageCount={messages.length}
            onOpenArticles={handleOpenArticlesModal}
          />

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onBookmarkToggle={msg.role === 'model' ? handleToggleBookmark : undefined}
              isBookmarked={savedInsights.some((i) => i.messageId === msg.id)}
            />
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


