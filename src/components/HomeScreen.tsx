import React from 'react';
import {
  Mic,
  PhoneCall,
  Bell,
  Calendar,
  ClipboardList,
  Clock,
  Sparkles,
  ChevronRight,
  Volume2,
  AlertOctagon,
  Pill,
  MapPin,
  Database,
  Download,
  Ear,
  Settings,
  Sliders,
} from 'lucide-react';
import { AppTab, Reminder, Appointment } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';
import { WeatherCard } from './WeatherCard';
import { DailyAffirmationCard } from './DailyAffirmationCard';
import { DeviceStatusDashboard } from './DeviceStatusDashboard';
import { StepTrackerCard } from './StepTrackerCard';

interface HomeScreenProps {
  onNavigate: (tab: AppTab) => void;
  nextReminder?: Reminder;
  nextAppointment?: Appointment;
  onOpenVoiceAssistant: () => void;
  onTriggerSOS?: () => void;
  onShareLocation?: () => void;
  onOpenBackup?: () => void;
  onOpenSettings?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  nextReminder,
  nextAppointment,
  onOpenVoiceAssistant,
  onTriggerSOS,
  onShareLocation,
  onOpenBackup,
  onOpenSettings,
}) => {
  // Format current readable date
  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const handleMicClick = () => {
    sound.playMicStart();
    onOpenVoiceAssistant();
  };

  const handleTileClick = (tab: AppTab) => {
    sound.playTap();
    onNavigate(tab);
  };

  // Speak next upcoming item
  const speakUpcoming = () => {
    sound.playTap();
    if (nextReminder) {
      speech.speakText(`Your next reminder is: ${nextReminder.title}, scheduled for ${nextReminder.time}.`);
    } else if (nextAppointment) {
      speech.speakText(`Your next appointment is: ${nextAppointment.title}, at ${nextAppointment.time}.`);
    } else {
      speech.speakText('You have no immediate upcoming reminders or appointments today. You are all set!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Date Greeting */}
      <div className="bg-slate-800/80 border-2 border-slate-700 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-amber-400 font-bold tracking-wide uppercase text-sm md:text-base flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4" /> Welcome to AssistAI
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Today is {todayStr}
          </h2>
          <p className="text-slate-300 text-base md:text-lg mt-1">
            Voice-first assistant built for simplicity, high contrast, and peace of mind.
          </p>
        </div>

        {/* Action Buttons: Emergency SOS, Share Location, & Voice Assistant */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {onTriggerSOS && (
            <button
              onClick={() => {
                onTriggerSOS();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black rounded-2xl shadow-xl shadow-red-950/40 border-3 border-red-300 transition-all text-base md:text-lg animate-pulse hover:animate-none"
              aria-label="Emergency SOS: Press to trigger loud alarm and alert family contact"
            >
              <AlertOctagon className="w-6 h-6 stroke-[3]" />
              <span>SOS</span>
            </button>
          )}

          {onShareLocation && (
            <button
              onClick={() => {
                sound.playTap();
                onShareLocation();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-black rounded-2xl shadow-xl shadow-sky-950/30 border-3 border-sky-300 transition-all text-base md:text-lg"
              aria-label="Share Location: Send current GPS coordinates to emergency contact"
            >
              <MapPin className="w-6 h-6 stroke-[2.5]" />
              <span>Share Location</span>
            </button>
          )}

          {/* Quick Voice Assistant Mic Hero Button */}
          <button
            onClick={handleMicClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 border-4 border-amber-300 transition-all text-base md:text-lg mic-active-pulse"
            aria-label="Tap to speak to voice assistant"
          >
            <Mic className="w-6 h-6 stroke-[2.5]" />
            <span>Tap to Speak</span>
          </button>
        </div>
      </div>

      {/* Accessible Weather Forecast Card */}
      <WeatherCard />

      {/* Daily Uplifting Affirmation Card */}
      <DailyAffirmationCard />

      {/* Device Battery & Connectivity Status Dashboard */}
      <DeviceStatusDashboard />

      {/* Daily Physical Activity & Step Tracker */}
      <StepTrackerCard />

      {/* Next Upcoming Reminder / Event Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 border-3 border-amber-400/80 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 font-black text-sm uppercase rounded-lg">
              <Clock className="w-4 h-4 stroke-[2.5]" />
              <span>Next Upcoming Item</span>
            </div>

            {nextReminder ? (
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
                  {nextReminder.title}
                </h3>
                <p className="text-amber-300 text-lg md:text-xl font-bold flex items-center gap-2 mt-1">
                  <span>⏰ Scheduled: {nextReminder.time}</span>
                  {nextReminder.recurrence === 'daily' && (
                    <span className="text-xs bg-slate-800 text-slate-200 border border-slate-600 px-2 py-0.5 rounded-full font-medium">
                      Repeats Daily
                    </span>
                  )}
                </p>
              </div>
            ) : nextAppointment ? (
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-white mt-1">
                  {nextAppointment.title}
                </h3>
                <p className="text-amber-300 text-lg md:text-xl font-bold flex items-center gap-2 mt-1">
                  <span>📅 {nextAppointment.date} at {nextAppointment.time}</span>
                  {nextAppointment.location && (
                    <span className="text-slate-300 text-sm">📍 {nextAppointment.location}</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-slate-300 text-xl font-medium mt-1">
                No immediate reminders pending. Relax and enjoy your day!
              </p>
            )}
          </div>

          {/* Read Aloud button for upcoming item */}
          <button
            onClick={speakUpcoming}
            className="flex-shrink-0 p-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-amber-300 border-2 border-amber-400/50 rounded-2xl shadow-lg transition-transform active:scale-95"
            aria-label="Speak upcoming item aloud"
            title="Read upcoming item aloud"
          >
            <Volume2 className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main 5 Large Options Grid */}
      <div>
        <h3 className="text-xl md:text-2xl font-black text-slate-200 mb-4 flex items-center gap-2">
          <span>Main Activities</span>
          <span className="text-sm font-normal text-slate-400">(Tap any large card)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. AI Assistant */}
          <button
            onClick={() => handleTileClick('assistant')}
            className="group text-left p-6 bg-slate-850 hover:bg-slate-800 active:bg-slate-750 bg-slate-800/90 border-3 border-amber-400 rounded-3xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4"
            aria-label="Open AI Assistant to talk or give voice commands"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <Mic className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-white block group-hover:text-amber-300 transition-colors">
                  🎙️ AI Assistant
                </span>
                <span className="text-slate-300 text-base md:text-lg block mt-1">
                  Speak to set reminders, ask schedule, or get answers
                </span>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* 2. Medication Tracker */}
          <button
            onClick={() => handleTileClick('medications')}
            className="group text-left p-6 bg-slate-800/90 hover:bg-slate-800 active:bg-slate-750 border-3 border-emerald-400 rounded-3xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4"
            aria-label="Open Medication Tracker to log doses and view history"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <Pill className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-white block group-hover:text-emerald-300 transition-colors">
                  💊 Medications
                </span>
                <span className="text-slate-300 text-base md:text-lg block mt-1">
                  Log doses, see taken vs missed pills & set reminders
                </span>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-emerald-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* 3. Call Analysis */}
          <button
            onClick={() => handleTileClick('call-analysis')}
            className="group text-left p-6 bg-slate-800/90 hover:bg-slate-800 active:bg-slate-750 border-3 border-teal-400 rounded-3xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4"
            aria-label="Open Call Recording and Analysis"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <PhoneCall className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-white block group-hover:text-emerald-300 transition-colors">
                  📞 Call Analysis
                </span>
                <span className="text-slate-300 text-base md:text-lg block mt-1">
                  Record call, summarize, extract dates, names & tasks
                </span>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-emerald-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* 3. Reminders & Alarms */}
          <button
            onClick={() => handleTileClick('reminders-alarms')}
            className="group text-left p-6 bg-slate-800/90 hover:bg-slate-800 active:bg-slate-750 border-3 border-sky-400 rounded-3xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4"
            aria-label="Open Reminders and Alarms"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <Bell className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-white block group-hover:text-sky-300 transition-colors">
                  ⏰ Reminders & Alarms
                </span>
                <span className="text-slate-300 text-base md:text-lg block mt-1">
                  Medicine timers, daily habits & morning wakeups
                </span>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-sky-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* 4. Appointments */}
          <button
            onClick={() => handleTileClick('appointments')}
            className="group text-left p-6 bg-slate-800/90 hover:bg-slate-800 active:bg-slate-750 border-3 border-purple-400 rounded-3xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4"
            aria-label="Open Appointments, Doctor visits, and Travel"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <Calendar className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-white block group-hover:text-purple-300 transition-colors">
                  📅 Appointments
                </span>
                <span className="text-slate-300 text-base md:text-lg block mt-1">
                  Doctor visits, family trips, travel tickets & meetings
                </span>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-purple-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* 5. Daily Planner (Full-width card) */}
          <button
            onClick={() => handleTileClick('planner')}
            className="group text-left p-6 md:col-span-2 bg-slate-800/90 hover:bg-slate-800 active:bg-slate-750 border-3 border-orange-400 rounded-3xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4"
            aria-label="Open Today's Daily Planner"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <ClipboardList className="w-9 h-9 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-white block group-hover:text-orange-300 transition-colors">
                  📋 Daily Planner
                </span>
                <span className="text-slate-300 text-base md:text-lg block mt-1">
                  See today's full agenda: alarms, reminders, travel, and appointments
                </span>
              </div>
            </div>
            <ChevronRight className="w-8 h-8 text-orange-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* 6. Data Backup & Device Migration (Full-width card) */}
          {onOpenBackup && (
            <button
              onClick={() => {
                sound.playTap();
                onOpenBackup();
              }}
              className="group text-left p-6 md:col-span-2 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border-3 border-amber-400/90 rounded-3xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4"
              aria-label="Open Data Backup to export or import reminders, appointments, and medication logs"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                  <Database className="w-9 h-9 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-black text-white block group-hover:text-amber-300 transition-colors">
                      💾 Data Backup & Restore
                    </span>
                    <span className="text-xs uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                      JSON Safe
                    </span>
                  </div>
                  <span className="text-slate-300 text-base md:text-lg block mt-1">
                    Export reminders, events & medication logs to JSON or import on a new device
                  </span>
                </div>
              </div>
              <ChevronRight className="w-8 h-8 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>
          )}

          {/* 7. Hearing Volume Booster & Settings Card */}
          {onOpenSettings && (
            <button
              onClick={() => {
                sound.playTap();
                onOpenSettings();
              }}
              className="group text-left p-6 md:col-span-2 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border-3 border-emerald-400/90 rounded-3xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4"
              aria-label="Open Settings and Hearing Volume Booster"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                  <Ear className="w-9 h-9 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-black text-white block group-hover:text-emerald-300 transition-colors">
                      🔊 Hearing Volume Booster & Settings
                    </span>
                    <span className="text-xs uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                      Amplifier
                    </span>
                  </div>
                  <span className="text-slate-300 text-base md:text-lg block mt-1">
                    Amplify speech, chimes & alarms up to 250% for hearing accessibility
                  </span>
                </div>
              </div>
              <ChevronRight className="w-8 h-8 text-emerald-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
