import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileJson,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  Copy,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  Calendar,
  Bell,
  Pill,
  ClipboardList,
} from 'lucide-react';
import {
  Reminder,
  Appointment,
  Medication,
  DoseLog,
  Alarm,
  EmergencyContact,
  CallAnalysisRecord,
  VoiceMacro,
  BackupDataBundle,
} from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface DataBackupModalProps {
  reminders: Reminder[];
  appointments: Appointment[];
  medications: Medication[];
  doseLogs: DoseLog[];
  alarms: Alarm[];
  emergencyContact: EmergencyContact;
  callHistory: CallAnalysisRecord[];
  onRestoreData: (backup: BackupDataBundle, mode: 'merge' | 'replace') => void;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  reminders,
  appointments,
  medications,
  doseLogs,
  alarms,
  emergencyContact,
  callHistory,
  onRestoreData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupDataBundle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate current backup bundle
  const generateBackupBundle = (): BackupDataBundle => {
    let storedMacros: VoiceMacro[] = [];
    let storedStepData: any = null;
    try {
      const macrosRaw = localStorage.getItem('assistai_voice_macros_v1');
      if (macrosRaw) storedMacros = JSON.parse(macrosRaw);
      const stepRaw = localStorage.getItem('assistai_step_tracker_v1');
      if (stepRaw) storedStepData = JSON.parse(stepRaw);
    } catch {}

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      app: 'AssistAI Senior & Blind Care',
      reminders,
      appointments,
      medications,
      doseLogs,
      alarms,
      emergencyContact,
      callHistory,
      macros: storedMacros,
      stepData: storedStepData,
    };
  };

  // Handle Export / Download JSON
  const handleExportDownload = () => {
    sound.playSuccess();
    const bundle = generateBackupBundle();
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateFormatted = now.toISOString().split('T')[0];
    const timeFormatted = `${now.getHours()}-${now.getMinutes()}`;
    const filename = `assistai-backup-${dateFormatted}-${timeFormatted}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    speech.speakText(
      `Backup successfully created and saved as ${filename}. Your reminders, appointments, and medication logs are safely stored.`
    );
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    sound.playTap();
    const bundle = generateBackupBundle();
    const jsonStr = JSON.stringify(bundle, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      speech.speakText('Backup data copied to clipboard.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
    }
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playTap();
    setImportError(null);
    setImportStatus('Reading backup file...');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed: BackupDataBundle = JSON.parse(text);

        // Validation
        if (!parsed || (!parsed.reminders && !parsed.medications && !parsed.appointments)) {
          throw new Error('File does not appear to be a valid AssistAI backup bundle.');
        }

        setPendingBackup(parsed);
        setImportStatus(`File "${file.name}" verified successfully.`);
        sound.playSuccess();
        speech.speakText(
          `Backup file verified. It contains ${(parsed.medications || []).length} medications, ${(parsed.reminders || []).length} reminders, and ${(parsed.appointments || []).length} appointments.`
        );
      } catch (err: any) {
        sound.playAlarmBeep();
        setImportError(err.message || 'Invalid JSON file. Please select a valid AssistAI backup.');
        setImportStatus(null);
        setPendingBackup(null);
      }
    };
    reader.onerror = () => {
      sound.playAlarmBeep();
      setImportError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  // Execute Restoration
  const handleExecuteRestore = (mode: 'merge' | 'replace') => {
    if (!pendingBackup) return;
    sound.playSuccess();
    onRestoreData(pendingBackup, mode);
    speech.speakText(
      `Backup restoration complete. All your reminders, appointments, and medications have been restored.`
    );
    onClose();
  };

  const handleReadSummaryAloud = () => {
    sound.playTap();
    const bundle = generateBackupBundle();
    let text = `Current Data Backup Status: `;
    text += `You have ${bundle.medications.length} active medications, `;
    text += `${bundle.reminders.length} scheduled reminders, `;
    text += `${bundle.appointments.length} appointments, `;
    text += `${bundle.doseLogs.length} logged medication doses, and `;
    text += `${(bundle.alarms || []).length} alarms. `;
    text += `Tap Export Backup to download this file to transfer to another device.`;
    speech.speakText(text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 md:p-6 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg font-black flex-shrink-0">
              <Database className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-md font-bold">
                  Device Migration & Safety
                </span>
                <span className="text-xs text-slate-400 font-bold">JSON Format</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-0.5">
                Data Backup & Restore
              </h3>
              <p className="text-slate-300 text-sm md:text-base font-medium">
                Prevent data loss and easily transfer records to a new phone or tablet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReadSummaryAloud}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700"
              aria-label="Read backup statistics aloud"
              title="Read statistics aloud"
            >
              <Volume2 className="w-6 h-6 stroke-[2.5]" />
            </button>
            <button
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-white rounded-xl"
              aria-label="Close backup modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Segmented Mode Selector: Export vs Import */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 border-2 border-slate-800 rounded-2xl">
          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('export');
            }}
            className={`py-3 px-4 rounded-xl font-black text-base md:text-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'export'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setActiveTab('import');
            }}
            className={`py-3 px-4 rounded-xl font-black text-base md:text-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'import'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Upload className="w-5 h-5 stroke-[2.5]" />
            <span>Import / Restore</span>
          </button>
        </div>

        {/* ================= TAB 1: EXPORT DATA ================= */}
        {activeTab === 'export' && (
          <div className="space-y-5">
            {/* Live Count Statistics of Export Bundle */}
            <div className="p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block">
                Items Included in this Backup:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700/80">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5" /> Meds
                  </span>
                  <span className="text-2xl font-black text-white font-mono">{medications.length}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700/80">
                  <span className="text-xs text-sky-400 font-bold flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" /> Reminders
                  </span>
                  <span className="text-2xl font-black text-white font-mono">{reminders.length}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700/80">
                  <span className="text-xs text-purple-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Events
                  </span>
                  <span className="text-2xl font-black text-white font-mono">{appointments.length}</span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700/80">
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" /> Dose Logs
                  </span>
                  <span className="text-2xl font-black text-white font-mono">{doseLogs.length}</span>
                </div>
              </div>

              <p className="text-slate-400 text-xs mt-1">
                Also includes alarms ({alarms.length}), emergency contact ({emergencyContact.name}), recorded call summaries, and voice routines.
              </p>
            </div>

            {/* Action Buttons: Big Download File & Copy Clipboard */}
            <div className="space-y-3">
              <button
                onClick={handleExportDownload}
                className="w-full py-5 px-6 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-2xl border-3 border-amber-300 text-xl md:text-2xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
                aria-label="Download backup JSON file"
              >
                <Download className="w-8 h-8 stroke-[3]" />
                <span>Download Backup JSON File</span>
              </button>

              <button
                onClick={handleCopyJson}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 text-base flex items-center justify-center gap-2"
                aria-label="Copy backup data to clipboard"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy JSON Payload to Clipboard'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: IMPORT / RESTORE DATA ================= */}
        {activeTab === 'import' && (
          <div className="space-y-5">
            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 md:p-8 bg-slate-950/80 hover:bg-slate-950 border-3 border-dashed border-amber-400/70 hover:border-amber-400 rounded-3xl text-center cursor-pointer space-y-3 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/50 flex items-center justify-center mx-auto shadow-inner">
                <FileJson className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xl md:text-2xl font-black text-white">
                  Tap to Select Backup File (.json)
                </h4>
                <p className="text-slate-300 text-sm md:text-base mt-1">
                  Upload an assistai-backup JSON file downloaded from another device
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Error Message if parsing failed */}
            {importError && (
              <div className="p-4 bg-red-950/80 border-2 border-red-500 rounded-2xl flex items-center gap-3 text-red-200">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <span className="font-bold text-sm md:text-base">{importError}</span>
              </div>
            )}

            {/* Verified Backup Preview */}
            {pendingBackup && (
              <div className="p-5 bg-emerald-950/70 border-3 border-emerald-400 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center gap-2.5 text-emerald-300">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-black text-white">Valid Backup Verified!</h4>
                    <span className="text-xs text-emerald-300">
                      Exported on {new Date(pendingBackup.exportedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm font-bold text-slate-200">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    💊 {(pendingBackup.medications || []).length} Meds
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    ⏰ {(pendingBackup.reminders || []).length} Reminders
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    📅 {(pendingBackup.appointments || []).length} Events
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    📋 {(pendingBackup.doseLogs || []).length} Dose Logs
                  </div>
                </div>

                {/* Restoration Execution Buttons */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs uppercase font-black text-emerald-300 block">
                    Choose Restoration Method:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleExecuteRestore('merge')}
                      className="py-4 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-xl border-2 border-emerald-300 text-lg flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                    >
                      <Sparkles className="w-5 h-5 stroke-[2.5]" />
                      <span>Merge with Current</span>
                    </button>

                    <button
                      onClick={() => handleExecuteRestore('replace')}
                      className="py-4 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-xl border-2 border-amber-300 text-lg flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                    >
                      <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                      <span>Replace & Clean Restore</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Backups are stored 100% offline and locally on your device for complete privacy.</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
