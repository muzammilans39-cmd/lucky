import React from 'react';
import { Home, Mic, PhoneCall, Bell, Calendar, ClipboardList, Pill } from 'lucide-react';
import { AppTab } from '../types';
import { sound } from '../utils/audioFeedback';

interface BottomNavProps {
  currentTab: AppTab;
  onNavigate: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const tabs = [
    { id: 'home' as AppTab, label: 'Home', icon: Home, color: 'text-amber-400' },
    { id: 'medications' as AppTab, label: 'Meds', icon: Pill, color: 'text-emerald-400' },
    { id: 'assistant' as AppTab, label: 'Assistant', icon: Mic, color: 'text-amber-400' },
    { id: 'call-analysis' as AppTab, label: 'Calls', icon: PhoneCall, color: 'text-emerald-400' },
    { id: 'reminders-alarms' as AppTab, label: 'Reminders', icon: Bell, color: 'text-sky-400' },
    { id: 'appointments' as AppTab, label: 'Events', icon: Calendar, color: 'text-purple-400' },
    { id: 'planner' as AppTab, label: 'Planner', icon: ClipboardList, color: 'text-orange-400' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur border-t-2 border-slate-800 shadow-2xl py-2 px-2"
      aria-label="Bottom primary navigation"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playTap();
                onNavigate(tab.id);
              }}
              className={`flex-1 py-2 px-1 flex flex-col items-center justify-center rounded-2xl transition-all ${
                isActive
                  ? 'bg-slate-800 border-2 border-amber-400 text-white font-black scale-105 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-bold'
              }`}
              aria-label={`Go to ${tab.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 md:w-7 md:h-7 stroke-[2.5] ${
                  isActive ? tab.color : 'text-slate-400'
                }`}
              />
              <span className="text-xs md:text-sm mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
