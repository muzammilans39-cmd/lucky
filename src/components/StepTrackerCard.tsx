import React, { useState, useEffect, useRef } from 'react';
import {
  Footprints,
  Activity,
  Flame,
  Clock,
  Compass,
  Volume2,
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface StepData {
  steps: number;
  goal: number;
  dateIso: string;
}

export const StepTrackerCard: React.FC = () => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [stepData, setStepData] = useState<StepData>(() => {
    try {
      const stored = localStorage.getItem('assistai_step_tracker_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.dateIso === todayIso) {
          return parsed;
        }
      }
    } catch {}
    // Initial demo baseline for today so the user immediately sees working metrics
    return {
      steps: 1840,
      goal: 3000,
      dateIso: todayIso,
    };
  });

  const [isMotionListening, setIsMotionListening] = useState(false);
  const [motionSupported, setMotionSupported] = useState(true);
  const lastStepTimeRef = useRef<number>(0);
  const lastMagRef = useRef<number>(9.8);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('assistai_step_tracker_v1', JSON.stringify(stepData));
    } catch {}
  }, [stepData]);

  // Motion Detection Event Listener
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setMotionSupported(false);
      return;
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const delta = Math.abs(mag - lastMagRef.current);
      lastMagRef.current = mag;

      const now = Date.now();
      // Peak detection: significant impulse acceleration with minimum 320ms human stride interval
      if (delta > 2.8 && now - lastStepTimeRef.current > 320) {
        lastStepTimeRef.current = now;
        setStepData((prev) => ({
          ...prev,
          steps: prev.steps + 1,
        }));
      }
    };

    if (isMotionListening) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isMotionListening]);

  const requestMotionPermission = async () => {
    sound.playTap();
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setIsMotionListening(true);
          speech.speakText('Step sensor activated. Keeping count as you walk.');
        } else {
          speech.speakText('Motion sensor access was not allowed.');
        }
      } catch {
        setIsMotionListening(true);
      }
    } else {
      // Browsers that do not require explicit permission prompt
      setIsMotionListening(true);
      speech.speakText('Step sensor active.');
    }
  };

  const handleAddManualSteps = (count: number) => {
    sound.playSuccess();
    setStepData((prev) => ({
      ...prev,
      steps: prev.steps + count,
    }));
    speech.speakText(`Added ${count} steps. Total is now ${stepData.steps + count} steps.`);
  };

  const handleResetSteps = () => {
    sound.playTap();
    setStepData((prev) => ({
      ...prev,
      steps: 0,
    }));
    speech.speakText('Today steps reset to zero.');
  };

  // Derived metrics
  const steps = stepData.steps;
  const goal = stepData.goal;
  const percent = Math.min(100, Math.round((steps / goal) * 100));
  const miles = (steps * 0.00045).toFixed(2);
  const activeMinutes = Math.round(steps / 80);
  const calories = Math.round(steps * 0.04);

  const handleSpeakSummary = () => {
    sound.playTap();
    let speechMsg = `Daily activity summary: You have taken ${steps} steps today. `;
    speechMsg += `That is ${percent} percent of your ${goal} step goal. `;
    speechMsg += `You have walked approximately ${miles} miles, active for ${activeMinutes} minutes, and burned ${calories} calories. Keep up the wonderful movement!`;
    speech.speakText(speechMsg);
  };

  return (
    <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border-3 border-teal-400 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-teal-400/20 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 bg-teal-400 text-slate-950 rounded-2xl flex items-center justify-center font-black shadow-lg flex-shrink-0">
            <Footprints className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase bg-teal-950 text-teal-300 border border-teal-500/60 px-2.5 py-0.5 rounded-md font-black flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                Physical Activity
              </span>
              {isMotionListening && (
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-500 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Sensor Live
                </span>
              )}
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white mt-0.5">
              Daily Step Tracker
            </h3>
            <p className="text-slate-300 text-sm md:text-base font-medium">
              Encouraging healthy daily movement and gentle exercise
            </p>
          </div>
        </div>

        {/* Read Aloud Button */}
        <button
          onClick={handleSpeakSummary}
          className="flex items-center gap-2 px-5 py-3 bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black rounded-2xl shadow-xl border-2 border-teal-200 text-base md:text-lg transition-transform active:scale-95"
          aria-label="Read step summary aloud"
        >
          <Volume2 className="w-6 h-6 stroke-[2.5]" />
          <span>Read Steps</span>
        </button>
      </div>

      {/* Giant High-Contrast Step Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        {/* Big Step Number Tile */}
        <div className="md:col-span-2 p-6 bg-slate-950/80 border-2 border-teal-500/60 rounded-3xl space-y-3 shadow-inner">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs uppercase tracking-wider text-teal-300 font-black">
                Steps Taken Today
              </span>
              <div className="text-5xl sm:text-6xl md:text-7xl font-black text-white font-mono tracking-tight">
                {steps.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-sm font-bold block">Daily Goal</span>
              <span className="text-2xl md:text-3xl font-black text-teal-300">
                {goal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* High-Contrast Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-sm font-black text-slate-200">
              <span>Progress: {percent}% of daily goal</span>
              {percent >= 100 && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Goal Achieved!
                </span>
              )}
            </div>
            <div className="w-full h-5 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-700">
              <div
                className={`h-full transition-all duration-700 ${
                  percent >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Secondary Metric Badges */}
        <div className="grid grid-cols-3 md:grid-cols-1 gap-2.5">
          <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-teal-300 rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold block">Distance</span>
              <span className="text-xl font-black text-white">{miles} mi</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-amber-300 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold block">Active Time</span>
              <span className="text-xl font-black text-white">{activeMinutes} mins</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-rose-300 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold block">Calories</span>
              <span className="text-xl font-black text-white">{calories} kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls: Live Motion Toggle, Quick Steps, Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {!isMotionListening ? (
            <button
              onClick={requestMotionPermission}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl border border-teal-500/50 text-sm flex items-center gap-2"
              aria-label="Start device motion step detection"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enable Device Motion</span>
            </button>
          ) : (
            <button
              onClick={() => setIsMotionListening(false)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 text-sm flex items-center gap-2"
              aria-label="Pause step sensor"
            >
              <span>Pause Sensor</span>
            </button>
          )}

          {/* Quick Manual Increment Buttons (for walkers, treadmills, or resting phone) */}
          <button
            onClick={() => handleAddManualSteps(50)}
            className="px-3.5 py-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 font-bold rounded-xl border border-teal-500/50 text-sm flex items-center gap-1"
            aria-label="Add 50 steps from a walk"
          >
            <Plus className="w-4 h-4" />
            <span>+50 Steps</span>
          </button>

          <button
            onClick={() => handleAddManualSteps(100)}
            className="px-3.5 py-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 font-bold rounded-xl border border-teal-500/50 text-sm flex items-center gap-1"
            aria-label="Add 100 steps from a walk"
          >
            <Plus className="w-4 h-4" />
            <span>+100 Steps</span>
          </button>
        </div>

        <button
          onClick={handleResetSteps}
          className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1"
          aria-label="Reset steps to zero"
          title="Reset today's steps"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
