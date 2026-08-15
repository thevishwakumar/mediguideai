import React, { useState, useEffect } from 'react';
import { User, X, Save, Heart, Activity, Check, Trash2, Phone, ShieldAlert, Mail, Stethoscope, Plus } from 'lucide-react';
import { HealthProfile, EmergencyContact } from '../types';

interface HealthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HealthProfile;
  onSaveProfile: (profile: HealthProfile) => void;
}

const COMMON_CONDITIONS = [
  'Asthma',
  'Hypertension (High Blood Pressure)',
  'Type 2 Diabetes',
  'Type 1 Diabetes',
  'High Cholesterol',
  'Heart Disease',
  'Seasonal Allergies',
  'Thyroid Disorder',
  'Migraine',
  'Arthritis'
];

const PRESET_CONTACTS: { label: string; contact: EmergencyContact }[] = [
  {
    label: '🩺 Primary Doctor',
    contact: {
      name: 'Dr. Sarah Jenkins',
      relationship: 'Primary Care Physician',
      phone: '+1 (555) 234-5678',
      email: 'drjenkins@citymed.org',
      notes: 'Main Clinic: City Medical Group, Suite 400. Patient ID #4829.',
    },
  },
  {
    label: '🚨 Family Contact',
    contact: {
      name: 'Alex Smith',
      relationship: 'Spouse / Primary Emergency Contact',
      phone: '+1 (555) 987-6543',
      email: 'alex.smith@example.com',
      notes: 'Key holder & emergency healthcare proxy.',
    },
  },
  {
    label: '🏥 Urgent Care',
    contact: {
      name: 'Metro Urgent Care Center',
      relationship: 'Urgent Care Center Hotline',
      phone: '+1 (800) 555-2273',
      notes: 'Open 24/7 on 5th Avenue.',
    },
  },
  {
    label: '🚑 Emergency (911)',
    contact: {
      name: 'Local Emergency Services',
      relationship: 'Emergency Medical Dispatch',
      phone: '911',
      notes: 'Call immediately for life-threatening symptoms.',
    },
  },
];

