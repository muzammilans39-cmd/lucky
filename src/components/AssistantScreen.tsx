import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  History,
  Play,
  RotateCcw,
  Clock,
  Sun,
  Moon,
  Stethoscope,
  Footprints,
  Coffee,
  Heart,
  Plus,
  Trash2,
  Layers,
  X,
} from 'lucide-react';
import { Reminder, Appointment, Alarm, CallAnalysisRecord, ChatMessage, VoiceMacro } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

export interface VoiceCommandRecord {
  id: string;
  commandText: string;
  timestamp: string;
  spokenResponse?: string;
  actionTaken?: string;
}

export const INITIAL_MACROS: VoiceMacro[] = [
  {
    id: 'macro-morning',
    title: 'Good Morning Routine',
    description: 'Check weather, schedule, reminders & morning medicine in one tap',
    icon: 'sun',
    steps: [
      'What appointments do I have today?',
      'Read my reminders',
    ],
  },
  {
    id: 'macro-bedtime',
    title: 'Bedtime Check',
    description: 'Confirm alarms are set and review tomorrow morning schedule',
    icon: 'moon',
    steps: [
      'Check if all my alarms are set for tomorrow',
      'What appointments do I have today?',
    ],
  },
  {
    id: 'macro-doctor',
    title: 'Doctor Visit Prep',
    description: 'Summarize last doctor phone call and reminders before visit',
    icon: 'stethoscope',
    steps: [
      'Summarize my last recording',
      'Read my reminders',
    ],
  },
  {
    id: 'macro-walk',
    title: 'Out for a Walk Check',
    description: 'Quick check of upcoming schedule before leaving home',
    icon: 'footprints',
    steps: [
      'What appointments do I have today?',
      'Read my reminders',
    ],
  },
];

const INITIAL_VOICE_HISTORY: VoiceCommandRecord[] = [
  {
    id: 'vh-1',
    commandText: 'What appointments do I have today?',
    timestamp: '10:15 AM',
    spokenResponse: 'You have no appointments today. Your next appointment is Dr. Adams Cardiology tomorrow at 10:00 AM.',
    actionTaken: 'Checked Calendar',
  },
  {
    id: 'vh-2',
    commandText: 'Read my reminders',
    timestamp: '09:30 AM',
    spokenResponse: 'You have 2 pending reminders: Medicine reminder at 9:00 AM, and Call daughter Emily at 7:00 PM.',
    actionTaken: 'Spoke Reminders',
  },
  {
    id: 'vh-3',
    commandText: 'Set a reminder for tomorrow at 10 AM',
    timestamp: 'Yesterday',
    spokenResponse: 'I have added your reminder for tomorrow at 10:00 AM.',
    actionTaken: 'Created Reminder',
  },
  {
    id: 'vh-4',
    commandText: 'Summarize my last recording',
    timestamp: 'Yesterday',
    spokenResponse: 'Your last phone call was with Dr. Adams office confirming your clinic appointment for tomorrow morning.',
    actionTaken: 'Read Call Summary',
  },
  {
    id: 'vh-5',
    commandText: 'Set an alarm for 7:30 AM',
    timestamp: 'Yesterday',
    spokenResponse: 'I have set your alarm for 7:30 AM.',
    actionTaken: 'Set Alarm',
  },
];

