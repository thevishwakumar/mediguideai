import React, { useState } from 'react';
import {
  Bell,
  X,
  Plus,
  Pill,
  Activity,
  Clock,
  Trash2,
  Check,
  Volume2,
  AlertCircle,
  Sparkles,
  Calendar,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { Reminder, ReminderType, ReminderFrequency } from '../types';
import {
  requestNotificationPermission,
  sendBrowserNotification,
  playNotificationChime,
} from '../utils/notificationUtils';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onTriggerTestReminder: (reminder: Reminder) => void;
}

const MEDICATION_PRESETS = [
  'Morning Medication (e.g. 8:00 AM)',
  'Evening Medication (e.g. 8:00 PM)',
  'Antibiotic Dose',
  'Pain Reliever',
  'Blood Pressure Medication',
];

const SYMPTOM_PRESETS = [
  'Check Temperature / Fever',
  'Evaluate Pain Level (1-10)',
  'Inspect Skin Rash / Inflammation',
  'Blood Pressure / Pulse Check',
  'Blood Glucose Check',
];

const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onTriggerTestReminder,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>('medication');
  const [time, setTime] = useState('09:00');
  const [frequency, setFrequency] = useState<ReminderFrequency>('daily');
  const [notes, setNotes] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'medication' | 'symptom_check'>('all');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  );

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    const status = await requestNotificationPermission();
    setPermissionStatus(status);
    if (status === 'granted') {
      playNotificationChime();
      sendBrowserNotification('MediGuide AI Notifications Enabled', {
        body: 'You will receive reminders for scheduled medication and symptom check-ins.',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReminder({
      title: title.trim(),
      type,
      time,
      frequency,
      notes: notes.trim(),
      enabled: true,
    });

    setTitle('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleApplyPreset = (presetText: string) => {
    setTitle(presetText.split(' (')[0]);
  };

  const handleTestSoundAndPermission = () => {
    playNotificationChime();
    sendBrowserNotification('MediGuide AI Reminder Test', {
      body: 'This is a test notification for your health reminders.',
    });
  };

  const filteredReminders = reminders.filter((r) => {
    if (activeFilter === 'medication') return r.type === 'medication';
    if (activeFilter === 'symptom_check') return r.type === 'symptom_check';
    return true;
  });

  const formatTime12h = (time24: string) => {
    const [hoursStr, minutesStr] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
              <Bell size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Health & Medication Reminders</h2>
              <p className="text-xs text-teal-100 font-medium">
                Schedule local alerts to check symptoms or take medication
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

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Notification Permission Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-lg ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {permissionStatus === 'granted' ? <Check size={16} /> : <AlertCircle size={16} />}
              </div>
              <div>
                <span className="font-semibold text-slate-800 block">
                  Browser Notifications: {permissionStatus === 'granted' ? 'Enabled' : 'Not Granted'}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {permissionStatus === 'granted'
                    ? 'Audio chime and desktop popups ready.'
                    : 'Click to enable browser popups or test in-app sound.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {permissionStatus !== 'granted' && (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition-colors"
                >
                  Enable
                </button>
              )}
              <button
                type="button"
                onClick={handleTestSoundAndPermission}
                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs flex items-center gap-1 transition-colors"
                title="Play test chime and trigger alert"
              >
                <Volume2 size={13} />
                Test Chime
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({reminders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('medication')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeFilter === 'medication'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Pill size={13} />
                Meds ({reminders.filter((r) => r.type === 'medication').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('symptom_check')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeFilter === 'symptom_check'
                    ? 'bg-teal-100 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Activity size={13} />
                Checks ({reminders.filter((r) => r.type === 'symptom_check').length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-xs"
            >
              <Plus size={15} />
              {showAddForm ? 'Cancel' : 'New Reminder'}
            </button>
          </div>

          {/* Add Reminder Form */}
          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 space-y-4 animate-in fade-in zoom-in-98 duration-150"
            >
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-teal-600" /> Schedule New Health Reminder
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reminder Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('medication')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      type === 'medication'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Pill size={14} />
                    Medication
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('symptom_check')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      type === 'symptom_check'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Activity size={14} />
                    Symptom Check-in
                  </button>
                </div>
              </div>

              {/* Preset Shortcuts */}
              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-1">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(type === 'medication' ? MEDICATION_PRESETS : SYMPTOM_PRESETS).map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-lg transition-colors"
                      >
                        + {preset.split(' (')[0]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reminder Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    type === 'medication'
                      ? 'e.g. Take Amoxicillin 500mg'
                      : 'e.g. Check temperature and pain level'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Time & Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock size={13} /> Scheduled Time
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar size={13} /> Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as ReminderFrequency)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="once">One-time</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText size={13} /> Instructions / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with a full glass of water after breakfast"
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
                  Save Reminder
                </button>
              </div>
            </form>
          )}

          {/* List of Reminders */}
          <div className="space-y-2.5">
            {filteredReminders.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Bell size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No scheduled reminders set.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click 'New Reminder' to add medication or symptom check alerts.
                </p>
              </div>
            ) : (
              filteredReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    reminder.enabled
                      ? 'bg-white border-slate-200 shadow-2xs hover:border-teal-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        reminder.type === 'medication'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {reminder.type === 'medication' ? (
                        <Pill size={18} />
                      ) : (
                        <Activity size={18} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {reminder.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold ${
                            reminder.type === 'medication'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}
                        >
                          {reminder.type === 'medication' ? 'Medication' : 'Symptom Check'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Clock size={12} className="text-teal-600" />
                          {formatTime12h(reminder.time)}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{reminder.frequency}</span>
                      </div>

                      {reminder.notes && (
                        <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 italic">
                          "{reminder.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleReminder(reminder.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        reminder.enabled ? 'bg-teal-600' : 'bg-slate-300'
                      }`}
                      title={reminder.enabled ? 'Disable reminder' : 'Enable reminder'}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          reminder.enabled ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Test Trigger */}
                    <button
                      type="button"
                      onClick={() => onTriggerTestReminder(reminder)}
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Trigger Now (Test)"
                    >
                      <Volume2 size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteReminder(reminder.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Reminder"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed flex items-start gap-2">
            <ShieldAlert size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Reminders operate while MediGuide AI is open in your browser. Ensure sound or notifications are allowed for audible alerts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemindersModal;
