import React from 'react';
import { Bell, Pill, Activity, Check, Clock, X, MessageSquare } from 'lucide-react';
import { Reminder } from '../types';

interface ReminderToastProps {
  reminder: Reminder;
  onDismiss: () => void;
  onSnooze: (reminder: Reminder) => void;
  onCheckInWithAI: (reminder: Reminder) => void;
}

const ReminderToast: React.FC<ReminderToastProps> = ({
  reminder,
  onDismiss,
  onSnooze,
  onCheckInWithAI,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full bg-white border-2 border-teal-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl text-white ${
              reminder.type === 'medication' ? 'bg-indigo-600' : 'bg-teal-600'
            }`}
          >
            {reminder.type === 'medication' ? <Pill size={22} /> : <Activity size={22} />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                {reminder.type === 'medication' ? 'Medication Alert' : 'Symptom Check-in'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Just now</span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mt-1">{reminder.title}</h3>

            {reminder.notes && (
              <p className="text-xs text-slate-600 mt-0.5 font-medium">"{reminder.notes}"</p>
            )}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onSnooze(reminder)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
        >
          <Clock size={13} />
          Snooze 15m
        </button>

        <div className="flex items-center gap-2">
          {reminder.type === 'symptom_check' && (
            <button
              onClick={() => onCheckInWithAI(reminder)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors border border-indigo-200"
            >
              <MessageSquare size={13} />
              Ask AI Now
            </button>
          )}

          <button
            onClick={onDismiss}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <Check size={14} />
            Mark Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderToast;
