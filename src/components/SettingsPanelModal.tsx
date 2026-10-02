import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  Check,
  X,
  Sliders,
  Settings,
  Ear,
  Eye,
  Type,
  Sun,
  Moon,
  RotateCcw,
  Database,
  ShieldCheck,
  Play,
} from 'lucide-react';
import { HighContrastTheme, FontSizeScale } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface SettingsPanelModalProps {
  theme: HighContrastTheme;
  onThemeChange: (theme: HighContrastTheme) => void;
  fontScale: FontSizeScale;
  onFontScaleChange: (scale: FontSizeScale) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenBackup: () => void;
  onClose: () => void;
}

export const SettingsPanelModal: React.FC<SettingsPanelModalProps> = ({
  theme,
  onThemeChange,
  fontScale,
  onFontScaleChange,
  soundEnabled,
  onToggleSound,
  onOpenBackup,
  onClose,
}) => {
  // Volume Booster State (Persisted in localStorage)
  const [boostEnabled, setBoostEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('assistai_volume_boost_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        return typeof parsed.enabled === 'boolean' ? parsed.enabled : false;
      }
    } catch {}
    return false;
  });

  const [boostLevel, setBoostLevel] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('assistai_volume_boost_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        return typeof parsed.level === 'number' ? parsed.level : 150;
      }
    } catch {}
    return 150;
  });

  // Speech Rate
  const [speechRate, setSpeechRate] = useState<number>(() => speech.getTtsSpeed());

  // Apply changes to sound and speech engines
  useEffect(() => {
    sound.setVolumeBoost(boostLevel, boostEnabled);
    speech.setVolumeBoost(boostLevel, boostEnabled);
    try {
      localStorage.setItem(
        'assistai_volume_boost_v1',
        JSON.stringify({ enabled: boostEnabled, level: boostLevel })
      );
    } catch {}
  }, [boostEnabled, boostLevel]);

  // Handle Toggle Booster
  const handleToggleBooster = () => {
    sound.playTap();
    const nextState = !boostEnabled;
    setBoostEnabled(nextState);
    sound.setVolumeBoost(boostLevel, nextState);
    speech.setVolumeBoost(boostLevel, nextState);

    if (nextState) {
      sound.playSuccess();
      speech.speakText(
        `Volume booster activated at ${boostLevel} percent. Sound clarity and amplification increased for hearing accessibility.`
      );
    } else {
      speech.speakText('Volume booster turned off. Normal standard volume restored.');
    }
  };

  // Handle Range Slider Change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBoostLevel(val);
  };

  // Handle Preset Level Click
  const handlePresetLevel = (level: number) => {
    sound.playTap();
    setBoostLevel(level);
    if (!boostEnabled) {
      setBoostEnabled(true);
    }
  };

  // Test Audio Output
  const handleTestAudio = () => {
    sound.playSuccess();
    setTimeout(() => {
      const text = boostEnabled
        ? `Testing volume booster at ${boostLevel} percent. Loud, crisp, and easy to hear.`
        : 'Testing standard audio volume. Turn on volume booster for extra amplification.';
      speech.speakText(text);
    }, 300);
  };

  // Color helper for volume meter
  const getMeterColor = () => {
    if (!boostEnabled) return 'bg-slate-700';
    if (boostLevel >= 220) return 'bg-purple-400';
    if (boostLevel >= 170) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 md:p-6 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg font-black flex-shrink-0">
              <Settings className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-md font-bold">
                  Accessibility & Controls
                </span>
                <span className="text-xs text-slate-400 font-bold">Hearing & Vision</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white mt-0.5">
                Settings & Audio Booster
              </h3>
              <p className="text-slate-300 text-sm md:text-base font-medium">
                Adjust sound amplification, speech pacing, and visual themes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-white rounded-xl"
            aria-label="Close settings modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ================= SECTION 1: DEDICATED VOLUME BOOSTER ================= */}
        <div className="p-5 md:p-6 bg-slate-950 border-3 border-amber-400/80 rounded-2xl space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl flex-shrink-0 shadow-md ${
                  boostEnabled
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Ear className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl md:text-2xl font-black text-white">
                    Hearing Volume Booster
                  </h4>
                  {boostEnabled && (
                    <span className="text-xs bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm md:text-base">
                  Amplifies speech, alarms, and cues up to 250% (+12dB) with anti-clipping dynamics
                </p>
              </div>
            </div>

            {/* Large Accessible Booster Toggle Switch */}
            <button
              onClick={handleToggleBooster}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-md ${
                boostEnabled
                  ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 ring-2 ring-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-2 border-slate-700'
              }`}
              aria-label={
                boostEnabled ? 'Volume booster is enabled. Tap to disable.' : 'Volume booster is disabled. Tap to enable.'
              }
            >
              {boostEnabled ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Booster ON ({boostLevel}%)</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5 text-slate-400" />
                  <span>Booster OFF (100%)</span>
                </>
              )}
            </button>
          </div>

          {/* Volume Booster Range Slider & Visual Meter */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-sm md:text-base font-bold">
              <label htmlFor="volume-booster-slider" className="text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Amplification Level:</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-mono text-amber-300">
                  {boostEnabled ? `${boostLevel}%` : '100%'}
                </span>
                <span className="text-xs text-slate-400">
                  {boostEnabled && boostLevel > 100
                    ? `(+${Math.round((boostLevel - 100) / 12)} dB)`
                    : '(Normal)'}
                </span>
              </div>
            </div>

            {/* Giant Accessible Slider */}
            <input
              id="volume-booster-slider"
              type="range"
              min="100"
              max="250"
              step="5"
              value={boostLevel}
              onChange={handleSliderChange}
              disabled={!boostEnabled}
              className="w-full h-4 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-40"
              aria-label="Volume booster amplification percentage from 100% to 250%"
            />

            {/* Visual Level Progress Bar / Audio Meter */}
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-200 ${getMeterColor()}`}
                style={{ width: `${((boostLevel - 100) / 150) * 100}%` }}
              />
            </div>

            {/* Quick 1-Tap Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: 'Standard', level: 100 },
                { label: 'Moderate (140%)', level: 140 },
                { label: 'High (180%)', level: 180 },
                { label: 'Max (250%)', level: 250 },
              ].map((preset) => (
                <button
                  key={preset.level}
                  onClick={() => handlePresetLevel(preset.level)}
                  className={`py-2 px-3 rounded-xl font-bold text-xs md:text-sm border transition-all ${
                    boostEnabled && boostLevel === preset.level
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Test Audio Button */}
            <div className="pt-2">
              <button
                onClick={handleTestAudio}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-amber-300 font-black rounded-xl border border-amber-400/50 flex items-center justify-center gap-2 text-base md:text-lg shadow-sm transition-transform active:scale-98"
                aria-label="Test current volume and booster output"
              >
                <Play className="w-5 h-5 fill-amber-300 stroke-0" />
                <span>Test Current Sound & Speech Volume</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: SPEECH PACING & SOUND FX ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Speech Pacing */}
          <div className="p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-200">Voice Speaking Rate</span>
              <span className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                {speechRate.toFixed(2)}x
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Slightly slower speech helps seniors understand voice responses clearly.
            </p>
            <input
              type="range"
              min="0.7"
              max="1.2"
              step="0.05"
              value={speechRate}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSpeechRate(val);
                speech.setTtsSpeed(val);
              }}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold">
              <span>0.7x (Very Slow)</span>
              <span>0.92x (Senior Clear)</span>
              <span>1.2x (Fast)</span>
            </div>
          </div>

          {/* Sound FX Toggle */}
          <div className="p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-bold text-slate-200 block">Sound FX & Chimes</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Audible confirmation clicks, chimes, and alarms.
              </p>
            </div>
            <button
              onClick={() => {
                sound.playTap();
                onToggleSound(!soundEnabled);
              }}
              className={`p-3 rounded-xl border font-bold ${
                soundEnabled
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              aria-label={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
            >
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ================= SECTION 3: DISPLAY & CONTRAST ================= */}
        <div className="p-4 bg-slate-950 border-2 border-slate-800 rounded-2xl space-y-3">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
            Visual & Text Accessibility:
          </span>
          <div className="grid grid-cols-2 gap-3">
            {/* Contrast Theme */}
            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-medium">Color Contrast:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['default', 'yellow', 'light'] as HighContrastTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      sound.playTap();
                      onThemeChange(t);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-black capitalize border ${
                      theme === t
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    {t === 'default' ? 'Dark' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Scale */}
            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-medium">Text Scale:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['normal', 'large', 'xlarge'] as FontSizeScale[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      sound.playTap();
                      onFontScaleChange(s);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-black capitalize border ${
                      fontScale === s
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    {s === 'normal' ? 'Standard' : s === 'large' ? 'Large' : 'Huge'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Data Backup link */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
          <button
            onClick={() => {
              sound.playTap();
              onClose();
              onOpenBackup();
            }}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-bold"
          >
            <Database className="w-4 h-4" />
            <span>Open Data Backup & Device Migration</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
