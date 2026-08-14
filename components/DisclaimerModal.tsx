import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-amber-900">Important Disclaimer</h2>
        </div>
        
        <div className="p-6 space-y-4 text-slate-600 leading-relaxed">
          <p>
            <strong>MediGuide AI is NOT a doctor.</strong>
          </p>
          <p>
            This application uses artificial intelligence to provide educational information based on symptoms you describe. It cannot diagnose diseases, prescribe medication, or treat medical conditions.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Do not use this for emergency situations.</li>
            <li>If you have a medical emergency, call your local emergency number immediately.</li>
            <li>Always consult with a qualified healthcare professional for diagnosis and treatment.</li>
          </ul>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onAccept}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <CheckCircle className="w-5 h-5" />
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
