import React, { useState } from 'react';
import {
  Pill,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Volume2,
  Calendar,
  AlertCircle,
  Sparkles,
  History,
  RotateCcw,
  Check,
  X,
  Droplet,
  HeartPulse,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Medication, DoseLog, EmergencyContact } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface MedicationsScreenProps {
  medications: Medication[];
  doseLogs: DoseLog[];
  onAddMedication: (med: Omit<Medication, 'id'>) => void;
  onDeleteMedication: (id: string) => void;
  onLogDose: (log: Omit<DoseLog, 'id' | 'recordedAt'>) => void;
  onUndoDoseLog: (logId: string) => void;
  onUpdateMedication?: (med: Medication) => void;
  caregiverContact?: EmergencyContact;
}

export const MedicationsScreen: React.FC<MedicationsScreenProps> = ({
  medications,
  doseLogs,
  onAddMedication,
  onDeleteMedication,
  onLogDose,
  onUndoDoseLog,
  onUpdateMedication,
  caregiverContact,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'list' | 'history'>('today');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'taken' | 'missed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Medication Form
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('10 mg');
  const [instructions, setInstructions] = useState('Take with breakfast and a full glass of water.');
  const [timesStr, setTimesStr] = useState('09:00 AM');
  const [frequency, setFrequency] = useState<Medication['frequency']>('daily');
  const [pillColor, setPillColor] = useState('blue');
  const [pillForm, setPillForm] = useState<Medication['pillForm']>('tablet');
  const [refillRemaining, setRefillRemaining] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(5);
  const [prescribingDoctor, setPrescribingDoctor] = useState('Dr. Sarah Adams');

  const todayIso = new Date().toISOString().split('T')[0];

  // Calculate low supply medications based on refill threshold
  const lowSupplyMeds = medications.filter((m) => {
    const threshold = m.refillThreshold || 5;
    return m.active && m.refillRemaining <= threshold;
  });

  // Helper to determine if a dose has been logged today
  const getTodayLogForDose = (medId: string, time: string) => {
    return doseLogs.find(
      (log) =>
        log.medicationId === medId &&
        log.scheduledTime === time &&
        log.scheduledDate === todayIso
    );
  };

  // Preset senior medications for quick 1-tap entry
  const popularPresets = [
    { name: 'Lisinopril', dosage: '10 mg', instructions: 'Take 1 tablet every morning with water for blood pressure.' },
    { name: 'Metformin', dosage: '500 mg', instructions: 'Take with morning and evening meals for blood sugar control.' },
    { name: 'Amlodipine', dosage: '5 mg', instructions: 'Take once daily in the morning with or without food.' },
    { name: 'Atorvastatin', dosage: '20 mg', instructions: 'Take once daily at bedtime for cholesterol.' },
    { name: 'Baby Aspirin', dosage: '81 mg', instructions: 'Take once daily with dinner for cardiovascular health.' },
    { name: 'Levothyroxine', dosage: '50 mcg', instructions: 'Take first thing in the morning on an empty stomach with water.' },
  ];

  const handlePresetSelect = (preset: (typeof popularPresets)[0]) => {
    setName(preset.name);
    setDosage(preset.dosage);
    setInstructions(preset.instructions);
  };

  const handleTakeDose = (med: Medication, scheduledTime: string) => {
    sound.playSuccess();
    onLogDose({
      medicationId: med.id,
      medicationName: med.name,
      dosage: med.dosage,
      scheduledTime,
      scheduledDate: todayIso,
      status: 'taken',
      notes: 'Taken as scheduled',
    });

    // Automatically decrement remaining dose count
    if (onUpdateMedication && med.refillRemaining > 0) {
      onUpdateMedication({
        ...med,
        refillRemaining: med.refillRemaining - 1,
      });
    }

    speech.speakText(`Recorded ${med.name}, ${med.dosage}, as taken! Great job staying on track.`);
  };

  const handleQuickRefill = (med: Medication, refillCount = 30) => {
    sound.playSuccess();
    if (onUpdateMedication) {
      onUpdateMedication({
        ...med,
        refillRemaining: med.refillRemaining + refillCount,
        totalPills: Math.max(med.totalPills || 30, med.refillRemaining + refillCount),
      });
    }
    speech.speakText(`Added ${refillCount} pills to ${med.name}. Refill recorded.`);
  };

  const handleTextCaregiverRefill = (med: Medication) => {
    sound.playTap();
    const contactName = caregiverContact?.name || 'Emily Jenkins';
    const phone = caregiverContact?.phoneNumber || '555-234-5678';
    const dosesPerDay = Math.max(1, med.times.length);
    const daysLeft = Math.floor(med.refillRemaining / dosesPerDay);
    const doctor = med.prescribingDoctor || 'Doctor';

    const body = `Hi ${contactName}, this is a proactive Smart Refill alert: Dad's prescription for ${med.name} (${med.dosage}) is running low! Only ${med.refillRemaining} doses remain (about ${daysLeft} days of supply). Please contact ${doctor} or the pharmacy to order a refill.`;

    speech.speakText(`Opening messaging app to notify ${contactName} about the ${med.name} refill.`);
    const rawPhone = phone.replace(/[^0-9+]/g, '');
    window.location.href = `sms:${rawPhone}?body=${encodeURIComponent(body)}`;
  };

  const handleSkipDose = (med: Medication, scheduledTime: string) => {
    sound.playTap();
    onLogDose({
      medicationId: med.id,
      medicationName: med.name,
      dosage: med.dosage,
      scheduledTime,
      scheduledDate: todayIso,
      status: 'missed',
      notes: 'Dose marked as missed/skipped',
    });
    speech.speakText(`Marked ${med.name} dose as missed or skipped.`);
  };

  const handleSpeakMedInstructions = (med: Medication) => {
    sound.playTap();
    speech.speakText(
      `Medication: ${med.name}. Dosage: ${med.dosage}. Scheduled for: ${med.times.join(
        ' and '
      )}. Instructions: ${med.instructions}. You have ${med.refillRemaining} doses remaining.`
    );
  };

  const handleSpeakTodayOverview = () => {
    sound.playTap();
    const totalDoses = medications.reduce((sum, m) => sum + m.times.length, 0);
    const takenToday = doseLogs.filter(
      (l) => l.scheduledDate === todayIso && l.status === 'taken'
    ).length;

    let text = `Here is your medication update for today. You have ${totalDoses} total doses scheduled. You have taken ${takenToday} doses so far. `;
    medications.forEach((med) => {
      med.times.forEach((t) => {
        const log = getTodayLogForDose(med.id, t);
        if (log?.status === 'taken') {
          text += `${med.name} at ${t} was taken. `;
        } else if (log?.status === 'missed') {
          text += `${med.name} at ${t} was skipped. `;
        } else {
          text += `${med.name} at ${t} is still pending. `;
        }
      });
    });

    speech.speakText(text);
  };

  const handleCreateMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.playSuccess();
    const times = timesStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onAddMedication({
      name: name.trim(),
      dosage: dosage.trim() || '1 dose',
      instructions: instructions.trim() || 'Take with water',
      times: times.length > 0 ? times : ['09:00 AM'],
      frequency,
      pillColor,
      pillForm,
      refillRemaining: Number(refillRemaining) || 30,
      totalPills: Number(refillRemaining) || 30,
      refillThreshold: Number(refillThreshold) || 5,
      prescribingDoctor: prescribingDoctor.trim() || 'Primary Care Physician',
      active: true,
    });

    speech.speakText(`Added ${name} to your daily medication schedule.`);
    setName('');
    setShowAddModal(false);
  };

  // Color helper for pill badge
  const getPillBadgeStyle = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-sky-500/20 text-sky-300 border-sky-400';
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-400';
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400';
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-400';
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-400';
      default:
        return 'bg-slate-700 text-slate-200 border-slate-500';
    }
  };

  // Filtered dose logs for History tab
  const filteredLogs = doseLogs.filter((l) => {
    if (historyFilter === 'taken') return l.status === 'taken';
    if (historyFilter === 'missed') return l.status === 'missed' || l.status === 'skipped';
    return true;
  });

  const totalLogs = doseLogs.length;
  const takenCount = doseLogs.filter((l) => l.status === 'taken').length;
  const missedCount = doseLogs.filter((l) => l.status === 'missed' || l.status === 'skipped').length;
  const adherenceRate = totalLogs > 0 ? Math.round((takenCount / totalLogs) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner with Today's Adherence & Read Aloud */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-3 border-emerald-400 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <span className="text-emerald-400 font-bold uppercase text-xs md:text-sm tracking-wide flex items-center gap-1.5 mb-1">
            <HeartPulse className="w-5 h-5 text-emerald-400" /> Accessible Senior Medication Tracker
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Daily Medication Manager
          </h2>
          <p className="text-slate-200 text-lg md:text-xl font-bold mt-1">
            Adherence: <span className="text-emerald-400 font-black">{adherenceRate}%</span> ({takenCount} taken, {missedCount} missed)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Read Overview Aloud */}
          <button
            onClick={handleSpeakTodayOverview}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-2xl border-2 border-amber-300 shadow-xl text-base md:text-lg"
            aria-label="Read today's medication schedule aloud"
          >
            <Volume2 className="w-6 h-6 stroke-[2.5]" />
            <span>Read Today's Doses</span>
          </button>

          {/* Add Medication */}
          <button
            onClick={() => {
              sound.playTap();
              setShowAddModal(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-2xl border-2 border-emerald-300 shadow-xl text-base md:text-lg"
            aria-label="Add new medication"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* ⚠️ Smart Refill Alerts Banner (Proactive Caregiver Reminders) */}
      {lowSupplyMeds.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/70 border-3 border-red-500 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-red-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500 text-slate-950 rounded-2xl font-black shadow-lg">
                <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-red-200">
                  Smart Refill Alert ({lowSupplyMeds.length} Medication Low)
                </h3>
                <p className="text-slate-200 text-base font-bold">
                  Low supply detected. Send proactive notice to caregiver or pharmacy.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const medNames = lowSupplyMeds
                  .map((m) => `${m.name} has only ${m.refillRemaining} doses left`)
                  .join('. ');
                speech.speakText(`Smart refill alert: ${medNames}. Please notify caregiver ${caregiverContact?.name || 'Emily'} for a pharmacy refill.`);
              }}
              className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2 font-bold text-base shadow-md"
              aria-label="Read smart refill alerts aloud"
            >
              <Volume2 className="w-5 h-5" />
              <span>Read Alert</span>
            </button>
          </div>

          <div className="space-y-3">
            {lowSupplyMeds.map((med) => {
              const dosesPerDay = Math.max(1, med.times.length);
              const daysLeft = Math.floor(med.refillRemaining / dosesPerDay);
              return (
                <div
                  key={med.id}
                  className="p-4 bg-slate-950/80 border-2 border-red-400/60 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl md:text-2xl font-black text-white">{med.name}</span>
                      <span className="text-amber-300 font-bold text-base">({med.dosage})</span>
                      <span className="text-xs uppercase bg-red-950 text-red-300 border border-red-500 px-2 py-0.5 rounded font-black">
                        Critical Refill
                      </span>
                    </div>
                    <p className="text-red-300 text-base font-bold">
                      ⚠️ Only <span className="underline font-black">{med.refillRemaining} doses</span> remaining (~{daysLeft} days of supply)
                    </p>
                    <p className="text-slate-400 text-sm">
                      Prescribed by {med.prescribingDoctor || 'Doctor'} • Alert threshold: {med.refillThreshold || 5} doses
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => handleTextCaregiverRefill(med)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black rounded-xl border border-red-400 text-base shadow-md transition-transform active:scale-95"
                      aria-label={`Send refill text to caregiver for ${med.name}`}
                    >
                      <Send className="w-5 h-5 stroke-[2.5]" />
                      <span>Text Caregiver Refill</span>
                    </button>

                    <button
                      onClick={() => handleQuickRefill(med, 30)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-emerald-300 font-black rounded-xl border border-emerald-500/50 text-base"
                      aria-label={`Mark ${med.name} as refilled with 30 pills`}
                    >
                      <span>+30 Doses Refilled</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Segmented Tab Navigation */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900 border-2 border-slate-800 rounded-3xl">
        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('today');
          }}
          className={`py-3.5 px-3 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'today'
              ? 'bg-emerald-400 text-slate-950 shadow-xl border-2 border-emerald-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-5 h-5 stroke-[2.5]" />
          <span>Today's Doses</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('list');
          }}
          className={`py-3.5 px-3 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'list'
              ? 'bg-sky-400 text-slate-950 shadow-xl border-2 border-sky-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Pill className="w-5 h-5 stroke-[2.5]" />
          <span>Prescriptions ({medications.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('history');
          }}
          className={`py-3.5 px-3 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'bg-amber-400 text-slate-950 shadow-xl border-2 border-amber-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-5 h-5 stroke-[2.5]" />
          <span>Dose History</span>
        </button>
      </div>

      {/* ================= TAB 1: TODAY'S DOSES ================= */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              <Clock className="w-7 h-7 text-emerald-400" />
              <span>Today's Dose Schedule</span>
            </h3>
            <span className="text-sm font-bold text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="space-y-3">
            {medications.map((med) =>
              med.times.map((time, idx) => {
                const log = getTodayLogForDose(med.id, time);
                const isTaken = log?.status === 'taken';
                const isMissed = log?.status === 'missed' || log?.status === 'skipped';

                return (
                  <div
                    key={`${med.id}-${time}-${idx}`}
                    className={`p-6 rounded-3xl border-3 transition-all shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isTaken
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-emerald-950/20'
                        : isMissed
                        ? 'bg-red-950/30 border-red-500/70'
                        : 'bg-slate-800/95 border-emerald-400/90'
                    }`}
                  >
                    {/* Left: Pill Icon & Medication Details */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black border-2 flex-shrink-0 ${getPillBadgeStyle(
                          med.pillColor
                        )}`}
                      >
                        <Pill className="w-8 h-8 stroke-[2.5]" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xl md:text-3xl font-black text-white">
                            {med.name}
                          </span>
                          <span className="px-3 py-1 bg-slate-900 text-amber-300 font-bold rounded-lg border border-slate-700 text-base">
                            {med.dosage}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-lg font-bold text-emerald-300">
                          <Clock className="w-5 h-5 text-emerald-400" />
                          <span>Scheduled Time: {time}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 text-sm">{med.refillRemaining} refills remaining</span>
                        </div>

                        <p className="text-slate-300 text-base md:text-lg font-medium leading-snug">
                          {med.instructions}
                        </p>
                      </div>
                    </div>

                    {/* Right: Big Take / Skip Buttons or Taken Status Badge */}
                    <div className="flex items-center flex-wrap gap-2.5 self-end md:self-center">
                      {isTaken ? (
                        <div className="flex items-center gap-2">
                          <div className="px-5 py-3 bg-emerald-950 border-2 border-emerald-400 rounded-2xl text-emerald-300 font-black text-lg flex items-center gap-2 shadow-md">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            <span>Taken at {log.recordedAt}</span>
                          </div>
                          <button
                            onClick={() => {
                              sound.playTap();
                              if (log) onUndoDoseLog(log.id);
                            }}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700"
                            aria-label="Undo taken dose"
                            title="Undo"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        </div>
                      ) : isMissed ? (
                        <div className="flex items-center gap-2">
                          <div className="px-5 py-3 bg-red-950 border-2 border-red-400 rounded-2xl text-red-300 font-black text-lg flex items-center gap-2">
                            <XCircle className="w-6 h-6 text-red-400" />
                            <span>Dose Skipped</span>
                          </div>
                          <button
                            onClick={() => {
                              sound.playTap();
                              if (log) onUndoDoseLog(log.id);
                            }}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700"
                            aria-label="Undo skipped dose"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Big Mark as Taken Button */}
                          <button
                            onClick={() => handleTakeDose(med, time)}
                            className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-2xl border-3 border-emerald-300 shadow-xl text-xl flex items-center gap-2.5 transition-transform active:scale-95"
                            aria-label={`Mark ${med.name} dose as taken`}
                          >
                            <Check className="w-7 h-7 stroke-[3]" />
                            <span>Take Dose</span>
                          </button>

                          {/* Skip button */}
                          <button
                            onClick={() => handleSkipDose(med, time)}
                            className="px-4 py-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-300 font-bold rounded-2xl border-2 border-slate-600 text-base"
                            aria-label={`Skip ${med.name} dose`}
                          >
                            <span>Skip</span>
                          </button>
                        </div>
                      )}

                      {/* Speak instructions button */}
                      <button
                        onClick={() => handleSpeakMedInstructions(med)}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700"
                        aria-label={`Read instructions for ${med.name} aloud`}
                        title="Read aloud"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: MY PRESCRIPTIONS ================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              <Pill className="w-7 h-7 text-sky-400" />
              <span>All Active Prescriptions</span>
            </h3>
            <button
              onClick={() => {
                sound.playTap();
                setShowAddModal(true);
              }}
              className="px-5 py-3 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black rounded-xl border-2 border-sky-300 flex items-center gap-1.5"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Add New</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => (
              <div
                key={med.id}
                className="p-6 bg-slate-800/95 border-3 border-sky-400/80 rounded-3xl shadow-xl space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border-2 ${getPillBadgeStyle(
                        med.pillColor
                      )}`}
                    >
                      <Pill className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white">{med.name}</h4>
                      <p className="text-amber-300 font-bold text-lg">{med.dosage}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeakMedInstructions(med)}
                      className="p-2.5 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-xl"
                      aria-label="Read instructions"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        sound.playTap();
                        onDeleteMedication(med.id);
                      }}
                      className="p-2.5 bg-slate-700 hover:bg-red-900/60 text-red-400 rounded-xl"
                      aria-label="Delete medication"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-700 text-slate-200 text-base">
                  <strong>Instructions:</strong> {med.instructions}
                </div>

                {/* Smart Refill Status & Supply Bar */}
                {(() => {
                  const dosesPerDay = Math.max(1, med.times.length);
                  const daysLeft = Math.floor(med.refillRemaining / dosesPerDay);
                  const threshold = med.refillThreshold || 5;
                  const isLow = med.refillRemaining <= threshold;
                  const total = med.totalPills || 30;
                  const pct = Math.min(100, Math.round((med.refillRemaining / total) * 100));

                  return (
                    <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-300">
                          📦 Supply: <span className="text-white font-black">{med.refillRemaining}</span> / {total} doses
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-black text-xs uppercase ${
                            isLow
                              ? 'bg-red-950 text-red-300 border border-red-500'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                          }`}
                        >
                          {isLow ? `Low Supply (~${daysLeft}d left)` : `Adequate (~${daysLeft}d left)`}
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isLow ? 'bg-red-500' : pct < 40 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => handleQuickRefill(med, 30)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl border border-emerald-500/40 text-xs flex items-center gap-1"
                        >
                          <span>+30 Refill</span>
                        </button>

                        <button
                          onClick={() => handleTextCaregiverRefill(med)}
                          className={`px-3 py-1.5 font-black rounded-xl text-xs flex items-center gap-1.5 transition-transform active:scale-95 ${
                            isLow
                              ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Text Caregiver</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center justify-between text-slate-400 text-xs font-bold pt-0.5">
                  <span>⏰ Times: {med.times.join(', ')}</span>
                  <span>Dr: {med.prescribingDoctor || 'Primary Care'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: DOSE HISTORY (TAKEN VS MISSED) ================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                <History className="w-7 h-7 text-amber-400" />
                <span>Medication History Log</span>
              </h3>
              <p className="text-slate-300 text-base">
                Track taken vs. missed doses for family or doctor reviews.
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-4 py-2 rounded-xl font-bold text-base border-2 ${
                  historyFilter === 'all'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                All ({doseLogs.length})
              </button>
              <button
                onClick={() => setHistoryFilter('taken')}
                className={`px-4 py-2 rounded-xl font-bold text-base border-2 ${
                  historyFilter === 'taken'
                    ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Taken ({takenCount})
              </button>
              <button
                onClick={() => setHistoryFilter('missed')}
                className={`px-4 py-2 rounded-xl font-bold text-base border-2 ${
                  historyFilter === 'missed'
                    ? 'bg-red-500 text-white border-red-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Missed ({missedCount})
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-5 rounded-2xl border-2 shadow-md flex items-center justify-between gap-3 ${
                  log.status === 'taken'
                    ? 'bg-slate-900 border-emerald-500/70'
                    : 'bg-slate-900 border-red-500/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      log.status === 'taken'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {log.status === 'taken' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white">{log.medicationName}</h4>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <span>📅 {log.scheduledDate}</span>
                      <span>•</span>
                      <span>⏰ Scheduled: {log.scheduledTime}</span>
                      {log.notes && <span>• <em>{log.notes}</em></span>}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-black uppercase px-2.5 py-1 rounded-md border ${
                      log.status === 'taken'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-red-950 text-red-300 border-red-500'
                    }`}
                  >
                    {log.status === 'taken' ? `Taken at ${log.recordedAt}` : 'Missed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD MEDICATION ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border-3 border-emerald-400 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Pill className="w-7 h-7 text-emerald-400" />
                Add New Medication
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* Quick Senior Presets */}
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1.5">
                Popular Presets (Tap to fill):
              </span>
              <div className="flex flex-wrap gap-2">
                {popularPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-lg border border-slate-600 text-xs md:text-sm"
                  >
                    {preset.name} ({preset.dosage})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateMedication} className="space-y-4">
              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Medication Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lisinopril, Metformin"
                  className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 focus:border-emerald-400 text-white rounded-xl text-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-black text-lg mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 10 mg"
                    className="w-full p-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-200 font-black text-lg mb-1">Scheduled Time(s)</label>
                  <input
                    type="text"
                    required
                    value={timesStr}
                    onChange={(e) => setTimesStr(e.target.value)}
                    placeholder="09:00 AM, 08:00 PM"
                    className="w-full p-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Instructions / Doctor Notes
                </label>
                <textarea
                  rows={2}
                  required
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take with food & full glass of water in the morning."
                  className="w-full p-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-black text-sm mb-1">Pill Color</label>
                  <select
                    value={pillColor}
                    onChange={(e) => setPillColor(e.target.value)}
                    className="w-full p-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  >
                    <option value="blue">Blue</option>
                    <option value="amber">Amber / Orange</option>
                    <option value="emerald">Green</option>
                    <option value="rose">Pink / Red</option>
                    <option value="purple">Purple</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-200 font-black text-sm mb-1">Total Pill Count</label>
                  <input
                    type="number"
                    value={refillRemaining}
                    onChange={(e) => setRefillRemaining(Number(e.target.value))}
                    className="w-full p-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-200 font-black text-sm mb-1">
                  Proactive Refill Alert Threshold (Alert caregiver when doses drop to or below)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={refillThreshold}
                    onChange={(e) => setRefillThreshold(Number(e.target.value))}
                    className="w-32 p-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  />
                  <span className="text-slate-300 text-sm font-semibold">doses remaining (recommended: 5 doses)</span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-2xl text-lg border-2 border-emerald-300 shadow-lg"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
