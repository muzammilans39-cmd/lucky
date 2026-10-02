import React, { useEffect } from 'react';
import { AlarmClock, BellOff, Clock, Sparkles } from 'lucide-react';
import { Alarm } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface AlarmRingerModalProps {
  alarm: Alarm;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const AlarmRingerModal: React.FC<AlarmRingerModalProps> = ({
  alarm,
  onDismiss,
  onSnooze,
}) => {
  useEffect(() => {
    // Play alert sound and speak announcement
    sound.playAlarmBeep();
    speech.speakText(`Alarm ringing! It is ${alarm.time}. Time for: ${alarm.label}.`);

    const interval = setInterval(() => {
      sound.playAlarmBeep();
    }, 2800);

    return () => clearInterval(interval);
  }, [alarm]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl space-y-6 mic-active-pulse">
        <div className="w-24 h-24 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-2xl animate-bounce">
          <AlarmClock className="w-14 h-14 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-amber-400 font-bold uppercase tracking-wider text-sm">
            Alarm Alert
          </span>
          <div className="text-5xl md:text-6xl font-black text-white font-mono my-2 tracking-tight">
            {alarm.time}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-amber-300">
            {alarm.label}
          </h2>
          <p className="text-slate-300 text-xl mt-2 font-medium">
            Tap Dismiss to turn off, or Snooze for 5 more minutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => {
              sound.playTap();
              speech.stopSpeech();
              onSnooze();
            }}
            className="flex-1 py-5 px-6 bg-slate-800 hover:bg-slate-700 text-amber-300 font-black rounded-2xl border-2 border-slate-600 text-2xl shadow-xl flex items-center justify-center gap-2"
            aria-label="Snooze alarm for 5 minutes"
          >
            <Clock className="w-7 h-7" />
            <span>Snooze</span>
          </button>

          <button
            onClick={() => {
              sound.playSuccess();
              speech.stopSpeech();
              onDismiss();
            }}
            className="flex-1 py-5 px-6 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-2xl border-2 border-amber-300 text-2xl shadow-xl flex items-center justify-center gap-2"
            aria-label="Dismiss alarm"
          >
            <BellOff className="w-7 h-7 stroke-[2.5]" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
