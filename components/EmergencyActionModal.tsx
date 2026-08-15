import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, Copy, Check, X, ShieldAlert, User, AlertTriangle, ExternalLink } from 'lucide-react';
import { HealthProfile, Message } from '../types';

interface EmergencyActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthProfile: HealthProfile;
  currentSummary: string | null;
  latestMessages: Message[];
  onOpenProfile: () => void;
}

const EmergencyActionModal: React.FC<EmergencyActionModalProps> = ({
  isOpen,
  onClose,
  healthProfile,
  currentSummary,
  latestMessages,
  onOpenProfile,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const contact = healthProfile.emergencyContact;
  const phone = contact?.phone || '911';
  const name = contact?.name || 'Emergency Medical Services (911)';
  const relationship = contact?.relationship || 'Emergency Services';

  // Construct summary text for SMS / Email / Copying
  const summaryText = currentSummary || 
    (latestMessages.find(m => m.role === 'model')?.content.slice(0, 200) + '...') ||
    'Urgent symptom evaluation logged in MediGuide AI.';

  const profileDetails = [
    healthProfile.age ? `Age: ${healthProfile.age}` : null,
    healthProfile.gender ? `Sex: ${healthProfile.gender}` : null,
    healthProfile.preExistingConditions ? `Conditions: ${healthProfile.preExistingConditions}` : null,
  ].filter(Boolean).join(' | ');

  const fullReportText = `[MEDIGUIDE AI - URGENT SYMPTOM ALERT]\n` +
    `Patient Info: ${profileDetails || 'Not specified'}\n\n` +
    `AI Clinical Summary:\n${summaryText}\n\n` +
    `Timestamp: ${new Date().toLocaleString()}`;

  const smsUri = `sms:${phone}?body=${encodeURIComponent(
    `[MediGuide AI Alert] Urgent health check required. ${summaryText.slice(0, 140)}`
  )}`;

  const mailtoUri = contact?.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(
        `URGENT Health Alert - ${healthProfile.age ? `Patient Age ${healthProfile.age}` : 'MediGuide AI Assessment'}`
      )}&body=${encodeURIComponent(fullReportText)}`
    : '';

  const handleCopyReport = () => {
    navigator.clipboard.writeText(fullReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md animate-pulse">
              <ShieldAlert size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Urgent Priority
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5">
                Emergency Contact Quick-Access
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-100 hover:bg-white/10 hover:text-white transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* AI Urgent Warning Alert */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 space-y-1">
              <strong className="font-bold block">Urgent Symptoms Detected in Current Session</strong>
              <p className="text-rose-800 leading-relaxed">
                MediGuide AI flagged symptoms that may require prompt medical evaluation. Reach out to your saved doctor or emergency contact below.
              </p>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Saved Contact / Physician
                </span>
                <h3 className="text-base font-black text-slate-800 mt-0.5">{name}</h3>
                <p className="text-xs font-semibold text-rose-700">{relationship}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
              >
                <User size={12} /> Edit Contact
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800">
              <Phone size={14} className="text-rose-600" />
              <span>{phone}</span>
              {contact?.email && (
                <span className="text-slate-400 font-sans font-normal ml-auto text-[11px] truncate max-w-[160px]">
                  {contact.email}
                </span>
              )}
            </div>

            {contact?.notes && (
              <p className="text-xs text-slate-600 italic bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                "{contact.notes}"
              </p>
            )}
          </div>

          {/* Primary Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Call Button */}
            <a
              href={`tel:${phone}`}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 text-xs"
            >
              <Phone size={16} />
              <span>Call {contact ? name.split(' ')[0] : 'Emergency'} Now</span>
            </a>

            {/* SMS Message Button */}
            <a
              href={smsUri}
              className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 text-xs"
            >
              <MessageSquare size={16} />
              <span>Send SMS Alert</span>
            </a>

            {/* Email Summary Button (if email present) */}
            {contact?.email ? (
              <a
                href={mailtoUri}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-xs"
              >
                <Mail size={15} />
                <span>Email Clinical Report</span>
              </a>
            ) : (
              <a
                href="tel:911"
                className="flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs"
              >
                <ShieldAlert size={15} />
                <span>Call 911 Emergency</span>
              </a>
            )}

            {/* Copy Report Button */}
            <button
              type="button"
              onClick={handleCopyReport}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-200 transition-all text-xs"
            >
              {copied ? (
                <>
                  <Check size={15} className="text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={15} className="text-slate-600" />
                  <span>Copy Report for Doctor</span>
                </>
              )}
            </button>
          </div>

          {/* AI Clinical Summary Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Current AI Health Summary
            </span>
            <p className="text-xs text-slate-700 line-clamp-3 italic">
              "{summaryText}"
            </p>
          </div>

          {!contact && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 underline inline-flex items-center gap-1"
              >
                + Add your Primary Physician or Family Contact in Settings
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmergencyActionModal;
