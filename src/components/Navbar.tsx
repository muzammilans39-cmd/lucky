import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Eye,
  Type,
  Sun,
  Moon,
  Sparkles,
  Home,
  ArrowLeft,
  AlertOctagon,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Database,
  Settings,
} from 'lucide-react';
import { HighContrastTheme, FontSizeScale, AppTab } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface NavbarProps {
  currentTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  theme: HighContrastTheme;
  onThemeChange: (theme: HighContrastTheme) => void;
  fontScale: FontSizeScale;
  onFontScaleChange: (scale: FontSizeScale) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onReadScreen: () => void;
  onTriggerSOS: () => void;
  onOpenBackup?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  theme,
  onThemeChange,
  fontScale,
  onFontScaleChange,
  soundEnabled,
  onToggleSound,
  onReadScreen,
  onTriggerSOS,
  onOpenBackup,
  onOpenSettings,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [navBattery, setNavBattery] = useState<{ level: number; charging: boolean }>({
    level: 85,
    charging: false,
  });

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((bm: any) => {
          const update = () => {
            setNavBattery({
              level: Math.round(bm.level * 100),
              charging: bm.charging,
            });
          };
          update();
          bm.addEventListener('levelchange', update);
          bm.addEventListener('chargingchange', update);
        })
        .catch(() => {});
    }
  }, []);

  const handleReadScreen = () => {
    sound.playTap();
    if (speech.isSpeaking()) {
      speech.stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      onReadScreen();
    }
  };

  const cycleTheme = () => {
    sound.playTap();
    const next: Record<HighContrastTheme, HighContrastTheme> = {
      default: 'yellow',
      yellow: 'light',
      light: 'default',
    };
    onThemeChange(next[theme]);
  };

  const cycleFontScale = () => {
    sound.playTap();
    const next: Record<FontSizeScale, FontSizeScale> = {
      normal: 'large',
      large: 'xlarge',
      xlarge: 'normal',
    };
    onFontScaleChange(next[fontScale]);
  };

  const toggleSoundFx = () => {
    const next = !soundEnabled;
    onToggleSound(next);
    sound.setSoundEnabled(next);
    if (next) sound.playTap();
  };

  const themeLabels: Record<HighContrastTheme, string> = {
    default: 'Night Mode',
    yellow: 'Max Contrast (Yellow)',
    light: 'Day Light',
  };

  const fontLabels: Record<FontSizeScale, string> = {
    normal: 'Font: Normal',
    large: 'Font: Large',
    xlarge: 'Font: Giant',
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b-2 border-slate-800 shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Back Button */}
        <div className="flex items-center gap-3">
          {currentTab !== 'home' ? (
            <button
              onClick={() => {
                sound.playTap();
                onNavigate('home');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-300 font-bold rounded-xl border-2 border-amber-400 text-base md:text-lg focus:ring-4 focus:ring-amber-400"
              aria-label="Go back to Home dashboard"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              <span>Back Home</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  AssistAI
                  <span className="text-xs uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                    Senior & Blind Care
                  </span>
                </h1>
              </div>
            </div>
          )}
        </div>

        {/* Right: Accessible Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Emergency SOS Button */}
          <button
            onClick={() => {
              onTriggerSOS();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-black text-sm md:text-base border-2 border-red-300 shadow-lg shadow-red-950/40 animate-pulse hover:animate-none focus:ring-4 focus:ring-red-400"
            aria-label="Emergency SOS: Press to sound loud alert and alert designated family contact"
            title="Emergency SOS Alert"
          >
            <AlertOctagon className="w-5 h-5 stroke-[3]" />
            <span>SOS</span>
          </button>

          {/* Read Screen Aloud Button */}
          <button
            onClick={handleReadScreen}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-sm md:text-base border-2 transition-all ${
              isSpeaking
                ? 'bg-red-500 text-white border-red-300 animate-pulse'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-sm'
            }`}
            aria-label={isSpeaking ? 'Stop reading screen aloud' : 'Read current screen aloud'}
          >
            <Volume2 className="w-5 h-5 stroke-[2.5]" />
            <span>{isSpeaking ? 'Stop Reading' : 'Read Screen'}</span>
          </button>

          {/* Text Size Cycle */}
          <button
            onClick={cycleFontScale}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl border border-slate-700 font-bold text-sm md:text-base"
            aria-label={`Current font scale is ${fontLabels[fontScale]}. Tap to toggle.`}
            title="Adjust text size"
          >
            <Type className="w-5 h-5 text-amber-400" />
            <span className="hidden sm:inline">{fontLabels[fontScale]}</span>
            <span className="sm:hidden font-mono font-bold">
              {fontScale === 'normal' ? 'A' : fontScale === 'large' ? 'A+' : 'A++'}
            </span>
          </button>

          {/* High Contrast Mode Cycle */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl border border-slate-700 font-bold text-sm md:text-base"
            aria-label={`Current theme is ${themeLabels[theme]}. Tap to cycle contrast mode.`}
            title="Toggle contrast mode"
          >
            <Eye className="w-5 h-5 text-amber-400" />
            <span className="hidden md:inline">{themeLabels[theme]}</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSoundFx}
            className={`p-2 rounded-xl border font-bold ${
              soundEnabled
                ? 'bg-slate-800 text-amber-300 border-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            aria-label={soundEnabled ? 'Sound effects enabled. Tap to mute.' : 'Sound effects muted. Tap to enable.'}
            title="Toggle sound effects"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Simple Battery Icon & Level Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-bold text-xs md:text-sm ${
              navBattery.level < 15 && !navBattery.charging
                ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                : navBattery.charging
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                : navBattery.level < 35
                ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
            title={`Device Battery: ${navBattery.level}% ${navBattery.charging ? '(Charging)' : ''}`}
            aria-label={`Battery level ${navBattery.level} percent`}
          >
            {navBattery.charging ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : navBattery.level < 15 ? (
              <BatteryWarning className="w-4 h-4 text-red-400 stroke-[2.5]" />
            ) : (
              <Battery className="w-4 h-4 text-slate-300" />
            )}
            <span className="font-mono">{navBattery.level}%</span>
          </div>

          {/* Data Backup & Restore Trigger */}
          {onOpenBackup && (
            <button
              onClick={() => {
                sound.playTap();
                onOpenBackup();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-300 rounded-xl border border-slate-700 font-bold text-xs md:text-sm"
              title="Open Data Backup & Restore"
              aria-label="Open Data Backup and Restore settings"
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Backup</span>
            </button>
          )}

          {/* Volume Booster & Accessibility Settings Trigger */}
          {onOpenSettings && (
            <button
              onClick={() => {
                sound.playTap();
                onOpenSettings();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-300 rounded-xl border border-amber-400/40 font-bold text-xs md:text-sm shadow-sm"
              title="Open Settings & Volume Booster"
              aria-label="Open Settings panel and Volume Booster"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
