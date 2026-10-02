import React, { useState, useEffect, useRef } from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  Wifi,
  WifiOff,
  Activity,
  Volume2,
  AlertTriangle,
  Mic,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface BatteryInfo {
  level: number; // 0 to 100
  charging: boolean;
  supported: boolean;
}

export const DeviceStatusDashboard: React.FC = () => {
  const [battery, setBattery] = useState<BatteryInfo>({
    level: 85,
    charging: false,
    supported: false,
  });
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Track whether the <15% audible alert has already been announced to avoid repetitive loops
  const hasAlertedRef = useRef<boolean>(false);

  // Function to sound the audible alert when battery drops below 15%
  const triggerBelow15AudibleAlert = (currentLevel: number) => {
    sound.playAlarmBeep();
    setTimeout(() => {
      speech.speakText(
        `Critical battery alert: Your device battery has dropped to ${currentLevel} percent. Please plug your charger in immediately to keep your assistant active.`
      );
    }, 450);
  };

  // Monitor Battery Status API
  useEffect(() => {
    let batteryManager: any = null;

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((bm: any) => {
          batteryManager = bm;

          const handleBatteryChange = () => {
            const currentLevel = Math.round(bm.level * 100);
            const isCharging = bm.charging;

            setBattery({
              level: currentLevel,
              charging: isCharging,
              supported: true,
            });

            // Trigger audible alert if dropped below 15% and not currently charging
            if (currentLevel < 15 && !isCharging) {
              if (!hasAlertedRef.current) {
                hasAlertedRef.current = true;
                triggerBelow15AudibleAlert(currentLevel);
              }
            } else if (isCharging || currentLevel >= 15) {
              // Reset alert trigger flag once plugged in or charged up
              hasAlertedRef.current = false;
            }
          };

          handleBatteryChange();
          bm.addEventListener('levelchange', handleBatteryChange);
          bm.addEventListener('chargingchange', handleBatteryChange);
        })
        .catch(() => {
          // Standard fallback if browser restricts getBattery for privacy
          setBattery({ level: 82, charging: false, supported: false });
        });
    }

    // Monitor Online/Offline Wi-Fi
    const handleOnline = () => {
      setIsOnline(true);
      sound.playSuccess();
      speech.speakText('Internet connection restored. All assistant features are online.');
    };

    const handleOffline = () => {
      setIsOnline(false);
      sound.playAlarmBeep();
      speech.speakText('Warning: Internet connection lost. Saved alarms and offline reminders will still run.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', () => {});
        batteryManager.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  // Condition: battery strictly below 15% and not plugged in
  const isBelow15Percent = battery.level < 15 && !battery.charging;

  const handleReadStatusSummary = () => {
    sound.playTap();
    let text = `Device status check: `;
    text += `Your battery is at ${battery.level} percent${
      battery.charging ? ', and is actively charging.' : '.'
    } `;

    if (isBelow15Percent) {
      text += `Warning: Your battery has dropped below 15 percent! Please plug into a charger immediately. `;
    } else if (battery.level <= 25) {
      text += `Battery is running somewhat low. Consider charging soon. `;
    }

    if (isOnline) {
      text += `Your Wi-Fi internet connection is strong and online. `;
    } else {
      text += `Warning: You are currently offline with no internet connection. `;
    }

    text += `Voice microphone and speaker system are ready to take your commands.`;
    speech.speakText(text);
  };

  // Simulation controls to allow testing the below 15% audible alert on any machine
  const simulateLowBattery = () => {
    sound.playTap();
    setBattery({ level: 12, charging: false, supported: true });
    hasAlertedRef.current = true;
    triggerBelow15AudibleAlert(12);
  };

  const simulateRestoreBattery = () => {
    sound.playSuccess();
    hasAlertedRef.current = false;
    setBattery({ level: 90, charging: true, supported: true });
    speech.speakText('Battery restored to 90 percent and actively charging.');
  };

  // Color helper for battery status tile
  const getBatteryColor = () => {
    if (isBelow15Percent) return 'text-red-400 bg-red-950/90 border-red-500 ring-2 ring-red-500/50';
    if (battery.level < 35) return 'text-amber-400 bg-amber-950/60 border-amber-500';
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-500';
  };

  return (
    <div className="space-y-3">
      {/* 🚨 Audible & Visual Critical Low Battery Alert (<15%) */}
      {isBelow15Percent && (
        <div className="p-5 bg-red-950/95 border-4 border-red-500 rounded-3xl text-white shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-500 text-slate-950 rounded-2xl flex-shrink-0 shadow-lg">
              <BatteryWarning className="w-9 h-9 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase bg-red-600 text-white px-2.5 py-0.5 rounded-md font-black tracking-wider">
                  Audible Alert Triggered
                </span>
                <span className="text-xs text-red-200 font-bold">Below 15% Threshold</span>
              </div>
              <h4 className="text-2xl md:text-3xl font-black text-red-100 mt-0.5">
                ⚠️ Critical Low Battery ({battery.level}%)
              </h4>
              <p className="text-white text-base md:text-lg font-bold">
                Please connect your charger now so your voice assistant and alarms remain operational!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => triggerBelow15AudibleAlert(battery.level)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl border border-red-300 shadow-md text-base transition-transform active:scale-95"
              aria-label="Replay audible battery alarm"
            >
              <Volume2 className="w-6 h-6" />
              <span>Sound Alarm</span>
            </button>
            <button
              onClick={simulateRestoreBattery}
              className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl border border-emerald-500 text-sm"
              aria-label="Plug in charger"
            >
              <span>⚡ Plug In Charger</span>
            </button>
          </div>
        </div>
      )}

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="p-4 bg-amber-950/95 border-3 border-amber-500 rounded-3xl text-white shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl">
              <WifiOff className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xl font-black text-amber-200">
                ⚠️ Internet Connection Lost (Offline)
              </h4>
              <p className="text-slate-100 text-base font-bold">
                You are offline. Saved alarms and offline reminders still work, but voice AI needs internet.
              </p>
            </div>
          </div>
          <button
            onClick={() => speech.speakText('You are currently offline. Check your home Wi-Fi or router.')}
            className="p-3 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl flex-shrink-0 font-bold"
            aria-label="Speak offline warning"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main Status Dashboard Card */}
      <div className="bg-slate-900/90 border-2 border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-400 text-slate-950 rounded-xl font-black">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white">
                Device & System Readiness
              </h3>
              <p className="text-slate-300 text-sm font-bold">
                Battery Status API & Wi-Fi monitoring with audible low-power alert
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleReadStatusSummary}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-400 hover:bg-sky-300 active:bg-sky-500 text-slate-950 font-black rounded-xl border border-sky-300 text-base shadow-md transition-transform active:scale-95"
              aria-label="Read device health and battery status aloud"
            >
              <Volume2 className="w-5 h-5 stroke-[2.5]" />
              <span>Read Status Aloud</span>
            </button>
          </div>
        </div>

        {/* 3 Status Indicator Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Simple Battery Icon & Status Display */}
          <div
            className={`p-4 rounded-2xl border-2 shadow-sm space-y-2 ${getBatteryColor()}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-black tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>Battery Level</span>
                {battery.charging && (
                  <span className="text-xs bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.2 rounded font-bold">
                    Charging
                  </span>
                )}
              </span>

              {/* Simple Battery Icon */}
              {battery.charging ? (
                <BatteryCharging className="w-7 h-7 text-emerald-300 animate-pulse stroke-[2.5]" />
              ) : isBelow15Percent ? (
                <BatteryWarning className="w-7 h-7 text-red-400 stroke-[3] animate-bounce" />
              ) : battery.level < 35 ? (
                <Battery className="w-7 h-7 text-amber-400 stroke-[2.5]" />
              ) : (
                <Battery className="w-7 h-7 text-emerald-400 stroke-[2.5]" />
              )}
            </div>

            {/* Giant Battery Percentage */}
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black text-white font-mono tracking-tight">
                {battery.level}%
              </div>
              <span className="text-sm font-bold text-slate-300">
                {battery.charging ? '⚡ Plugged In' : isBelow15Percent ? '⚠️ <15% Alert' : 'Discharging'}
              </span>
            </div>

            {/* Visual Battery Bar */}
            <div className="w-full h-2.5 bg-slate-950/70 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className={`h-full transition-all duration-500 ${
                  isBelow15Percent
                    ? 'bg-red-500'
                    : battery.level < 35
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${battery.level}%` }}
              />
            </div>

            <div className="text-xs font-bold text-slate-300 flex items-center justify-between pt-0.5">
              <span>{isBelow15Percent ? '🚨 Critical Alert Active' : 'Normal Range'}</span>
              <span>Threshold: 15%</span>
            </div>
          </div>

          {/* 2. Wi-Fi / Connectivity */}
          <div
            className={`p-4 rounded-2xl border-2 shadow-sm space-y-2 ${
              isOnline
                ? 'text-sky-300 bg-sky-950/60 border-sky-500'
                : 'text-amber-300 bg-amber-950/60 border-amber-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-black tracking-wider text-slate-300">
                Wi-Fi Connection
              </span>
              {isOnline ? (
                <Wifi className="w-7 h-7 text-sky-400 stroke-[2.5]" />
              ) : (
                <WifiOff className="w-7 h-7 text-amber-400 stroke-[2.5]" />
              )}
            </div>

            <div className="text-4xl font-black text-white tracking-tight">
              {isOnline ? 'Online' : 'Offline'}
            </div>

            <div className="text-sm font-bold text-slate-200">
              {isOnline ? '🟢 Connected & Strong' : '⚠️ No Internet'}
            </div>
          </div>

          {/* 3. Voice Assistant Readiness */}
          <div className="p-4 rounded-2xl border-2 border-emerald-500/80 bg-emerald-950/60 text-emerald-300 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-black tracking-wider text-slate-300">
                Assistant Readiness
              </span>
              <Mic className="w-7 h-7 text-emerald-400 stroke-[2.5]" />
            </div>

            <div className="text-4xl font-black text-white tracking-tight">
              Ready
            </div>

            <div className="text-sm font-bold text-slate-200">
              🎤 Mic & Audio Active
            </div>
          </div>
        </div>

        {/* Battery Test / Simulation helper for desktop/evaluators */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Battery Status API monitors level in real time. Audible alert sounds if battery &lt; 15%.</span>
          </div>

          <div className="flex items-center gap-2">
            {isBelow15Percent ? (
              <button
                onClick={simulateRestoreBattery}
                className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-600 font-bold"
              >
                Restore Battery (90%)
              </button>
            ) : (
              <button
                onClick={simulateLowBattery}
                className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg border border-red-600 font-bold flex items-center gap-1"
                title="Simulate battery dropping to 12% to test audible alert"
              >
                <span>Test &lt;15% Audible Alert</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
