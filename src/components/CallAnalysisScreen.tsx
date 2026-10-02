import React, { useState, useRef } from 'react';
import {
  PhoneCall,
  Mic,
  Square,
  Upload,
  FileAudio,
  CalendarPlus,
  BellRing,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  ListTodo,
  AlertCircle,
  Sparkles,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { CallAnalysisRecord, Reminder, Appointment } from '../types';
import { SAMPLE_CALLS } from '../utils/storage';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface CallAnalysisScreenProps {
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  callHistory: CallAnalysisRecord[];
  onSaveAnalysisRecord: (record: CallAnalysisRecord) => void;
}

export const CallAnalysisScreen: React.FC<CallAnalysisScreenProps> = ({
  onAddReminder,
  onAddAppointment,
  callHistory,
  onSaveAnalysisRecord,
}) => {
  const [activeAnalysis, setActiveAnalysis] = useState<CallAnalysisRecord | null>(
    callHistory.length > 0 ? callHistory[0] : null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [actionSavedMessage, setActionSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual transcript / paste text state
  const [manualText, setManualText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start live microphone recording for call
  const startRecording = async () => {
    sound.playMicStart();
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          processCallAudio(base64Data, 'audio/webm', `${recordingSeconds} seconds`);
        };
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      sound.playAlarmBeep();
      setErrorMessage('Could not access microphone. Please ensure microphone permissions are granted in your browser settings.');
      speech.speakText('Could not access microphone. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    sound.playMicStop();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  // Upload an audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playTap();
    setIsAnalyzing(true);
    setAnalysisStatus(`Loading audio file: ${file.name}...`);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      processCallAudio(base64Data, file.type || 'audio/mp3', file.name);
    };
    reader.onerror = () => {
      setIsAnalyzing(false);
      sound.playAlarmBeep();
      setErrorMessage('Error reading uploaded audio file. Please try another audio format.');
      speech.speakText('Error reading uploaded audio file.');
    };
    reader.readAsDataURL(file);
  };

  // Process audio or transcript with Gemini API
  const processCallAudio = async (
    audioBase64?: string,
    mimeType?: string,
    sourceName?: string,
    transcriptText?: string
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStatus('AI is transcribing and analyzing your conversation...');
    setActionSavedMessage(null);

    try {
      const payload: any = {};
      if (transcriptText) {
        payload.transcript = transcriptText;
      } else if (audioBase64) {
        payload.audioBase64 = audioBase64;
        payload.mimeType = mimeType || 'audio/webm';
      }

      const res = await fetch('/api/gemini/analyze-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Call analysis failed');
      }

      const data = await res.json();
      const newRecord: CallAnalysisRecord = {
        id: 'call-' + Date.now(),
        timestamp: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        title: sourceName || 'Recorded Phone Conversation',
        audioDuration: sourceName?.includes('sec') ? sourceName : '1 min',
        transcript: data.transcript,
        summary: data.summary,
        seniorExplanation: data.seniorExplanation,
        detectedType: data.detectedType || 'general',
        entities: data.entities || {
          names: [],
          dates: [],
          times: [],
          locations: [],
          phoneNumbers: [],
          tasksAndPromises: [],
          importantInstructions: [],
        },
        suggestedAction: data.suggestedAction,
        actionSaved: false,
      };

      setActiveAnalysis(newRecord);
      onSaveAnalysisRecord(newRecord);
      sound.playSuccess();

      // Read summary automatically
      speech.speakText(
        `Analysis completed. In short: ${newRecord.seniorExplanation}`
      );
    } catch (err: any) {
      console.error('Call analysis error:', err);
      sound.playAlarmBeep();
      setErrorMessage('Could not connect to analysis service. Please check your network connection.');
      speech.speakText('Could not analyze conversation. Please check your connection.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  // One-tap sample call testing
  const handleTestSampleCall = (sample: (typeof SAMPLE_CALLS)[0]) => {
    sound.playTap();
    processCallAudio(undefined, undefined, sample.title, sample.transcript);
  };

  // Convert suggested action to calendar appointment or reminder
  const handleSaveSuggestedAction = (type: 'appointment' | 'reminder') => {
    if (!activeAnalysis || !activeAnalysis.suggestedAction) return;
    const action = activeAnalysis.suggestedAction;

    if (type === 'appointment') {
      onAddAppointment({
        title: action.title || 'Scheduled Call Appointment',
        date: action.date || new Date().toISOString().split('T')[0],
        time: action.time || '10:00 AM',
        location: action.location || 'Local Office / Clinic',
        notes: action.notes || activeAnalysis.summary,
        category: 'Doctor',
      });
      sound.playSuccess();
      setActionSavedMessage(`Added "${action.title}" to Appointments!`);
      speech.speakText(`Added ${action.title} to your appointments.`);
    } else {
      onAddReminder({
        title: action.title || 'Reminder from Phone Call',
        date: action.date || new Date().toISOString().split('T')[0],
        time: action.time || '09:00 AM',
        completed: false,
        recurrence: 'none',
        priority: 'high',
      });
      sound.playSuccess();
      setActionSavedMessage(`Added "${action.title}" to Reminders!`);
      speech.speakText(`Added reminder for ${action.title}.`);
    }

    // Mark as saved
    activeAnalysis.actionSaved = true;
  };

  // Format timer
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* ⚠️ Prominent Consent & Legal Disclaimer */}
      <div className="p-4 md:p-5 bg-amber-950/70 border-3 border-amber-400 rounded-3xl text-amber-200 shadow-xl flex items-start gap-4">
        <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg md:text-xl font-black text-amber-300">
            Legal & Privacy Notice: Call Recording Consent
          </h3>
          <p className="text-base md:text-lg text-amber-100/90 mt-1 leading-relaxed">
            Recording phone conversations may require the legal consent of all participants under federal, state, or local laws. Always notify and obtain permission from the person you are speaking with before recording.
          </p>
        </div>
      </div>

      {/* Error Message Notice Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-950/90 border-3 border-red-500 rounded-2xl text-white shadow-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-red-400 flex-shrink-0" />
            <span className="font-bold text-base md:text-lg text-red-100">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Recording & Input Action Bar */}
      <div className="bg-slate-800/90 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 mb-4">
          <PhoneCall className="w-8 h-8 text-emerald-400" />
          Record or Analyze a Phone Call
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Live Recording Button */}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black rounded-2xl border-3 border-red-300 shadow-xl flex items-center justify-center gap-3 text-lg md:text-xl mic-active-pulse"
              aria-label="Stop recording call"
            >
              <Square className="w-8 h-8 fill-current" />
              <span>Stop Recording ({formatTimer(recordingSeconds)})</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-2xl border-3 border-emerald-300 shadow-xl flex items-center justify-center gap-3 text-lg md:text-xl transition-transform active:scale-95"
              aria-label="Start recording call audio"
            >
              <Mic className="w-8 h-8 stroke-[2.5]" />
              <span>Record Live Call</span>
            </button>
          )}

          {/* Upload Audio File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-black rounded-2xl border-2 border-slate-500 shadow-xl flex items-center justify-center gap-3 text-lg md:text-xl"
            aria-label="Upload an audio recording file"
          >
            <Upload className="w-7 h-7 stroke-[2.5] text-amber-400" />
            <span>Upload Audio File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />

          {/* Paste Transcript alternative */}
          <button
            onClick={() => {
              sound.playTap();
              setShowManualInput(!showManualInput);
            }}
            className="p-5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-black rounded-2xl border-2 border-slate-500 shadow-xl flex items-center justify-center gap-3 text-lg md:text-xl"
          >
            <BookOpen className="w-7 h-7 stroke-[2.5] text-sky-400" />
            <span>{showManualInput ? 'Hide Text Input' : 'Type / Paste Text'}</span>
          </button>
        </div>

        {/* Manual text paste drawer */}
        {showManualInput && (
          <div className="mt-4 p-4 bg-slate-900 border-2 border-slate-700 rounded-2xl space-y-3">
            <label className="block text-slate-200 font-bold text-lg">
              Paste or type call transcript:
            </label>
            <textarea
              rows={4}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="e.g. Receptionist: Hello, Dr. Adams is confirming your appointment for tomorrow at 10 AM..."
              className="w-full p-4 bg-slate-800 text-white rounded-xl border border-slate-600 text-base"
            />
            <button
              onClick={() => {
                if (manualText.trim()) {
                  processCallAudio(undefined, undefined, 'Manual Call Text', manualText);
                }
              }}
              disabled={!manualText.trim() || isAnalyzing}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl border-2 border-amber-300"
            >
              Analyze Transcript with AI
            </button>
          </div>
        )}

        {/* 🌟 1-Tap Realistic Sample Calls for Instant Testing */}
        <div className="mt-6 pt-5 border-t border-slate-700/80">
          <h3 className="text-lg md:text-xl font-black text-amber-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Or Test Immediately with a Sample Phone Call:
          </h3>
          <p className="text-slate-300 text-base mb-3">
            Tap any realistic scenario below to see how Gemini transcribes, extracts, and summarizes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_CALLS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleTestSampleCall(sample)}
                disabled={isAnalyzing}
                className="text-left p-4 bg-slate-900 hover:bg-slate-750 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 rounded-2xl transition-all shadow-md group disabled:opacity-50"
                aria-label={`Analyze sample call: ${sample.title}`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                  <span>SAMPLE CALL</span>
                  <span>{sample.duration}</span>
                </div>
                <h4 className="font-bold text-white text-base md:text-lg group-hover:text-amber-300">
                  {sample.title}
                </h4>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {isAnalyzing && (
        <div className="p-8 bg-slate-800/90 border-3 border-amber-400 rounded-3xl text-center space-y-3 shadow-2xl">
          <RefreshCw className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
          <h3 className="text-2xl font-black text-white">{analysisStatus}</h3>
          <p className="text-slate-300 text-lg">
            Gemini is extracting names, dates, promises, and creating a simplified summary...
          </p>
        </div>
      )}

      {/* Analysis Result Display */}
      {activeAnalysis && !isAnalyzing && (
        <div className="bg-slate-800/90 border-3 border-emerald-400/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          {/* Header & Quick Action Confirmation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
            <div>
              <span className="text-xs uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/50 px-3 py-1 rounded-full font-bold">
                AI Analysis Completed
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
                {activeAnalysis.title}
              </h3>
              <p className="text-slate-300 text-base">{activeAnalysis.timestamp}</p>
            </div>

            {/* Read Aloud Summary Button */}
            <button
              onClick={() => {
                sound.playTap();
                speech.speakText(
                  `Here is your call summary: ${activeAnalysis.summary}. In plain words: ${activeAnalysis.seniorExplanation}`
                );
              }}
              className="flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-2xl shadow-lg border-2 border-amber-300 text-base md:text-lg"
              aria-label="Read call summary aloud"
            >
              <Volume2 className="w-6 h-6 stroke-[2.5]" />
              <span>Read Summary Aloud</span>
            </button>
          </div>

          {/* 1. Senior-Friendly Plain Takeaway Banner */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/80 to-slate-900 border-2 border-emerald-400 rounded-2xl shadow-md">
            <span className="text-emerald-400 font-bold uppercase text-xs tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" /> Plain Words Takeaway (Easy to Understand)
            </span>
            <p className="text-xl md:text-2xl font-black text-white leading-snug">
              "{activeAnalysis.seniorExplanation}"
            </p>
          </div>

          {/* 2. Short Summary */}
          <div>
            <h4 className="text-xl font-black text-slate-200 mb-2">Short Summary:</h4>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed bg-slate-900/80 p-5 rounded-2xl border border-slate-700">
              {activeAnalysis.summary}
            </p>
          </div>

          {/* 3. Automatic Action Detector: Save to Calendar / Reminder */}
          {activeAnalysis.suggestedAction && activeAnalysis.suggestedAction.type !== 'none' && (
            <div className="p-5 bg-amber-950/60 border-3 border-amber-400 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 text-amber-300 font-black text-lg">
                  <BellRing className="w-6 h-6" />
                  Detected Action: {activeAnalysis.suggestedAction.title}
                </span>
                <span className="text-sm bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded-md uppercase">
                  {activeAnalysis.detectedType}
                </span>
              </div>

              <div className="text-slate-200 text-base md:text-lg">
                <p>
                  📅 <strong>When:</strong> {activeAnalysis.suggestedAction.date} at{' '}
                  {activeAnalysis.suggestedAction.time}
                </p>
                {activeAnalysis.suggestedAction.location && (
                  <p>
                    📍 <strong>Where:</strong> {activeAnalysis.suggestedAction.location}
                  </p>
                )}
              </div>

              {actionSavedMessage ? (
                <div className="p-3 bg-emerald-900/80 border-2 border-emerald-400 rounded-xl text-emerald-200 font-bold flex items-center gap-2 text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span>{actionSavedMessage}</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => handleSaveSuggestedAction('appointment')}
                    className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl border-2 border-emerald-300 text-lg shadow-md"
                    aria-label="Save this appointment to calendar"
                  >
                    <CalendarPlus className="w-6 h-6 stroke-[2.5]" />
                    <span>Save to Appointments</span>
                  </button>
                  <button
                    onClick={() => handleSaveSuggestedAction('reminder')}
                    className="flex items-center gap-2 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl border-2 border-amber-300 text-lg shadow-md"
                    aria-label="Save as a reminder"
                  >
                    <BellRing className="w-6 h-6 stroke-[2.5]" />
                    <span>Save as Reminder</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. Identified Important Information (Entities) */}
          <div>
            <h4 className="text-xl md:text-2xl font-black text-slate-100 mb-3">
              Identified Information:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Names */}
              <div className="p-4 bg-slate-900/80 border-2 border-slate-700 rounded-2xl">
                <span className="text-amber-400 font-bold flex items-center gap-2 text-base md:text-lg mb-2">
                  <User className="w-5 h-5" /> People & Names:
                </span>
                {activeAnalysis.entities.names.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeAnalysis.entities.names.map((n, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-slate-800 text-white font-bold rounded-lg border border-slate-600 text-base"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">None mentioned</p>
                )}
              </div>

              {/* Dates & Times */}
              <div className="p-4 bg-slate-900/80 border-2 border-slate-700 rounded-2xl">
                <span className="text-sky-400 font-bold flex items-center gap-2 text-base md:text-lg mb-2">
                  <Clock className="w-5 h-5" /> Dates & Times:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[...activeAnalysis.entities.dates, ...activeAnalysis.entities.times].map(
                    (d, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-slate-800 text-sky-200 font-bold rounded-lg border border-sky-700 text-base"
                      >
                        {d}
                      </span>
                    )
                  )}
                  {activeAnalysis.entities.dates.length === 0 &&
                    activeAnalysis.entities.times.length === 0 && (
                      <p className="text-slate-400">None mentioned</p>
                    )}
                </div>
              </div>

              {/* Locations */}
              <div className="p-4 bg-slate-900/80 border-2 border-slate-700 rounded-2xl">
                <span className="text-purple-400 font-bold flex items-center gap-2 text-base md:text-lg mb-2">
                  <MapPin className="w-5 h-5" /> Locations & Addresses:
                </span>
                {activeAnalysis.entities.locations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeAnalysis.entities.locations.map((loc, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-slate-800 text-purple-200 font-bold rounded-lg border border-purple-700 text-base"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">None mentioned</p>
                )}
              </div>

              {/* Phone Numbers */}
              <div className="p-4 bg-slate-900/80 border-2 border-slate-700 rounded-2xl">
                <span className="text-emerald-400 font-bold flex items-center gap-2 text-base md:text-lg mb-2">
                  <Phone className="w-5 h-5" /> Phone Numbers:
                </span>
                {activeAnalysis.entities.phoneNumbers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeAnalysis.entities.phoneNumbers.map((phone, i) => (
                      <a
                        key={i}
                        href={`tel:${phone.replace(/[^0-9]/g, '')}`}
                        className="px-3.5 py-1.5 bg-emerald-950 text-emerald-300 font-black rounded-lg border border-emerald-400 text-base hover:bg-emerald-900 flex items-center gap-1.5"
                        title="Tap to call this number"
                      >
                        <span>📞 {phone}</span>
                        <span className="text-xs bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded font-bold">
                          Call
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">None mentioned</p>
                )}
              </div>

              {/* Tasks or Promises */}
              <div className="p-4 bg-slate-900/80 border-2 border-slate-700 rounded-2xl md:col-span-2">
                <span className="text-amber-400 font-bold flex items-center gap-2 text-base md:text-lg mb-2">
                  <ListTodo className="w-5 h-5" /> Tasks, Promises & Next Steps:
                </span>
                {activeAnalysis.entities.tasksAndPromises.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1.5 text-slate-200 text-base md:text-lg">
                    {activeAnalysis.entities.tasksAndPromises.map((task, i) => (
                      <li key={i} className="font-medium">
                        {task}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">No explicit tasks promised</p>
                )}
              </div>

              {/* Important Instructions */}
              <div className="p-4 bg-slate-900/80 border-2 border-amber-600/70 rounded-2xl md:col-span-2">
                <span className="text-amber-300 font-bold flex items-center gap-2 text-base md:text-lg mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" /> Important Instructions (E.g. Fasting, Documents, Timing):
                </span>
                {activeAnalysis.entities.importantInstructions.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1.5 text-amber-100 text-base md:text-lg">
                    {activeAnalysis.entities.importantInstructions.map((inst, i) => (
                      <li key={i} className="font-bold">
                        {inst}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400">No special medical or preparation instructions</p>
                )}
              </div>
            </div>
          </div>

          {/* 5. Full Transcript with Read Aloud */}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xl font-black text-slate-200">Full Word-for-Word Transcript:</h4>
              <button
                onClick={() => {
                  sound.playTap();
                  speech.speakText(activeAnalysis.transcript);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold rounded-xl border border-slate-600 text-sm md:text-base"
                aria-label="Read full transcript aloud"
              >
                <Volume2 className="w-4 h-4 stroke-[2.5]" />
                <span>Read Transcript</span>
              </button>
            </div>
            <div className="bg-slate-950 p-5 rounded-2xl border-2 border-slate-800 text-slate-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
              {activeAnalysis.transcript}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
