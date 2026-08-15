import React, { useState } from 'react';
import { Download, Printer, FileText, FileCode, X, Check, Eye } from 'lucide-react';
import { Message, HealthProfile } from '../types';
import {
  generatePlainTextReport,
  generateMarkdownReport,
  downloadFile,
  printMedicalReport,
} from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  healthProfile?: HealthProfile;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  messages,
  healthProfile,
}) => {
  const [includeProfile, setIncludeProfile] = useState(true);
  const [activeFormat, setActiveFormat] = useState<'pdf' | 'txt' | 'md'>('pdf');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (activeFormat === 'pdf') {
      printMedicalReport(messages, healthProfile, includeProfile);
      onClose();
    } else if (activeFormat === 'txt') {
      const textContent = generatePlainTextReport(messages, healthProfile, includeProfile);
      downloadFile(`MediGuide_Symptom_Report_${timestamp}.txt`, textContent, 'text/plain');
      onClose();
    } else if (activeFormat === 'md') {
      const mdContent = generateMarkdownReport(messages, healthProfile, includeProfile);
      downloadFile(`MediGuide_Symptom_Report_${timestamp}.md`, mdContent, 'text/markdown');
      onClose();
    }
  };

  const handleCopyText = () => {
    const textContent = generatePlainTextReport(messages, healthProfile, includeProfile);
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewText =
    activeFormat === 'md'
      ? generateMarkdownReport(messages, healthProfile, includeProfile)
      : generatePlainTextReport(messages, healthProfile, includeProfile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Download size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Export Health Analysis</h2>
              <p className="text-xs text-teal-100 font-medium">
                Download or print report for your doctor
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

        <div className="p-6 space-y-5">
          {/* Include Health Profile Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block">
                Include Health Profile Context
              </span>
              <span className="text-xs text-slate-500">
                Attaches age, sex, and conditions to the top of the report
              </span>
            </div>
            <input
              type="checkbox"
              checked={includeProfile}
              onChange={(e) => setIncludeProfile(e.target.checked)}
              className="w-5 h-5 accent-teal-600 cursor-pointer rounded"
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Export Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              
              {/* PDF / Print */}
              <button
                type="button"
                onClick={() => setActiveFormat('pdf')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  activeFormat === 'pdf'
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Printer size={22} className={activeFormat === 'pdf' ? 'text-teal-600' : 'text-slate-400'} />
                <span className="text-xs font-bold">PDF / Print</span>
                <span className="text-[10px] text-slate-400">Formatted Document</span>
              </button>

              {/* Text File */}
              <button
                type="button"
                onClick={() => setActiveFormat('txt')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  activeFormat === 'txt'
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText size={22} className={activeFormat === 'txt' ? 'text-teal-600' : 'text-slate-400'} />
                <span className="text-xs font-bold">Plain Text (.txt)</span>
                <span className="text-[10px] text-slate-400">Clean Transcript</span>
              </button>

              {/* Markdown */}
              <button
                type="button"
                onClick={() => setActiveFormat('md')}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  activeFormat === 'md'
                    ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileCode size={22} className={activeFormat === 'md' ? 'text-teal-600' : 'text-slate-400'} />
                <span className="text-xs font-bold">Markdown (.md)</span>
                <span className="text-[10px] text-slate-400">Formatted Text</span>
              </button>
            </div>
          </div>

          {/* Quick Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Eye size={14} /> Report Content Preview
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" /> Copied!
                  </>
                ) : (
                  'Copy Text'
                )}
              </button>
            </div>
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs font-mono max-h-36 overflow-y-auto leading-relaxed border border-slate-800 whitespace-pre-wrap select-all">
              {previewText}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
            >
              {activeFormat === 'pdf' ? <Printer size={18} /> : <Download size={18} />}
              {activeFormat === 'pdf' ? 'Print / Export to PDF' : 'Download Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
