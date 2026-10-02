import React from 'react';
import {
  ClipboardList,
  Volume2,
  Clock,
  CheckCircle,
  Circle,
  Bell,
  AlarmClock,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Reminder, Alarm, Appointment } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface DailyPlannerScreenProps {
  reminders: Reminder[];
  alarms: Alarm[];
  appointments: Appointment[];
  onToggleReminder: (id: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DailyPlannerScreen: React.FC<DailyPlannerScreenProps> = ({
  reminders,
  alarms,
  appointments,
  onToggleReminder,
  onNavigateTab,
}) => {
  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const todayIso = new Date().toISOString().split('T')[0];

  // Filter today's items
  const todayReminders = reminders.filter(
    (r) => r.date === todayIso || r.recurrence === 'daily'
  );
  const activeAlarms = alarms.filter((a) => a.enabled);
  const todayAppointments = appointments.filter((a) => a.date === todayIso);

  const completedCount = todayReminders.filter((r) => r.completed).length;
  const pendingCount = todayReminders.filter((r) => !r.completed).length;

  // Read entire daily planner schedule aloud
  const handleReadScheduleAloud = () => {
    sound.playTap();

    let speechSummary = `Here is your full daily planner for today, ${todayStr}. `;

    if (activeAlarms.length > 0) {
      speechSummary += `You have ${activeAlarms.length} active alarms: ${activeAlarms
        .map((a) => `${a.label} at ${a.time}`)
        .join(', ')}. `;
    }

    if (todayAppointments.length > 0) {
      speechSummary += `You have ${todayAppointments.length} appointments scheduled: ${todayAppointments
        .map((a) => `${a.title} at ${a.time}`)
        .join(', ')}. `;
    } else {
      speechSummary += `You have no medical or travel appointments today. `;
    }

    if (todayReminders.length > 0) {
      speechSummary += `You have ${todayReminders.length} reminders: ${todayReminders
        .map((r) => `${r.title} at ${r.time}, ${r.completed ? 'already completed' : 'still pending'}`)
        .join('. ')}. `;
    } else {
      speechSummary += `You have no reminders pending today. `;
    }

    speechSummary += `You are all caught up on your schedule!`;
    speech.speakText(speechSummary);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Read Schedule Aloud */}
      <div className="bg-gradient-to-r from-orange-950/80 to-slate-900 border-3 border-orange-400 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <span className="text-orange-400 font-bold uppercase text-xs md:text-sm tracking-wide flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4" /> Comprehensive Daily Overview
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            Daily Planner
          </h2>
          <p className="text-amber-200 text-lg md:text-xl font-bold mt-1">
            📅 {todayStr}
          </p>
          <div className="flex items-center gap-4 mt-2 text-slate-300 text-base md:text-lg">
            <span>✅ {completedCount} Done</span>
            <span>•</span>
            <span>⏳ {pendingCount} Pending Reminders</span>
            <span>•</span>
            <span>⏰ {activeAlarms.length} Alarms On</span>
          </div>
        </div>

        {/* Big Read Aloud Button */}
        <button
          onClick={handleReadScheduleAloud}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-orange-400 hover:bg-orange-300 active:bg-orange-500 text-slate-950 font-black rounded-2xl border-2 border-orange-300 shadow-xl text-lg md:text-xl"
          aria-label="Read today's entire schedule aloud"
        >
          <Volume2 className="w-7 h-7 stroke-[2.5]" />
          <span>Read Today's Schedule</span>
        </button>
      </div>

      {/* Grid of Sections: Alarms, Appointments, Reminders */}
      <div className="space-y-6">
        {/* 1. Alarms Section */}
        <div className="bg-slate-800/90 border-2 border-slate-700 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <AlarmClock className="w-7 h-7 text-amber-400" />
              <span>Today's Alarms</span>
            </h3>
            <button
              onClick={() => onNavigateTab('reminders-alarms')}
              className="text-amber-400 hover:text-amber-300 text-sm font-bold flex items-center gap-1"
            >
              <span>Manage Alarms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {activeAlarms.length === 0 ? (
            <p className="text-slate-400 text-lg">No active alarms for today.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeAlarms.map((alm) => (
                <div
                  key={alm.id}
                  className="p-4 bg-slate-900 border-2 border-amber-400/60 rounded-2xl flex items-center justify-between gap-3 shadow-md"
                >
                  <div>
                    <span className="text-2xl font-mono font-black text-amber-300 block">
                      {alm.time}
                    </span>
                    <span className="text-lg font-bold text-white block mt-0.5">
                      {alm.label}
                    </span>
                  </div>
                  <span className="text-xs uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500 px-2 py-1 rounded-md font-bold">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Appointments & Meetings & Travel for Today */}
        <div className="bg-slate-800/90 border-2 border-slate-700 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <Calendar className="w-7 h-7 text-purple-400" />
              <span>Today's Appointments & Travel</span>
            </h3>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-purple-400 hover:text-purple-300 text-sm font-bold flex items-center gap-1"
            >
              <span>View All Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <p className="text-slate-300 text-lg">
                No appointments or trips scheduled for today.
              </p>
              <p className="text-slate-400 text-sm mt-1">
                (Check the Appointments tab for upcoming trips & doctor visits this week.)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 bg-slate-900 border-2 border-purple-400 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
                >
                  <div>
                    <span className="text-xs uppercase bg-purple-950 text-purple-300 border border-purple-500 px-2.5 py-0.5 rounded-md font-bold">
                      {apt.category}
                    </span>
                    <h4 className="text-2xl font-black text-white mt-1">
                      {apt.title}
                    </h4>
                    <p className="text-amber-300 text-lg font-bold flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{apt.time}</span>
                      {apt.location && <span className="text-slate-300">• 📍 {apt.location}</span>}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      sound.playTap();
                      speech.speakText(
                        `Today's appointment: ${apt.title} at ${apt.time}${
                          apt.location ? ` at ${apt.location}` : ''
                        }`
                      );
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 self-end sm:self-center"
                    aria-label="Read appointment aloud"
                  >
                    <Volume2 className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Today's Reminders & Tasks */}
        <div className="bg-slate-800/90 border-2 border-slate-700 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-sky-400" />
              <span>Today's Reminders & Medication Tasks</span>
            </h3>
            <button
              onClick={() => onNavigateTab('reminders-alarms')}
              className="text-sky-400 hover:text-sky-300 text-sm font-bold flex items-center gap-1"
            >
              <span>Add / Edit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {todayReminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                  rem.completed
                    ? 'bg-slate-900/80 border-slate-700 opacity-70'
                    : 'bg-slate-900 border-sky-400 shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      sound.playSuccess();
                      onToggleReminder(rem.id);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${
                      rem.completed
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-500 bg-slate-800 hover:border-sky-400'
                    }`}
                    aria-label={
                      rem.completed
                        ? `Mark ${rem.title} as incomplete`
                        : `Mark ${rem.title} as completed`
                    }
                  >
                    {rem.completed ? (
                      <CheckCircle className="w-5 h-5 stroke-[3]" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <div>
                    <span
                      className={`text-xl font-bold block ${
                        rem.completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {rem.title}
                    </span>
                    <span className="text-sky-300 text-base font-bold flex items-center gap-1 mt-0.5">
                      <Clock className="w-4 h-4" /> {rem.time}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playTap();
                    speech.speakText(
                      `Reminder: ${rem.title} at ${rem.time}. Status: ${
                        rem.completed ? 'Completed' : 'Pending'
                      }`
                    );
                  }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700"
                  aria-label="Read reminder aloud"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