interface AssistantScreenProps {
  reminders: Reminder[];
  appointments: Appointment[];
  alarms: Alarm[];
  callHistory: CallAnalysisRecord[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onAddAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  onNavigateTab: (tab: any) => void;
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  reminders,
  appointments,
  alarms,
  callHistory,
  onAddReminder,
  onAddAppointment,
  onAddAlarm,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Hello! I am your AssistAI voice assistant. Tap the large microphone button and speak, or tap any of the sample questions below.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [micStatusText, setMicStatusText] = useState('Tap Microphone to Speak');
  const [voiceHistory, setVoiceHistory] = useState<VoiceCommandRecord[]>(() => {
    try {
      const stored = localStorage.getItem('assistai_voice_history_v1');
      return stored ? JSON.parse(stored) : INITIAL_VOICE_HISTORY;
    } catch {
      return INITIAL_VOICE_HISTORY;
    }
  });

  // Frequently used Voice Command Macros
  const [macros, setMacros] = useState<VoiceMacro[]>(() => {
    try {
      const stored = localStorage.getItem('assistai_voice_macros_v1');
      return stored ? JSON.parse(stored) : INITIAL_MACROS;
    } catch {
      return INITIAL_MACROS;
    }
  });

  const [runningMacro, setRunningMacro] = useState<{
    title: string;
    stepIndex: number;
    totalSteps: number;
    currentCommand: string;
  } | null>(null);

  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macroTitle, setMacroTitle] = useState('');
  const [macroDesc, setMacroDesc] = useState('');
  const [macroIcon, setMacroIcon] = useState('sun');
  const [macroSteps, setMacroSteps] = useState<string[]>([
    'What appointments do I have today?',
    'Read my reminders',
  ]);
  const [newStepInput, setNewStepInput] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Read the newest assistant response aloud automatically
  const handleAssistantSpeak = (text: string) => {
    speech.speakText(text);
  };

