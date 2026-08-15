import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Plus,
  Activity,
  Calendar,
  Thermometer,
  AlertTriangle,
  Trash2,
  Filter,
  Brain,
  Check,
  Info,
  Zap,
  BarChart2,
  GitCompare,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { SymptomLog } from '../types';

interface SymptomTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SymptomLog[];
  onAddLog: (log: Omit<SymptomLog, 'id' | 'timestamp'>) => void;
  onDeleteLog: (id: string) => void;
  onAskAIComparison?: (promptText: string) => void;
}

const COMMON_SYMPTOMS = [
  'Headache / Migraine',
  'Fever / Chills',
  'Lower Back Pain',
  'Joint Stiffness / Pain',
  'Abdominal Cramps',
  'Chest Tightness',
  'Sore Throat',
  'Fatigue / Exhaustion',
  'Nausea / Dizziness',
];

const COMMON_TRIGGERS = [
  'Stress / Anxiety',
  'Lack of Sleep',
  'Physical Exertion',
  'Dehydration',
  'Weather / Pressure Changes',
  'Dietary Intake',
];

export const AVAILABLE_SEVERITY_TAGS = [
  'Mild',
  'Moderate',
  'Severe',
  'Recurrent',
  'Chronic',
  'Acute',
  'Sudden Onset',
  'Improving',
  'Post-Workout',
  'Digestive',
  'Respiratory',
  'Neurological',
  'Musculoskeletal',
  'Cardiovascular',
  'Systemic',
];

export const detectCategoryTags = (text: string): string[] => {
  const lower = text.toLowerCase();
  const detected: string[] = [];
  if (/stomach|nausea|cramps|bloating|digestion|diarrhea|acid|reflux|gut|abdominal/.test(lower)) detected.push('Digestive');
  if (/cough|throat|breath|wheez|cold|congestion|sinus|sore throat/.test(lower)) detected.push('Respiratory');
  if (/headache|migraine|dizziness|vertigo|brain|tingling|numbness|temple/.test(lower)) detected.push('Neurological');
  if (/back|joint|muscle|pain|stiffness|knee|spine|arthritis|tension|body aches/.test(lower)) detected.push('Musculoskeletal');
  if (/chest|palpitation|heart|pressure|pulse/.test(lower)) detected.push('Cardiovascular');
  if (/fever|chills|fatigue|exhaustion|sweat|weakness/.test(lower)) detected.push('Systemic');
  return detected;
};