const HealthProfileModal: React.FC<HealthProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [age, setAge] = useState(profile.age || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [conditions, setConditions] = useState(profile.preExistingConditions || '');
  
  // Emergency Contact State
  const [contactName, setContactName] = useState(profile.emergencyContact?.name || '');
  const [contactRelationship, setContactRelationship] = useState(
    profile.emergencyContact?.relationship || 'Primary Care Physician'
  );
  const [contactPhone, setContactPhone] = useState(profile.emergencyContact?.phone || '');
  const [contactEmail, setContactEmail] = useState(profile.emergencyContact?.email || '');
  const [contactNotes, setContactNotes] = useState(profile.emergencyContact?.notes || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAge(profile.age || '');
      setGender(profile.gender || '');
      setConditions(profile.preExistingConditions || '');
      setContactName(profile.emergencyContact?.name || '');
      setContactRelationship(profile.emergencyContact?.relationship || 'Primary Care Physician');
      setContactPhone(profile.emergencyContact?.phone || '');
      setContactEmail(profile.emergencyContact?.email || '');
      setContactNotes(profile.emergencyContact?.notes || '');
      setSavedSuccess(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: EmergencyContact) => {
    setContactName(preset.name);
    setContactRelationship(preset.relationship);
    setContactPhone(preset.phone);
    if (preset.email) setContactEmail(preset.email);
    if (preset.notes) setContactNotes(preset.notes);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let emergencyContact: EmergencyContact | undefined = undefined;
    if (contactName.trim() || contactPhone.trim()) {
      emergencyContact = {
        name: contactName.trim() || 'Emergency Contact',
        relationship: contactRelationship.trim() || 'Primary Contact',
        phone: contactPhone.trim(),
        email: contactEmail.trim() || undefined,
        notes: contactNotes.trim() || undefined,
      };
    }

    const updatedProfile: HealthProfile = {
      age: age.trim(),
      gender: gender.trim(),
      preExistingConditions: conditions.trim(),
      emergencyContact,
    };

    onSaveProfile(updatedProfile);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const toggleConditionTag = (condition: string) => {
    const currentList = conditions
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    let updatedList: string[];
    if (currentList.some((c) => c.toLowerCase() === condition.toLowerCase())) {
      updatedList = currentList.filter(
        (c) => c.toLowerCase() !== condition.toLowerCase()
      );
    } else {
      updatedList = [...currentList, condition];
    }
    setConditions(updatedList.join(', '));
  };

  const handleClear = () => {
    setAge('');
    setGender('');
    setConditions('');
    setContactName('');
    setContactRelationship('Primary Care Physician');
    setContactPhone('');
    setContactEmail('');
    setContactNotes('');
    onSaveProfile({});
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Health Profile Context</h2>
              <p className="text-xs text-teal-100 font-medium">
                Helps Gemini AI provide contextually tailored insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-100 hover:bg-white/10 hover:text-white transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-medium animate-pulse">
              <Check size={18} />
              Health profile saved to local storage!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label htmlFor="health-profile-age" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Age
              </label>
              <input
                id="health-profile-age"
                type="number"
                min="0"
                max="120"
                placeholder="e.g., 34"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm"
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="health-profile-gender" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Biological Sex / Gender
              </label>
              <select
                id="health-profile-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm"
              >
                <option value="">Select or type custom...</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Chronic / Pre-existing conditions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="health-profile-conditions" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Pre-Existing & Chronic Conditions
              </label>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>
            <textarea
              id="health-profile-conditions"
              rows={3}
              placeholder="e.g., Asthma, Hypertension, Type 2 Diabetes, Penicillin Allergy..."
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm resize-none"
            />

            {/* Quick condition tags */}
            <div className="mt-2.5">
              <p className="text-[11px] text-slate-500 font-medium mb-1.5 flex items-center gap-1">
                <Heart size={12} className="text-teal-600" /> Quick Add Common Conditions:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CONDITIONS.map((cond) => {
                  const isSelected = conditions
                    .toLowerCase()
                    .includes(cond.toLowerCase());
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleConditionTag(cond)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-teal-100 border-teal-300 text-teal-800 font-medium shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? `✓ ${cond}` : `+ ${cond}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Emergency Contact & Primary Physician Section */}
          <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-rose-600 text-white p-1.5 rounded-lg shadow-2xs">
                  <Phone size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Emergency Contact & Physician
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Quick-access contact for urgent AI symptom triggers
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {contactName ? 'Configured' : 'Optional'}
              </span>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CONTACTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.contact)}
                    className="text-xs px-2.5 py-1 bg-white border border-rose-200 hover:border-rose-300 text-slate-700 hover:text-rose-900 rounded-lg font-medium transition-colors shadow-2xs"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Contact Name */}
              <div>
                <label htmlFor="emergency-contact-name" className="block text-[11px] font-bold text-slate-700 mb-1">
                  Contact / Doctor Name
                </label>
                <input
                  id="emergency-contact-name"
                  type="text"
                  placeholder="e.g., Dr. Sarah Jenkins or Jane Doe"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              {/* Relationship / Role */}
              <div>
                <label htmlFor="emergency-contact-role" className="block text-[11px] font-bold text-slate-700 mb-1">
                  Relationship / Role
                </label>
                <select
                  id="emergency-contact-role"
                  value={contactRelationship}
                  onChange={(e) => setContactRelationship(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                >
                  <option value="Primary Care Physician">Primary Care Physician</option>
                  <option value="Specialist / Cardiologist">Specialist / Cardiologist</option>
                  <option value="Spouse / Partner">Spouse / Partner</option>
                  <option value="Parent / Family Member">Parent / Family Member</option>
                  <option value="Emergency Caregiver">Emergency Caregiver</option>
                  <option value="Emergency Dispatch (911)">Emergency Dispatch (911)</option>
                  <option value="Urgent Care Clinic">Urgent Care Clinic</option>
                </select>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="emergency-contact-phone" className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Phone Number</span>
                  {contactPhone && (
                    <a
                      href={`tel:${contactPhone}`}
                      className="text-rose-700 hover:underline text-[10px] font-bold flex items-center gap-0.5"
                    >
                      <Phone size={10} /> Test Tel Link
                    </a>
                  )}
                </label>
                <input
                  id="emergency-contact-phone"
                  type="tel"
                  placeholder="e.g., +1 (555) 234-5678 or 911"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-mono"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label htmlFor="emergency-contact-email" className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  id="emergency-contact-email"
                  type="email"
                  placeholder="e.g., doctor@clinic.org"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>
            </div>

            {/* Notes / Special Instructions */}
            <div>
              <label htmlFor="emergency-contact-notes" className="block text-[11px] font-bold text-slate-700 mb-1">
                Emergency Notes / Clinical Instructions
              </label>
              <input
                id="emergency-contact-notes"
                type="text"
                placeholder="e.g., Patient ID #4829, Medical Proxy, Call if severe headache or chest tightness occurs"
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
            <strong>Privacy Note:</strong> This health profile and emergency contact information are saved locally in your browser's <code className="bg-amber-100 px-1 py-0.5 rounded">localStorage</code> and attached to AI requests for relevant assessment context.
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
              title="Clear saved health profile"
            >
              <Trash2 size={14} />
              Clear Profile
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
              >
                <Save size={16} />
                Save Context
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthProfileModal;