  const handleToggleMic = () => {
    if (isListening) {
      sound.playMicStop();
      speech.stopListening();
      setIsListening(false);
      setMicStatusText('Processing your voice...');
    } else {
      sound.playMicStart();
      setIsListening(true);
      setMicStatusText('Listening... please speak clearly');

      speech.startListening({
        onStart: () => {
          setIsListening(true);
        },
        onResult: (transcript) => {
          setIsListening(false);
          setMicStatusText('Voice captured: ' + transcript);
          handleProcessCommand(transcript);
        },
        onError: (err) => {
          setIsListening(false);
          setMicStatusText(err || 'Could not hear voice');
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    }
  };

  const handleProcessCommand = async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    sound.playTap();
    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const recentCall = callHistory[0];
      const context = {
        currentDateTime: new Date().toString(),
        reminders: reminders.map((r) => ({ title: r.title, date: r.date, time: r.time, completed: r.completed })),
        appointments: appointments.map((a) => ({ title: a.title, date: a.date, time: a.time, location: a.location })),
        alarms: alarms.map((a) => ({ time: a.time, label: a.label, enabled: a.enabled })),
        recentCallSummary: recentCall ? `${recentCall.title}: ${recentCall.summary}` : undefined,
      };

      const res = await fetch('/api/gemini/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, context }),
      });

      if (!res.ok) {
        throw new Error('Failed to process request with AI');
      }

      const data = await res.json();
      const spokenResponse = data.spokenResponse || "I understood your request.";
      let actionTaken = '';

      // Execute requested action if returned by Gemini
      if (data.actionType === 'CREATE_REMINDER' && data.actionPayload?.title) {
        const date = data.actionPayload.date || new Date().toISOString().split('T')[0];
        const time = data.actionPayload.time || '10:00 AM';
        onAddReminder({
          title: data.actionPayload.title,
          date,
          time,
          completed: false,
          recurrence: 'none',
          priority: 'normal',
        });
        sound.playSuccess();
        actionTaken = `✅ Added Reminder: "${data.actionPayload.title}" for ${time}`;
      } else if (data.actionType === 'CREATE_APPOINTMENT' && data.actionPayload?.title) {
        const date = data.actionPayload.date || new Date().toISOString().split('T')[0];
        const time = data.actionPayload.time || '11:00 AM';
        onAddAppointment({
          title: data.actionPayload.title,
          date,
          time,
          location: data.actionPayload.location || 'Local Clinic / Office',
          notes: data.actionPayload.notes || 'Created via voice assistant',
          category: 'Meeting',
        });
        sound.playSuccess();
        actionTaken = `✅ Added Appointment: "${data.actionPayload.title}" on ${date} at ${time}`;
      } else if (data.actionType === 'CREATE_ALARM' && data.actionPayload?.time) {
        onAddAlarm({
          time: data.actionPayload.time,
          label: data.actionPayload.title || 'Voice Alarm',
          days: data.actionPayload.days || ['Daily'],
          enabled: true,
        });
        sound.playSuccess();
        actionTaken = `✅ Set Alarm for ${data.actionPayload.time}`;
      }

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: spokenResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTaken,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Record in Voice Command History (Keep last 5)
      const newHistoryItem: VoiceCommandRecord = {
        id: 'vh-' + Date.now(),
        commandText: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        spokenResponse,
        actionTaken: actionTaken || 'Spoken Answer',
      };
      setVoiceHistory((prev) => {
        const updated = [newHistoryItem, ...prev.filter((item) => item.commandText !== userText)].slice(0, 5);
        try {
          localStorage.setItem('assistai_voice_history_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Speak the response aloud for accessibility!
      handleAssistantSpeak(spokenResponse);
    } catch (err: any) {
      console.error('Voice assistant error:', err);
      // Gentle offline/fallback response
      const fallbackResponse = `I received your message: "${userText}". How else can I assist you with your schedule or reminders?`;
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          sender: 'assistant',
          text: fallbackResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      const errHistoryItem: VoiceCommandRecord = {
        id: 'vh-' + Date.now(),
        commandText: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        spokenResponse: fallbackResponse,
        actionTaken: 'Assisted',
      };
      setVoiceHistory((prev) => {
        const updated = [errHistoryItem, ...prev.filter((item) => item.commandText !== userText)].slice(0, 5);
        try {
          localStorage.setItem('assistai_voice_history_v1', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      handleAssistantSpeak(fallbackResponse);
    } finally {
      setIsProcessing(false);
      setMicStatusText('Tap Microphone to Speak');
    }
  };

  const sampleCommands = [
    'Set a reminder for tomorrow at 10 AM',
    'What appointments do I have today?',
    'Read my reminders',
    'Create a meeting for Monday at 3 PM',
    'Summarize my last recording',
    'Set an alarm for 7:30 AM',
  ];

  const handleRunMacro = async (macro: VoiceMacro) => {
    if (isProcessing) return;
    sound.playSuccess();
    speech.speakText(`Starting ${macro.title}. Executing ${macro.steps.length} actions.`);

    for (let i = 0; i < macro.steps.length; i++) {
      const stepCommand = macro.steps[i];
      setRunningMacro({
        title: macro.title,
        stepIndex: i + 1,
        totalSteps: macro.steps.length,
        currentCommand: stepCommand,
      });

      await handleProcessCommand(stepCommand);

      // Brief gentle pause between steps
      if (i < macro.steps.length - 1) {
        await new Promise((r) => setTimeout(r, 1600));
      }
    }

    setRunningMacro(null);
    speech.speakText(`${macro.title} complete! All ${macro.steps.length} actions finished.`);
  };

  const handleSaveMacro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!macroTitle.trim() || macroSteps.length === 0) return;
    sound.playSuccess();
    const newMacro: VoiceMacro = {
      id: 'macro-' + Date.now(),
      title: macroTitle.trim(),
      description: macroDesc.trim() || `${macroSteps.length}-action voice routine`,
      icon: macroIcon,
      steps: [...macroSteps],
      isCustom: true,
    };
    const updated = [newMacro, ...macros];
    setMacros(updated);
    try {
      localStorage.setItem('assistai_voice_macros_v1', JSON.stringify(updated));
    } catch {}
    speech.speakText(`Saved ${newMacro.title} routine.`);
    setShowMacroModal(false);
    setMacroTitle('');
    setMacroDesc('');
  };

  const handleDeleteMacro = (id: string) => {
    sound.playTap();
    const updated = macros.filter((m) => m.id !== id);
    setMacros(updated);
    try {
      localStorage.setItem('assistai_voice_macros_v1', JSON.stringify(updated));
    } catch {}
  };

  const getMacroIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="w-6 h-6 text-amber-400 stroke-[2.5]" />;
      case 'moon':
        return <Moon className="w-6 h-6 text-indigo-300 stroke-[2.5]" />;
      case 'stethoscope':
        return <Stethoscope className="w-6 h-6 text-emerald-400 stroke-[2.5]" />;
      case 'footprints':
        return <Footprints className="w-6 h-6 text-teal-400 stroke-[2.5]" />;
      case 'coffee':
        return <Coffee className="w-6 h-6 text-amber-300 stroke-[2.5]" />;
      default:
        return <Heart className="w-6 h-6 text-rose-400 stroke-[2.5]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card with giant tactile mic */}
      <div className="bg-slate-800/90 border-3 border-amber-400 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center justify-center gap-2">
          <Sparkles className="w-7 h-7 text-amber-400" />
          AssistAI Voice Assistant
        </h2>
        <p className="text-slate-300 text-lg md:text-xl mt-1 max-w-lg">
          Ask anything about your reminders, calendar, alarms, or recent phone calls.
        </p>

        {/* Giant Tactile Microphone Button */}
        <div className="my-6">
          <button
            onClick={handleToggleMic}
            className={`w-28 h-28 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center border-6 transition-all shadow-2xl active:scale-95 ${
              isListening
                ? 'bg-red-500 border-red-300 text-white mic-active-pulse'
                : 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
          >
            {isListening ? (
              <MicOff className="w-14 h-14 stroke-[2.5]" />
            ) : (
              <Mic className="w-14 h-14 stroke-[2.5]" />
            )}
            <span className="text-xs font-black uppercase mt-1 tracking-wider">
              {isListening ? 'Listening' : 'Tap to Speak'}
            </span>
          </button>
        </div>

        {/* Visual status label with high contrast badge */}
        <div
          className={`px-5 py-2.5 rounded-full font-bold text-base md:text-lg border-2 ${
            isListening
              ? 'bg-red-950/80 text-red-300 border-red-500 animate-pulse'
              : isProcessing
              ? 'bg-amber-950/80 text-amber-300 border-amber-500'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
          aria-live="polite"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Thinking with Gemini AI...
            </span>
          ) : (
            micStatusText
          )}
        </div>
      </div>

      {/* Suggested Quick Commands - Big tap targets */}
      <div>
        <h3 className="text-xl md:text-2xl font-black text-slate-200 mb-3 flex items-center justify-between">
          <span>Try Saying:</span>
          <span className="text-sm font-normal text-slate-400">(Tap any question to ask immediately)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {sampleCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleProcessCommand(cmd)}
              className="text-left px-4 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-200 border-2 border-slate-700 hover:border-amber-400 rounded-2xl font-bold text-base md:text-lg transition-all shadow-sm flex items-center gap-2"
              aria-label={`Ask: ${cmd}`}
            >
              <span className="text-amber-400 font-mono text-sm">💬</span>
              <span>"{cmd}"</span>
            </button>
          ))}
        </div>
      </div>

      {/* ⚡ Multi-Step Voice Command Macros & Routines */}
      <div className="bg-slate-800/95 border-3 border-amber-400/90 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl font-black shadow-md">
              <Layers className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">
                Multi-Step Voice Routines & Macros
              </h3>
              <p className="text-amber-300 font-bold text-sm md:text-base">
                Execute morning routines, bedtime checks, or prep workflows in 1 tap
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              setShowMacroModal(true);
            }}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-xl border border-amber-300 text-base flex items-center gap-1.5 shadow-md self-end sm:self-center"
            aria-label="Create new multi-step voice routine macro"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Create Routine</span>
          </button>
        </div>

        {/* Live Running Routine Banner */}
        {runningMacro && (
          <div className="p-4 bg-amber-500/20 border-2 border-amber-400 rounded-2xl flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin flex-shrink-0" />
            <div>
              <h4 className="text-lg font-black text-amber-300">
                Running {runningMacro.title} (Step {runningMacro.stepIndex} of {runningMacro.totalSteps})
              </h4>
              <p className="text-white text-base font-bold">
                "{runningMacro.currentCommand}"
              </p>
            </div>
          </div>
        )}

        {/* Macro Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {macros.map((macro) => (
            <div
              key={macro.id}
              className="p-4 bg-slate-900/90 border-2 border-slate-700 hover:border-amber-400 rounded-2xl shadow-md space-y-3 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-800 text-amber-400 rounded-xl border border-slate-700">
                      {getMacroIcon(macro.icon)}
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-white">
                        {macro.title}
                      </h4>
                      <p className="text-slate-300 text-xs md:text-sm font-medium">
                        {macro.description}
                      </p>
                    </div>
                  </div>

                  {macro.isCustom && (
                    <button
                      onClick={() => handleDeleteMacro(macro.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg"
                      aria-label={`Delete routine ${macro.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Steps List */}
                <div className="space-y-1 pt-1">
                  <span className="text-xs uppercase font-bold text-slate-400">
                    Runs {macro.steps.length} Actions in Order:
                  </span>
                  <div className="space-y-1">
                    {macro.steps.map((st, i) => (
                      <div
                        key={i}
                        className="text-xs md:text-sm text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5"
                      >
                        <span className="text-amber-400 font-bold font-mono">{i + 1}.</span>
                        <span className="truncate">"{st}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Run Routine Button */}
              <button
                onClick={() => handleRunMacro(macro)}
                disabled={isProcessing}
                className="w-full mt-2 py-3 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl border border-amber-300 shadow-md text-base md:text-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                aria-label={`Run ${macro.title} routine with 1 tap`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Run Routine ({macro.steps.length} Steps)</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 📜 Voice History: Last 5 Processed Commands */}
      <div className="bg-slate-800/90 border-2 border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
              <History className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white">
                Voice History (Last 5 Commands)
              </h3>
              <p className="text-slate-300 text-sm md:text-base">
                Review recent queries or tap "Run Again" to re-execute instantly.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {voiceHistory.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-900/90 border-2 border-slate-700 hover:border-amber-400 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg md:text-xl font-black text-white">
                    "{item.commandText}"
                  </span>
                  {item.actionTaken && (
                    <span className="text-xs uppercase bg-emerald-950 text-emerald-300 border border-emerald-500 px-2.5 py-0.5 rounded-md font-bold">
                      {item.actionTaken}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{item.timestamp}</span>
                  {item.spokenResponse && (
                    <span className="text-slate-300 truncate max-w-xs md:max-w-md">
                      • {item.spokenResponse}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons: Re-run & Hear response */}
              <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                <button
                  onClick={() => {
                    sound.playTap();
                    handleProcessCommand(item.commandText);
                  }}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-xl border border-amber-300 text-sm md:text-base shadow-sm disabled:opacity-50"
                  aria-label={`Run command again: ${item.commandText}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Again</span>
                </button>

                {item.spokenResponse && (
                  <button
                    onClick={() => {
                      sound.playTap();
                      handleAssistantSpeak(item.spokenResponse!);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-300 rounded-xl border border-slate-700"
                    aria-label={`Hear response for: ${item.commandText}`}
                    title="Hear response aloud"
                  >
                    <Volume2 className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Conversation Stream */}
      <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 max-h-[460px] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[90%] md:max-w-[80%] rounded-3xl p-5 shadow-md border-2 ${
                msg.sender === 'user'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                  : 'bg-slate-800 text-slate-100 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1 text-xs font-semibold uppercase opacity-80">
                <span>{msg.sender === 'user' ? 'You Spoke' : 'AssistAI'}</span>
                <span>{msg.timestamp}</span>
              </div>

              <p className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </p>

              {/* Action confirmation badge */}
              {msg.actionTaken && (
                <div className="mt-3 p-3 bg-emerald-950/80 border-2 border-emerald-400 rounded-xl text-emerald-300 font-bold flex items-center gap-2 text-base">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{msg.actionTaken}</span>
                </div>
              )}

              {/* Read Aloud button on assistant messages */}
              {msg.sender === 'assistant' && (
                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-end">
                  <button
                    onClick={() => {
                      sound.playTap();
                      handleAssistantSpeak(msg.text);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-amber-300 rounded-xl text-sm font-bold border border-slate-600"
                    aria-label="Replay this answer aloud"
                  >
                    <Volume2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Speak Again</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Alternative Text Input with large submit button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleProcessCommand(inputText);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Or type your command or question here..."
          className="flex-1 px-5 py-4 bg-slate-800 border-2 border-slate-700 focus:border-amber-400 text-white rounded-2xl text-lg font-medium outline-none shadow-inner placeholder:text-slate-500"
          aria-label="Type your command or question"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="px-6 py-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-40 text-slate-950 font-black rounded-2xl border-2 border-amber-300 shadow-md text-lg flex items-center gap-2"
          aria-label="Send message"
        >
          <Send className="w-6 h-6 stroke-[2.5]" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>

      {/* Modal: Create Custom Multi-Step Routine */}
      {showMacroModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black">
                  <Layers className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Create Voice Routine</h3>
                  <p className="text-amber-300 font-bold text-sm">
                    Sequence multiple actions into a 1-tap macro
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMacroModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveMacro} className="space-y-4">
              <div>
                <label className="block text-slate-200 font-black text-base mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  required
                  value={macroTitle}
                  onChange={(e) => setMacroTitle(e.target.value)}
                  placeholder="e.g. Afternoon Check, Sunday Prep"
                  className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-xl font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-black text-base mb-1">
                  Brief Description
                </label>
                <input
                  type="text"
                  value={macroDesc}
                  onChange={(e) => setMacroDesc(e.target.value)}
                  placeholder="e.g. Check evening reminders and upcoming visits"
                  className="w-full p-3 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-sm"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-slate-200 font-black text-sm mb-1.5">
                  Routine Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: 'sun', icon: <Sun className="w-5 h-5 text-amber-400" /> },
                    { id: 'moon', icon: <Moon className="w-5 h-5 text-indigo-300" /> },
                    { id: 'stethoscope', icon: <Stethoscope className="w-5 h-5 text-emerald-400" /> },
                    { id: 'footprints', icon: <Footprints className="w-5 h-5 text-teal-400" /> },
                    { id: 'coffee', icon: <Coffee className="w-5 h-5 text-amber-300" /> },
                    { id: 'heart', icon: <Heart className="w-5 h-5 text-rose-400" /> },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setMacroIcon(ic.id)}
                      className={`p-3 rounded-xl border-2 flex items-center justify-center ${
                        macroIcon === ic.id
                          ? 'bg-amber-400/20 border-amber-400 shadow-md'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      {ic.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions/Steps in Routine */}
              <div className="space-y-2">
                <label className="block text-slate-200 font-black text-sm">
                  Workflow Action Steps ({macroSteps.length} steps)
                </label>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {macroSteps.map((st, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between text-sm text-slate-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-amber-400 font-bold font-mono">{i + 1}.</span>
                        <span className="truncate">{st}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMacroSteps((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Step Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newStepInput}
                    onChange={(e) => setNewStepInput(e.target.value)}
                    placeholder="Add step (e.g. Read my reminders)"
                    className="flex-1 p-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newStepInput.trim()) return;
                      setMacroSteps((prev) => [...prev, newStepInput.trim()]);
                      setNewStepInput('');
                    }}
                    className="px-4 py-2 bg-amber-400 text-slate-950 font-black rounded-xl text-sm"
                  >
                    Add
                  </button>
                </div>

                {/* Quick Add Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'What appointments do I have today?',
                    'Read my reminders',
                    'Summarize my last recording',
                    'Set an alarm for 7:30 AM',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMacroSteps((prev) => [...prev, preset])}
                      className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700"
                    >
                      + "{preset}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMacroModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!macroTitle.trim() || macroSteps.length === 0}
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black rounded-xl border border-amber-300 shadow-md"
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