export const MOOD_MAP: Record<number, { emoji: string; label: string; color: string; bg: string }> = {
  1: { emoji: '😫', label: 'Very Low', color: 'text-rose-700', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
  2: { emoji: '🙁', label: 'Low', color: 'text-amber-700', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  3: { emoji: '😐', label: 'Neutral', color: 'text-slate-700', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
  4: { emoji: '🙂', label: 'Good', color: 'text-teal-700', bg: 'bg-teal-100 text-teal-800 border-teal-200' },
  5: { emoji: '😁', label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

interface SymptomTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SymptomLog[];
  onAddLog: (log: Omit<SymptomLog, 'id' | 'timestamp'>) => void;
  onUpdateLog?: (log: SymptomLog) => void;
  onDeleteLog: (id: string) => void;
  onAskAIComparison?: (promptText: string) => void;
}

const SymptomTrendsModal: React.FC<SymptomTrendsModalProps> = ({
  isOpen,
  onClose,
  logs,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  onAskAIComparison,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'calendar' | 'compare'>('trends');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'7d' | '14d' | '30d' | 'all'>('30d');
  const [selectedSymptomFilter, setSelectedSymptomFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [viewMetric, setViewMetric] = useState<'pain' | 'temperature' | 'mood' | 'correlation'>('pain');

  // Calendar View State
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );

  // Calendar Month Computation
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth(); // 0-11
  const calendarMonthTitle = calendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedCalendarDate(today.toISOString().slice(0, 10));
  };

  // Map of logs grouped by date string YYYY-MM-DD
  const calendarLogsByDate = useMemo(() => {
    const map: Record<string, SymptomLog[]> = {};
    logs.forEach((log) => {
      if (selectedSymptomFilter !== 'all' && log.symptomName !== selectedSymptomFilter) {
        return;
      }
      if (!map[log.date]) {
        map[log.date] = [];
      }
      map[log.date].push(log);
    });
    return map;
  }, [logs, selectedSymptomFilter]);

  // Calendar Grid Days Calculation
  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun ... 6 = Sat
    const prevMonthLastDay = new Date(calendarYear, calendarMonth, 0).getDate();

    // Previous Month Days
    const prevDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const dayNum = prevMonthLastDay - firstDayOfWeek + 1 + i;
      const prevDateObj = new Date(calendarYear, calendarMonth - 1, dayNum);
      const dateStr = prevDateObj.toISOString().slice(0, 10);
      return { dayNum, isCurrentMonth: false, dateStr };
    });

    // Current Month Days
    const currentDays = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const monthStr = String(calendarMonth + 1).padStart(2, '0');
      const dayStr = String(dayNum).padStart(2, '0');
      const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;
      return { dayNum, isCurrentMonth: true, dateStr };
    });

    // Next Month Days to round up grid to multiple of 7
    const totalSoFar = prevDays.length + currentDays.length;
    const nextDaysCount = (7 - (totalSoFar % 7)) % 7;
    const nextDays = Array.from({ length: nextDaysCount }, (_, i) => {
      const dayNum = i + 1;
      const nextDateObj = new Date(calendarYear, calendarMonth + 1, dayNum);
      const dateStr = nextDateObj.toISOString().slice(0, 10);
      return { dayNum, isCurrentMonth: false, dateStr };
    });

    return [...prevDays, ...currentDays, ...nextDays];
  }, [calendarYear, calendarMonth]);

  // Month Statistics for Calendar Header
  const calendarMonthLogs = useMemo(() => {
    const monthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
    return logs.filter(
      (l) =>
        l.date.startsWith(monthPrefix) &&
        (selectedSymptomFilter === 'all' || l.symptomName === selectedSymptomFilter)
    );
  }, [logs, calendarYear, calendarMonth, selectedSymptomFilter]);

  const calendarMonthStats = useMemo(() => {
    if (calendarMonthLogs.length === 0) {
      return { totalEntries: 0, uniqueDays: 0, severeDays: 0, avgPain: 'N/A', topSymptom: 'None' };
    }
    const uniqueDays = new Set(calendarMonthLogs.map((l) => l.date)).size;
    const severeDays = calendarMonthLogs.filter((l) => l.painLevel >= 7).length;
    const avgPain = (
      calendarMonthLogs.reduce((acc, l) => acc + l.painLevel, 0) / calendarMonthLogs.length
    ).toFixed(1);

    const counts: Record<string, number> = {};
    calendarMonthLogs.forEach((l) => {
      counts[l.symptomName] = (counts[l.symptomName] || 0) + 1;
    });
    const topSymptom = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    return {
      totalEntries: calendarMonthLogs.length,
      uniqueDays,
      severeDays,
      avgPain,
      topSymptom,
    };
  }, [calendarMonthLogs]);

  const selectedDateLogs = useMemo(() => {
    return calendarLogsByDate[selectedCalendarDate] || [];
  }, [calendarLogsByDate, selectedCalendarDate]);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedCalendarDate) return '';
    try {
      const [year, month, day] = selectedCalendarDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return selectedCalendarDate;
    }
  }, [selectedCalendarDate]);

  // Comparison State
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => b.date.localeCompare(a.date)); // Descending by date
  }, [logs]);

  const [compareIdA, setCompareIdA] = useState<string>('');
  const [compareIdB, setCompareIdB] = useState<string>('');

  // Selected Comparison Objects
  const logA = useMemo(() => {
    if (compareIdA) return logs.find((l) => l.id === compareIdA) || null;
    return sortedLogs[1] || sortedLogs[0] || null; // Second newest by default
  }, [logs, compareIdA, sortedLogs]);

  const logB = useMemo(() => {
    if (compareIdB) return logs.find((l) => l.id === compareIdB) || null;
    return sortedLogs[0] || null; // Newest by default
  }, [logs, compareIdB, sortedLogs]);

  // New Log Form State
  const [symptomName, setSymptomName] = useState('Headache / Migraine');
  const [customSymptom, setCustomSymptom] = useState('');
  const [painLevel, setPainLevel] = useState<number>(4);
  const [temperature, setTemperature] = useState<string>('');
  const [mood, setMood] = useState<number>(3);
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [trigger, setTrigger] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Mild']);

  if (!isOpen) return null;

  const handleSubmitNewLog = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSymptom = symptomName === 'Other' ? customSymptom.trim() || 'General Symptom' : symptomName;

    onAddLog({
      symptomName: finalSymptom,
      date: logDate,
      painLevel,
      temperature: temperature ? parseFloat(temperature) : undefined,
      mood,
      trigger: trigger ? trigger : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      tags: selectedTags,
    });

    // Reset Form
    setCustomSymptom('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleStartComparison = (targetLog: SymptomLog) => {
    setActiveTab('compare');
    if (logB && logB.id !== targetLog.id) {
      setCompareIdA(targetLog.id);
      setCompareIdB(logB.id);
    } else {
      setCompareIdA(targetLog.id);
      const other = sortedLogs.find((l) => l.id !== targetLog.id);
      if (other) setCompareIdB(other.id);
    }
  };

  const handleSwapComparison = () => {
    if (!logA || !logB) return;
    setCompareIdA(logB.id);
    setCompareIdB(logA.id);
  };

  const handlePresetPresetComparison = (type: 'latest' | 'peak' | 'same_symptom') => {
    if (sortedLogs.length < 2) return;

    if (type === 'latest') {
      setCompareIdA(sortedLogs[1].id);
      setCompareIdB(sortedLogs[0].id);
    } else if (type === 'peak') {
      const highestPainLog = [...sortedLogs].sort((a, b) => b.painLevel - a.painLevel)[0];
      const latestLog = sortedLogs[0];
      setCompareIdA(highestPainLog.id);
      setCompareIdB(latestLog.id);
    } else if (type === 'same_symptom') {
      // Find two logs with the same symptom name
      for (let i = 0; i < sortedLogs.length; i++) {
        for (let j = i + 1; j < sortedLogs.length; j++) {
          if (sortedLogs[i].symptomName === sortedLogs[j].symptomName) {
            setCompareIdA(sortedLogs[j].id);
            setCompareIdB(sortedLogs[i].id);
            return;
          }
        }
      }
      // Fallback
      setCompareIdA(sortedLogs[1].id);
      setCompareIdB(sortedLogs[0].id);
    }
  };

  // Filter logs by date range and symptom for charts
  const filteredLogs = useMemo(() => {
    let result = [...logs].sort((a, b) => a.date.localeCompare(b.date));

    // Date range filter
    const now = new Date();
    if (selectedRange === '7d') {
      const cutoff = new Date(now.setDate(now.getDate() - 7)).toISOString().slice(0, 10);
      result = result.filter((l) => l.date >= cutoff);
    } else if (selectedRange === '14d') {
      const cutoff = new Date(now.setDate(now.getDate() - 14)).toISOString().slice(0, 10);
      result = result.filter((l) => l.date >= cutoff);
    } else if (selectedRange === '30d') {
      const cutoff = new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 10);
      result = result.filter((l) => l.date >= cutoff);
    }

    // Symptom filter
    if (selectedSymptomFilter !== 'all') {
      result = result.filter((l) => l.symptomName === selectedSymptomFilter);
    }

    // Tag filter
    if (selectedTagFilter !== 'all') {
      result = result.filter((l) => l.tags && l.tags.includes(selectedTagFilter));
    }

    return result;
  }, [logs, selectedRange, selectedSymptomFilter, selectedTagFilter]);

  // Chart data formatting
  const chartData = useMemo(() => {
    return filteredLogs.map((log) => {
      const dateFormatted = new Date(log.date + 'T00:00:00').toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });

      return {
        id: log.id,
        rawDate: log.date,
        displayDate: dateFormatted,
        painLevel: log.painLevel,
        temperature: log.temperature || null,
        mood: log.mood || null,
        symptomName: log.symptomName,
        trigger: log.trigger || 'N/A',
        notes: log.notes || '',
      };
    });
  }, [filteredLogs]);

  // Mood & Pain Correlation Stats
  const moodCorrelationStats = useMemo(() => {
    const logsWithMood = filteredLogs.filter((l) => l.mood !== undefined && l.mood !== null);
    if (logsWithMood.length === 0) {
      return {
        avgMood: 'N/A',
        avgMoodHighPain: 'N/A',
        avgMoodLowPain: 'N/A',
        hasData: false,
        summaryText: 'Log daily mood scores to reveal correlation between physical pain and emotional wellbeing.',
      };
    }

    const totalMood = logsWithMood.reduce((acc, l) => acc + (l.mood || 0), 0);
    const avgMood = (totalMood / logsWithMood.length).toFixed(1);

    const highPainLogs = logsWithMood.filter((l) => l.painLevel >= 5);
    const lowPainLogs = logsWithMood.filter((l) => l.painLevel < 5);

    const avgMoodHighPain =
      highPainLogs.length > 0
        ? (highPainLogs.reduce((a, b) => a + (b.mood || 0), 0) / highPainLogs.length).toFixed(1)
        : 'N/A';

    const avgMoodLowPain =
      lowPainLogs.length > 0
        ? (lowPainLogs.reduce((a, b) => a + (b.mood || 0), 0) / lowPainLogs.length).toFixed(1)
        : 'N/A';

    let summaryText = `Average recorded mood: ${avgMood} / 5 across ${logsWithMood.length} data points.`;
    if (avgMoodHighPain !== 'N/A' && avgMoodLowPain !== 'N/A') {
      const diff = (parseFloat(avgMoodLowPain) - parseFloat(avgMoodHighPain)).toFixed(1);
      if (parseFloat(diff) > 0.4) {
        summaryText = `📊 Strong correlation detected: Your mood rating drops by ${diff} points on days with moderate to severe physical pain (≥5/10).`;
      } else {
        summaryText = `Mood rating stays stable between low-pain days (${avgMoodLowPain}/5) and higher-pain days (${avgMoodHighPain}/5).`;
      }
    }

    return {
      avgMood,
      avgMoodHighPain,
      avgMoodLowPain,
      hasData: true,
      summaryText,
    };
  }, [filteredLogs]);

  // Frequency breakdown calculation
  const symptomFrequencyData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      counts[l.symptomName] = (counts[l.symptomName] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLogs]);

  // Summary statistics
  const stats = useMemo(() => {
    if (filteredLogs.length === 0) {
      return { avgPain: 0, maxPain: 0, totalEntries: 0, topSymptom: 'None', avgTemp: 'N/A' };
    }

    const totalPain = filteredLogs.reduce((acc, l) => acc + l.painLevel, 0);
    const avgPain = (totalPain / filteredLogs.length).toFixed(1);
    const maxPain = Math.max(...filteredLogs.map((l) => l.painLevel));

    const temps = filteredLogs.map((l) => l.temperature).filter((t): t is number => t !== undefined);
    const avgTemp = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) + ' °F' : 'N/A';

    const topSymptom = symptomFrequencyData[0]?.name || 'N/A';

    return {
      avgPain,
      maxPain,
      totalEntries: filteredLogs.length,
      topSymptom,
      avgTemp,
    };
  }, [filteredLogs, symptomFrequencyData]);

  const getPainBadgeClass = (level: number) => {
    if (level <= 3) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (level <= 6) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const uniqueSymptomNames = useMemo(() => {
    const set = new Set(logs.map((l) => l.symptomName));
    return Array.from(set);
  }, [logs]);

  // Comparison Delta Calculations
  const comparisonDeltas = useMemo(() => {
    if (!logA || !logB) return null;

    const painDelta = logB.painLevel - logA.painLevel;
    const tempDelta =
      logA.temperature !== undefined && logB.temperature !== undefined
        ? parseFloat((logB.temperature - logA.temperature).toFixed(1))
        : null;

    const dateA = new Date(logA.date);
    const dateB = new Date(logB.date);
    const diffTime = Math.abs(dateB.getTime() - dateA.getTime());
    const daysApart = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      painDelta,
      tempDelta,
      daysApart,
      isSameSymptom: logA.symptomName === logB.symptomName,
    };
  }, [logA, logB]);

  const handleAskAIToEvaluateComparison = () => {
    if (!logA || !logB || !onAskAIComparison) return;

    const promptText = `I would like to compare two past symptom log entries side-by-side:

📅 Baseline Entry A (${logA.date}):
- Symptom: ${logA.symptomName}
- Pain Score: ${logA.painLevel} / 10
- Temperature: ${logA.temperature ? `${logA.temperature} °F` : 'Not recorded'}
- Suspected Trigger: ${logA.trigger || 'None specified'}
- Context / Notes: "${logA.notes || 'None'}"

📅 Comparison Entry B (${logB.date}):
- Symptom: ${logB.symptomName}
- Pain Score: ${logB.painLevel} / 10
- Temperature: ${logB.temperature ? `${logB.temperature} °F` : 'Not recorded'}
- Suspected Trigger: ${logB.trigger || 'None specified'}
- Context / Notes: "${logB.notes || 'None'}"

Can you analyze the key changes, evaluate whether the pain trajectory shows improvement or escalation, and provide medical observations regarding potential triggers or management advice?`;

    onAskAIComparison(promptText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Symptom & Pain Level Analytics</h2>
              <p className="text-xs text-teal-100 font-medium">
                Track pain trajectories over time or compare two log entries side-by-side
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs (Trends vs Visual Calendar vs Side-by-Side Compare) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-2.5 flex items-center gap-2 flex-shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'trends'
                ? 'bg-white text-teal-800 border-slate-200 shadow-2xs'
                : 'bg-slate-200/60 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <TrendingUp size={15} className={activeTab === 'trends' ? 'text-teal-600' : ''} />
            Analytics & Trend Charts
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-white text-teal-800 border-slate-200 shadow-2xs'
                : 'bg-slate-200/60 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Calendar size={15} className={activeTab === 'calendar' ? 'text-teal-600' : ''} />
            Visual Calendar View
            <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {calendarMonthLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'compare'
                ? 'bg-white text-teal-800 border-slate-200 shadow-2xs'
                : 'bg-slate-200/60 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <GitCompare size={15} className={activeTab === 'compare' ? 'text-teal-600' : ''} />
            Side-by-Side Log Comparison
            <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {logs.length}
            </span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: ANALYTICS & TREND CHARTS */}
          {activeTab === 'trends' && (
            <>
              {/* Top Control Bar: Filters & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Range Filter */}
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 text-xs font-semibold">
                    {(['7d', '14d', '30d', 'all'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedRange(range)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          selectedRange === range
                            ? 'bg-teal-600 text-white shadow-2xs font-bold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {range === 'all' ? 'All Time' : range.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Symptom Filter */}
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-xs">
                    <Filter size={13} className="text-teal-600" />
                    <select
                      value={selectedSymptomFilter}
                      onChange={(e) => setSelectedSymptomFilter(e.target.value)}
                      className="bg-transparent font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Symptoms</option>
                      {uniqueSymptomNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity Tag Filter */}
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-xs">
                    <Zap size={13} className="text-violet-600" />
                    <select
                      value={selectedTagFilter}
                      onChange={(e) => setSelectedTagFilter(e.target.value)}
                      className="bg-transparent font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Severity Tags</option>
                      {AVAILABLE_SEVERITY_TAGS.map((tag) => (
                        <option key={tag} value={tag}>
                          #{tag}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Metric Toggle */}
                  <div className="flex flex-wrap items-center bg-white rounded-xl border border-slate-200 p-1 text-xs font-semibold gap-1">
                    <button
                      onClick={() => setViewMetric('pain')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                        viewMetric === 'pain'
                          ? 'bg-amber-500 text-white shadow-2xs font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Activity size={13} />
                      Pain (0-10)
                    </button>
                    <button
                      onClick={() => setViewMetric('temperature')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                        viewMetric === 'temperature'
                          ? 'bg-teal-600 text-white shadow-2xs font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Thermometer size={13} />
                      Temp (°F)
                    </button>
                    <button
                      onClick={() => setViewMetric('mood')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                        viewMetric === 'mood'
                          ? 'bg-violet-600 text-white shadow-2xs font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles size={13} />
                      Mood (1-5)
                    </button>
                    <button
                      onClick={() => setViewMetric('correlation')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                        viewMetric === 'correlation'
                          ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <GitCompare size={13} />
                      Mood vs Pain Correlation
                    </button>
                  </div>
                </div>

                {/* New Entry Button */}
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-xs hover:shadow-md"
                >
                  <Plus size={16} />
                  {showAddForm ? 'Close Log Form' : 'Log New Symptom'}
                </button>
              </div>

              {/* Add Entry Form Modal Drawer */}
              {showAddForm && (
                <form
                  onSubmit={handleSubmitNewLog}
                  className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-98 duration-150"
                >
                  <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                    <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={14} className="text-teal-600" /> Add Symptom / Pain Entry
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Symptom Select */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Symptom Type *
                      </label>
                      <select
                        value={symptomName}
                        onChange={(e) => setSymptomName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {COMMON_SYMPTOMS.map((sym) => (
                          <option key={sym} value={sym}>
                            {sym}
                          </option>
                        ))}
                        <option value="Other">Other Custom Symptom</option>
                      </select>
                    </div>

                    {symptomName === 'Other' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Custom Symptom Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Skin Rash / Irritation"
                          value={customSymptom}
                          onChange={(e) => setCustomSymptom(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    )}

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar size={13} /> Log Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Pain Level Scale Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Activity size={14} className="text-amber-500" />
                        Pain / Discomfort Intensity (0 - 10):
                      </label>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold border ${getPainBadgeClass(
                          painLevel
                        )}`}
                      >
                        {painLevel} / 10 ({painLevel === 0 ? 'No Pain' : painLevel <= 3 ? 'Mild' : painLevel <= 6 ? 'Moderate' : 'Severe'})
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={painLevel}
                      onChange={(e) => setPainLevel(parseInt(e.target.value, 10))}
                      className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Daily Mood Score (1-5 Scale) */}
                  <div className="bg-white p-3 rounded-xl border border-teal-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-violet-600" />
                        Daily Mood Rating (1 - 5 Scale):
                      </label>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${MOOD_MAP[mood]?.bg}`}>
                        {MOOD_MAP[mood]?.emoji} {MOOD_MAP[mood]?.label} ({mood}/5)
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((mNum) => {
                        const mObj = MOOD_MAP[mNum];
                        const isSel = mood === mNum;
                        return (
                          <button
                            key={mNum}
                            type="button"
                            onClick={() => setMood(mNum)}
                            className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                              isSel
                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-300 font-bold scale-102'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-lg">{mObj.emoji}</span>
                            <span className="text-[10px] truncate max-w-full font-semibold">{mObj.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Annotation Tags & Severity Descriptors */}
                  <div className="bg-white p-3.5 rounded-xl border border-teal-200/80 space-y-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Zap size={14} className="text-violet-600" />
                      Annotation Tags & Severity Descriptors (Select tags):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_SEVERITY_TAGS.map((tag) => {
                        const isChecked = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setSelectedTags(selectedTags.filter((t) => t !== tag));
                              } else {
                                setSelectedTags([...selectedTags, tag]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                              isChecked
                                ? 'bg-violet-600 text-white border-violet-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>#{tag}</span>
                            {isChecked && <Check size={12} />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-2">
                      <span className="text-[10px] text-slate-500 font-medium">
                        💡 Auto-detects category tags from notes & symptom text
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const combined = `${symptomName} ${customSymptom} ${trigger} ${notes}`;
                          const detected = detectCategoryTags(combined);
                          if (detected.length > 0) {
                            const merged = Array.from(new Set([...selectedTags, ...detected]));
                            setSelectedTags(merged);
                          }
                        }}
                        className="text-[11px] font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg border border-violet-200 transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <Sparkles size={12} /> Auto-Tag Categories
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Thermometer size={13} /> Temperature °F (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 98.6 or 101.2"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Suspected Trigger (Optional)
                      </label>
                      <select
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">None / Unsure</option>
                        {COMMON_TRIGGERS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Additional Context / Observations
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Throbbing pain behind eyes, aggravated by bright light"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                    >
                      Save Log Entry
                    </button>
                  </div>
                </form>
              )}

              {/* Key Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">Average Pain Level</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-800">{stats.avgPain}</span>
                    <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">Peak Intensity</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-red-600">{stats.maxPain}</span>
                    <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">Average Mood</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-violet-700">
                      {moodCorrelationStats.avgMood !== 'N/A' ? `${moodCorrelationStats.avgMood}` : 'N/A'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ 5</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">Logged Entries</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-teal-700">{stats.totalEntries}</span>
                    <span className="text-xs text-slate-400 font-semibold">pts</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">Top Symptom</span>
                  <div className="text-xs font-bold text-slate-800 truncate" title={stats.topSymptom}>
                    {stats.topSymptom}
                  </div>
                </div>
              </div>

              {/* Mood vs Pain Correlation Insight Banner */}
              <div className="bg-gradient-to-r from-violet-50 via-teal-50 to-indigo-50 border border-violet-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
                <div className="p-2 bg-violet-600 text-white rounded-xl shadow-2xs flex-shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-violet-950 flex items-center gap-2">
                    <span>Mood & Physical Health Correlation Insights</span>
                    <span className="text-[10px] bg-violet-200 text-violet-900 px-2 py-0.5 rounded-full font-extrabold">
                      1-5 Rating Scale
                    </span>
                  </h4>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {moodCorrelationStats.summaryText}
                  </p>
                </div>
              </div>

              {/* MAIN RECHARTS TREND LINE CHART */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <TrendingUp size={16} className="text-teal-600" />
                      {viewMetric === 'pain'
                        ? 'Pain Level Progression Trajectory'
                        : viewMetric === 'temperature'
                        ? 'Temperature Trend Log'
                        : viewMetric === 'mood'
                        ? 'Daily Mood Trajectory (1-5 Scale)'
                        : 'Mood vs Physical Pain Level Correlation Chart'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {viewMetric === 'pain'
                        ? 'Track pain severity trends (0 = None, 1-3 = Mild, 4-6 = Moderate, 7-10 = Severe)'
                        : viewMetric === 'temperature'
                        ? 'Body temperature recordings over time (°F)'
                        : viewMetric === 'mood'
                        ? 'Daily emotional wellbeing ratings (1 = Very Low 😫, 3 = Neutral 😐, 5 = Excellent 😁)'
                        : 'Dual-axis comparison overlaying physical pain score (0-10) with daily mood score (1-5)'}
                    </p>
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-medium text-slate-600">No data points in this range.</p>
                  </div>
                ) : (
                  <div className="h-64 sm:h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="displayDate"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis
                          yAxisId="left"
                          domain={
                            viewMetric === 'pain' || viewMetric === 'correlation'
                              ? [0, 10]
                              : viewMetric === 'mood'
                              ? [1, 5]
                              : ['dataMin - 1', 'dataMax + 1']
                          }
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        {viewMetric === 'correlation' && (
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[1, 5]}
                            tick={{ fontSize: 11, fill: '#8b5cf6' }}
                            axisLine={{ stroke: '#8b5cf6' }}
                          />
                        )}
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                                  <p className="font-bold text-teal-300">{data.displayDate}</p>
                                  <p className="font-medium text-slate-200">
                                    Symptom: <span className="font-bold text-white">{data.symptomName}</span>
                                  </p>
                                  <p className="font-medium">
                                    Pain Level:{' '}
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold ${
                                        data.painLevel <= 3
                                          ? 'bg-emerald-900 text-emerald-300'
                                          : data.painLevel <= 6
                                          ? 'bg-amber-900 text-amber-300'
                                          : 'bg-red-900 text-red-300'
                                      }`}
                                    >
                                      {data.painLevel} / 10
                                    </span>
                                  </p>
                                  {data.mood && (
                                    <p className="font-medium text-violet-300">
                                      Mood:{' '}
                                      <span className="font-bold text-white">
                                        {MOOD_MAP[data.mood]?.emoji} {MOOD_MAP[data.mood]?.label} ({data.mood}/5)
                                      </span>
                                    </p>
                                  )}
                                  {data.temperature && (
                                    <p className="font-medium text-slate-300">
                                      Temp: <span className="font-bold text-white">{data.temperature} °F</span>
                                    </p>
                                  )}
                                  {data.trigger !== 'N/A' && (
                                    <p className="text-[11px] text-teal-200">Trigger: {data.trigger}</p>
                                  )}
                                  {data.notes && (
                                    <p className="text-[11px] text-slate-400 italic">"{data.notes}"</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />

                        {viewMetric === 'pain' && (
                          <>
                            <ReferenceLine yAxisId="left" y={3} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Mild', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
                            <ReferenceLine yAxisId="left" y={6} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderate', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
                            <ReferenceLine yAxisId="left" y={8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Severe', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
                          </>
                        )}

                        {viewMetric !== 'correlation' && (
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey={
                              viewMetric === 'pain'
                                ? 'painLevel'
                                : viewMetric === 'mood'
                                ? 'mood'
                                : 'temperature'
                            }
                            stroke={
                              viewMetric === 'pain'
                                ? '#0d9488'
                                : viewMetric === 'mood'
                                ? '#8b5cf6'
                                : '#f59e0b'
                            }
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={
                              viewMetric === 'pain'
                                ? 'url(#painGradient)'
                                : viewMetric === 'mood'
                                ? 'url(#moodGradient)'
                                : 'url(#tempGradient)'
                            }
                            dot={{
                              r: 4,
                              fill:
                                viewMetric === 'pain'
                                  ? '#0d9488'
                                  : viewMetric === 'mood'
                                  ? '#8b5cf6'
                                  : '#f59e0b',
                              strokeWidth: 2,
                              stroke: '#ffffff',
                            }}
                            activeDot={{ r: 7 }}
                          />
                        )}

                        {viewMetric === 'correlation' && (
                          <>
                            {/* Pain Area Chart on Left Y-Axis */}
                            <Area
                              yAxisId="left"
                              type="monotone"
                              dataKey="painLevel"
                              stroke="#0d9488"
                              strokeWidth={3}
                              fillOpacity={0.3}
                              fill="url(#painGradient)"
                              name="Pain Level (0-10)"
                              dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                            />
                            {/* Mood Line Chart on Right Y-Axis */}
                            <Area
                              yAxisId="right"
                              type="monotone"
                              dataKey="mood"
                              stroke="#8b5cf6"
                              strokeWidth={3}
                              fillOpacity={0.3}
                              fill="url(#moodGradient)"
                              name="Mood Score (1-5)"
                              dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#ffffff' }}
                            />
                          </>
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* SECONDARY CHART: SYMPTOM FREQUENCY BAR CHART & AI ANALYSIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart2 size={15} className="text-teal-600" />
                    Symptom Occurrence Breakdown
                  </h3>

                  {symptomFrequencyData.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-6 text-center">No symptom logs available.</p>
                  ) : (
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={symptomFrequencyData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={90} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0d9488" radius={[0, 6, 6, 0]}>
                            {symptomFrequencyData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0d9488' : '#0284c7'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-teal-900 text-white rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider mb-2">
                      <Brain size={16} /> MediGuide AI Trend Insights
                    </div>

                    <div className="space-y-2 text-xs text-teal-100 leading-relaxed">
                      {stats.totalEntries === 0 ? (
                        <p className="italic text-teal-200">
                          As you log your symptoms over time, MediGuide AI will automatically compute pain trends and highlight potential triggers or flare-up patterns here.
                        </p>
                      ) : (
                        <>
                          <p>
                            • <strong>Average Pain Level:</strong> Your reported pain averages{' '}
                            <span className="text-white font-bold">{stats.avgPain} / 10</span> across{' '}
                            {stats.totalEntries} entries.
                          </p>
                          <p>
                            • <strong>Primary Symptom:</strong> The most frequently reported issue is{' '}
                            <span className="text-teal-200 font-bold">{stats.topSymptom}</span>.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-teal-800/80 text-[10px] text-teal-300 italic flex items-center gap-1">
                    <Info size={12} /> Data is stored locally on your device for personal health tracking.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: VISUAL MONTHLY CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="space-y-5 animate-in fade-in zoom-in-98 duration-150">
              
              {/* Calendar Controls & Month Header Bar */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                
                {/* Month Navigator */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                      title="Previous Month"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleTodayMonth}
                      className="px-3 py-1 hover:bg-slate-100 rounded-lg text-xs font-bold text-teal-800 transition-colors"
                      title="Go to Today"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                      title="Next Month"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <h3 className="text-base font-black text-slate-800 pl-1">
                    {calendarMonthTitle}
                  </h3>
                </div>

                {/* Filters & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Symptom Filter */}
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-xs">
                    <Filter size={13} className="text-teal-600" />
                    <select
                      value={selectedSymptomFilter}
                      onChange={(e) => setSelectedSymptomFilter(e.target.value)}
                      className="bg-transparent font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Symptoms</option>
                      {uniqueSymptomNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Log Symptom Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setLogDate(selectedCalendarDate || new Date().toISOString().slice(0, 10));
                      setShowAddForm(true);
                      setActiveTab('trends');
                    }}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <Plus size={15} />
                    <span>Log Symptom</span>
                  </button>
                </div>
              </div>

              {/* Monthly Stats Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-teal-700 uppercase block">Monthly Logged Days</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-teal-900">{calendarMonthStats.uniqueDays}</span>
                    <span className="text-[11px] text-teal-600 font-medium">days ({calendarMonthStats.totalEntries} entries)</span>
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Monthly Avg Pain</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-amber-900">{calendarMonthStats.avgPain}</span>
                    <span className="text-[11px] text-amber-600 font-medium">/ 10</span>
                  </div>
                </div>

                <div className="bg-red-50/60 border border-red-200/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-red-700 uppercase block">High Severity (≥7/10)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-red-900">{calendarMonthStats.severeDays}</span>
                    <span className="text-[11px] text-red-600 font-medium">days</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Most Frequent</span>
                  <div className="text-xs font-bold text-slate-800 truncate mt-1" title={calendarMonthStats.topSymptom}>
                    {calendarMonthStats.topSymptom}
                  </div>
                </div>
              </div>

              {/* Main Calendar Grid & Day Details Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* 2 Cols on LG: Interactive Calendar Grid */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
                  
                  {/* Legend Header */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-2 flex-wrap gap-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Calendar size={13} className="text-teal-600" /> Click date to view details
                    </span>

                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mild (1-3)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Mod (4-6)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Sev (7-10)
                      </span>
                    </div>
                  </div>

                  {/* Day Names Row */}
                  <div className="grid grid-cols-7 text-center font-bold text-[11px] text-slate-400 uppercase py-1">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* Grid Cells */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {calendarGrid.map((dayObj, index) => {
                      const dayLogs = calendarLogsByDate[dayObj.dateStr] || [];
                      const hasLogs = dayLogs.length > 0;
                      const isToday = dayObj.dateStr === new Date().toISOString().slice(0, 10);
                      const isSelected = dayObj.dateStr === selectedCalendarDate;

                      // Peak pain on this day
                      const maxPainOnDay = hasLogs ? Math.max(...dayLogs.map((l) => l.painLevel)) : 0;

                      // Severity color theme for cell indicator
                      let severityBg = 'bg-slate-50 hover:bg-slate-100/80';
                      let severityBorder = 'border-slate-200';
                      let dotColor = 'bg-slate-300';

                      if (hasLogs) {
                        if (maxPainOnDay <= 3) {
                          severityBg = 'bg-emerald-50/80 hover:bg-emerald-100/80';
                          severityBorder = 'border-emerald-200';
                          dotColor = 'bg-emerald-500';
                        } else if (maxPainOnDay <= 6) {
                          severityBg = 'bg-amber-50/80 hover:bg-amber-100/80';
                          severityBorder = 'border-amber-200';
                          dotColor = 'bg-amber-500';
                        } else {
                          severityBg = 'bg-red-50/80 hover:bg-red-100/80';
                          severityBorder = 'border-red-200';
                          dotColor = 'bg-red-500';
                        }
                      }

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedCalendarDate(dayObj.dateStr)}
                          className={`min-h-[68px] sm:min-h-[82px] p-1 sm:p-1.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            !dayObj.isCurrentMonth
                              ? 'opacity-30 bg-slate-50 border-slate-100'
                              : isSelected
                              ? 'ring-2 ring-teal-600 bg-teal-50/90 border-teal-400 shadow-xs'
                              : isToday
                              ? 'ring-2 ring-amber-400 bg-amber-50/40 border-amber-300'
                              : `${severityBg} ${severityBorder}`
                          }`}
                        >
                          {/* Cell Header: Day Number & Indicator */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[11px] font-bold ${
                                isToday
                                  ? 'bg-amber-500 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px]'
                                  : dayObj.isCurrentMonth
                                  ? 'text-slate-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {dayObj.dayNum}
                            </span>

                            {hasLogs && (
                              <span
                                className={`w-2 h-2 rounded-full ${dotColor}`}
                                title={`${dayLogs.length} entry(ies)`}
                              />
                            )}
                          </div>

                          {/* Symptom Badges preview inside cell */}
                          {hasLogs && (
                            <div className="space-y-0.5 mt-1 overflow-hidden">
                              {dayLogs.slice(0, 2).map((log) => (
                                <div
                                  key={log.id}
                                  className={`text-[9px] font-bold px-1 py-0.5 rounded truncate flex items-center justify-between ${
                                    log.painLevel <= 3
                                      ? 'bg-emerald-100/90 text-emerald-900'
                                      : log.painLevel <= 6
                                      ? 'bg-amber-100/90 text-amber-900'
                                      : 'bg-red-100/90 text-red-900'
                                  }`}
                                  title={`${log.symptomName}: Pain ${log.painLevel}/10`}
                                >
                                  <span className="truncate">{log.symptomName}</span>
                                  <span className="ml-0.5 font-black">{log.painLevel}</span>
                                </div>
                              ))}
                              {dayLogs.length > 2 && (
                                <div className="text-[8px] font-bold text-slate-500 text-right pr-0.5">
                                  +{dayLogs.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1 Col on LG: Selected Day Details Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Selected Day Details
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                          {formattedSelectedDate}
                        </h4>
                      </div>

                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                        {selectedDateLogs.length} Logged
                      </span>
                    </div>

                    {/* Logs List for Selected Date */}
                    <div className="mt-3 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {selectedDateLogs.length === 0 ? (
                        <div className="text-center py-10 px-3 bg-white border border-dashed border-slate-200 rounded-xl space-y-2">
                          <Calendar size={28} className="mx-auto text-slate-300" />
                          <p className="text-xs font-medium text-slate-600">
                            No symptoms logged for this date.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setLogDate(selectedCalendarDate);
                              setShowAddForm(true);
                              setActiveTab('trends');
                            }}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 underline inline-flex items-center gap-1"
                          >
                            <Plus size={13} /> Log Entry for {selectedCalendarDate}
                          </button>
                        </div>
                      ) : (
                        selectedDateLogs.map((log) => (
                          <div
                            key={log.id}
                            className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-slate-800">
                                  {log.symptomName}
                                </h5>
                                <span className="text-[10px] text-slate-400">
                                  Logged for {log.date}
                                </span>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-md text-xs font-extrabold border ${getPainBadgeClass(
                                  log.painLevel
                                )}`}
                              >
                                Pain: {log.painLevel}/10
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                                  Mood
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {log.mood && MOOD_MAP[log.mood]
                                    ? `${MOOD_MAP[log.mood].emoji} ${MOOD_MAP[log.mood].label} (${log.mood}/5)`
                                    : 'Not logged'}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                                  Temperature
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {log.temperature ? `${log.temperature} °F` : 'Not recorded'}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[9px] uppercase font-bold">
                                  Trigger
                                </span>
                                <span className="font-semibold text-slate-700 truncate block">
                                  {log.trigger || 'None'}
                                </span>
                              </div>
                            </div>

                            {log.notes && (
                              <p className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                                "{log.notes}"
                              </p>
                            )}

                            {log.tags && log.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {log.tags.map((t) => (
                                  <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-violet-100 text-violet-800 border border-violet-200 rounded-md flex items-center gap-0.5">
                                    <Zap size={9} /> #{t}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleStartComparison(log)}
                                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                              >
                                <GitCompare size={12} /> Compare
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteLog(log.id)}
                                className="text-[11px] font-semibold text-red-600 hover:text-red-800 flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Entry Quick Action for Selected Day */}
                  <button
                    type="button"
                    onClick={() => {
                      setLogDate(selectedCalendarDate);
                      setShowAddForm(true);
                      setActiveTab('trends');
                    }}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Plus size={15} /> Log Symptom for {selectedCalendarDate}
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: SIDE-BY-SIDE LOG COMPARISON */}
          {activeTab === 'compare' && (
            <div className="space-y-6 animate-in fade-in zoom-in-98 duration-150">
              {/* Presets & Controls Header */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GitCompare size={18} className="text-teal-700" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Select Symptom Logs to Compare
                    </h3>
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-medium text-[11px]">Quick Compare:</span>
                    <button
                      onClick={() => handlePresetPresetComparison('latest')}
                      className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 text-teal-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Latest 2 Entries
                    </button>
                    <button
                      onClick={() => handlePresetPresetComparison('peak')}
                      className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-slate-200 text-amber-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Peak Pain vs. Latest
                    </button>
                    <button
                      onClick={() => handlePresetPresetComparison('same_symptom')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Same Symptom Pair
                    </button>
                  </div>
                </div>

                {/* Dropdown Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1">
                  {/* Select Log A */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">
                      Baseline Entry A (Earlier / Reference)
                    </label>
                    <select
                      value={logA?.id || ''}
                      onChange={(e) => setCompareIdA(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {sortedLogs.map((l) => (
                        <option key={`a-${l.id}`} value={l.id}>
                          {l.date} — {l.symptomName} (Pain: {l.painLevel}/10)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleSwapComparison}
                      className="p-2.5 bg-white border border-slate-200 hover:bg-teal-50 hover:border-teal-300 text-slate-600 hover:text-teal-700 rounded-xl transition-all shadow-2xs"
                      title="Swap Entry A and Entry B"
                    >
                      <ArrowRightLeft size={16} />
                    </button>
                  </div>

                  {/* Select Log B */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">
                      Comparison Entry B (Follow-up / Recent)
                    </label>
                    <select
                      value={logB?.id || ''}
                      onChange={(e) => setCompareIdB(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {sortedLogs.map((l) => (
                        <option key={`b-${l.id}`} value={l.id}>
                          {l.date} — {l.symptomName} (Pain: {l.painLevel}/10)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SIDE-BY-SIDE COMPARISON DISPLAY */}
              {logA && logB && comparisonDeltas ? (
                <div className="space-y-5">
                  
                  {/* Delta & Change Summary Highlight Banner */}
                  <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-teal-300" />
                        <span className="font-bold text-xs uppercase tracking-wider text-teal-200">
                          Comparative Pattern Analytics
                        </span>
                      </div>

                      <span className="text-xs text-teal-300 font-medium">
                        Time Gap: <strong>{comparisonDeltas.daysApart} day(s)</strong> apart
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Pain Score Delta */}
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                        <span className="text-[10px] text-teal-200 block uppercase font-bold">
                          Pain Level Shift
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-black text-white">
                            {logA.painLevel} → {logB.painLevel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-extrabold flex items-center gap-0.5 ${
                              comparisonDeltas.painDelta < 0
                                ? 'bg-emerald-500 text-white'
                                : comparisonDeltas.painDelta > 0
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-600 text-slate-200'
                            }`}
                          >
                            {comparisonDeltas.painDelta < 0 ? (
                              <ArrowDownRight size={14} />
                            ) : comparisonDeltas.painDelta > 0 ? (
                              <ArrowUpRight size={14} />
                            ) : (
                              <Minus size={14} />
                            )}
                            {comparisonDeltas.painDelta === 0
                              ? 'Unchanged'
                              : `${Math.abs(comparisonDeltas.painDelta)} pts ${
                                  comparisonDeltas.painDelta < 0 ? 'lower' : 'higher'
                                }`}
                          </span>
                        </div>
                      </div>

                      {/* Temperature Delta */}
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                        <span className="text-[10px] text-teal-200 block uppercase font-bold">
                          Body Temperature Delta
                        </span>
                        <div className="text-sm font-bold text-white mt-1">
                          {comparisonDeltas.tempDelta !== null ? (
                            <span className="flex items-center gap-1">
                              {logA.temperature} °F → {logB.temperature} °F
                              <span
                                className={`text-xs px-1.5 py-0.2 rounded font-bold ${
                                  comparisonDeltas.tempDelta <= 0
                                    ? 'text-emerald-300'
                                    : 'text-amber-300'
                                }`}
                              >
                                ({comparisonDeltas.tempDelta > 0 ? '+' : ''}
                                {comparisonDeltas.tempDelta} °F)
                              </span>
                            </span>
                          ) : (
                            <span className="text-teal-300/70 text-xs font-normal">
                              Temp not logged for both
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Trigger Shift */}
                      <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                        <span className="text-[10px] text-teal-200 block uppercase font-bold">
                          Trigger Correlation
                        </span>
                        <p className="text-xs text-white font-medium mt-1 truncate">
                          {logA.trigger || 'None'} → {logB.trigger || 'None'}
                        </p>
                      </div>
                    </div>

                    {/* Ask AI to evaluate button */}
                    {onAskAIComparison && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAskAIToEvaluateComparison}
                          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-sm hover:shadow-md"
                        >
                          <MessageSquare size={15} />
                          Ask MediGuide AI to Analyze Comparison
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CARDS SIDE-BY-SIDE GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* LOG A CARD */}
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                            Baseline Entry A
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {logA.date}
                          </h4>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black border ${getPainBadgeClass(
                            logA.painLevel
                          )}`}
                        >
                          Pain: {logA.painLevel} / 10
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-semibold block text-[11px]">Symptom Name:</span>
                          <span className="font-bold text-slate-800 text-sm">{logA.symptomName}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-semibold block text-[11px]">Mood:</span>
                            <span className="font-bold text-slate-800">
                              {logA.mood && MOOD_MAP[logA.mood]
                                ? `${MOOD_MAP[logA.mood].emoji} ${MOOD_MAP[logA.mood].label}`
                                : 'Not logged'}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-semibold block text-[11px]">Temperature:</span>
                            <span className="font-bold text-slate-800">
                              {logA.temperature ? `${logA.temperature} °F` : 'Not recorded'}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-semibold block text-[11px]">Trigger:</span>
                            <span className="font-bold text-slate-800 truncate block">{logA.trigger || 'None'}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-semibold block text-[11px] mb-0.5">Notes & Context:</span>
                          <p className="text-slate-700 italic font-medium leading-relaxed">
                            "{logA.notes || 'No notes logged for this entry.'}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* LOG B CARD */}
                    <div className="bg-white border-2 border-teal-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                            Comparison Entry B
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {logB.date}
                          </h4>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black border ${getPainBadgeClass(
                            logB.painLevel
                          )}`}
                        >
                          Pain: {logB.painLevel} / 10
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-semibold block text-[11px]">Symptom Name:</span>
                          <span className="font-bold text-slate-800 text-sm">{logB.symptomName}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-semibold block text-[11px]">Mood:</span>
                            <span className="font-bold text-slate-800">
                              {logB.mood && MOOD_MAP[logB.mood]
                                ? `${MOOD_MAP[logB.mood].emoji} ${MOOD_MAP[logB.mood].label}`
                                : 'Not logged'}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-semibold block text-[11px]">Temperature:</span>
                            <span className="font-bold text-slate-800">
                              {logB.temperature ? `${logB.temperature} °F` : 'Not recorded'}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-400 font-semibold block text-[11px]">Trigger:</span>
                            <span className="font-bold text-slate-800 truncate block">{logB.trigger || 'None'}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-semibold block text-[11px] mb-0.5">Notes & Context:</span>
                          <p className="text-slate-700 italic font-medium leading-relaxed">
                            "{logB.notes || 'No notes logged for this entry.'}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <GitCompare size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">Please select two entries above to compare.</p>
                </div>
              )}
            </div>
          )}

          {/* Log History Table with Compare Quick Action */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>All Logged Entries History ({filteredLogs.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">Click 'Compare' on any row to load into side-by-side view</span>
            </h3>

            {filteredLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 italic">No logged entries found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Symptom</th>
                      <th className="py-2.5 px-3">Pain Score</th>
                      <th className="py-2.5 px-3">Temp</th>
                      <th className="py-2.5 px-3">Trigger</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-teal-800">{log.symptomName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getPainBadgeClass(
                              log.painLevel
                            )}`}
                          >
                            {log.painLevel} / 10
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {log.temperature ? `${log.temperature} °F` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{log.trigger || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                          {log.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartComparison(log)}
                              className="px-2 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200 flex items-center gap-1"
                              title="Compare this log entry"
                            >
                              <GitCompare size={12} /> Compare
                            </button>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomTrendsModal;
