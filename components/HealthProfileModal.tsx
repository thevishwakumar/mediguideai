import React, { useState, useEffect } from 'react';
import { User, X, Save, Heart, Activity, Check, Trash2 } from 'lucide-react';
import { HealthProfile } from '../types';

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

const HealthProfileModal: React.FC<HealthProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [age, setAge] = useState(profile.age || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [conditions, setConditions] = useState(profile.preExistingConditions || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAge(profile.age || '');
      setGender(profile.gender || '');
      setConditions(profile.preExistingConditions || '');
      setSavedSuccess(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: HealthProfile = {
      age: age.trim(),
      gender: gender.trim(),
      preExistingConditions: conditions.trim(),
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

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
            <strong>Privacy Note:</strong> This health profile is saved locally in your browser's <code className="bg-amber-100 px-1 py-0.5 rounded">localStorage</code> and attached to AI requests for relevant assessment context.
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
