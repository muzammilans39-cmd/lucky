import React, { useState } from 'react';
import {
  Bell,
  AlarmClock,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  Volume2,
  Clock,
  Calendar,
  Sparkles,
  Play,
  RotateCcw,
  X,
  VolumeX,
} from 'lucide-react';
import { Reminder, Alarm } from '../types';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface RemindersAlarmsScreenProps {
  reminders: Reminder[];
  alarms: Alarm[];
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onAddAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  onTestAlarmTrigger: (alarm: Alarm) => void;
}

export const RemindersAlarmsScreen: React.FC<RemindersAlarmsScreenProps> = ({
  reminders,
  alarms,
  onToggleReminder,
  onDeleteReminder,
  onAddReminder,
  onToggleAlarm,
  onDeleteAlarm,
  onAddAlarm,
  onTestAlarmTrigger,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reminders' | 'alarms'>('reminders');

  // Add Reminder Modal state
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newRemTitle, setNewRemTitle] = useState('');
  const [newRemDate, setNewRemDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRemTime, setNewRemTime] = useState('09:00 AM');
  const [newRemRecurrence, setNewRemRecurrence] = useState<'none' | 'daily' | 'weekly'>('none');

  // Add Alarm Modal state
  const [showAddAlarmModal, setShowAddAlarmModal] = useState(false);
  const [newAlarmTime, setNewAlarmTime] = useState('07:30 AM');
  const [newAlarmLabel, setNewAlarmLabel] = useState('Morning Medicine & Stretch');
  const [newAlarmDays, setNewAlarmDays] = useState<string[]>(['Daily']);

  // Speak a reminder out loud
  const speakReminder = (rem: Reminder) => {
    sound.playTap();
    speech.speakText(
      `Reminder: ${rem.title}. Scheduled for ${rem.date} at ${rem.time}.${
        rem.completed ? ' This reminder is already completed.' : ' This reminder is pending.'
      }`
    );
  };

  // Speak an alarm out loud
  const speakAlarm = (alm: Alarm) => {
    sound.playTap();
    speech.speakText(
      `Alarm for ${alm.time}, named ${alm.label}. It is currently ${
        alm.enabled ? 'turned ON' : 'turned OFF'
      }, repeating on ${alm.days.join(', ')}.`
    );
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemTitle.trim()) return;

    sound.playSuccess();
    onAddReminder({
      title: newRemTitle.trim(),
      date: newRemDate,
      time: newRemTime,
      recurrence: newRemRecurrence,
      completed: false,
      priority: 'normal',
    });

    speech.speakText(`Added reminder: ${newRemTitle} for ${newRemTime}.`);
    setNewRemTitle('');
    setShowAddReminderModal(false);
  };

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    onAddAlarm({
      time: newAlarmTime,
      label: newAlarmLabel.trim() || 'Alarm',
      days: newAlarmDays,
      enabled: true,
    });

    speech.speakText(`Set alarm for ${newAlarmTime}.`);
    setShowAddAlarmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Large Segmented Tab Switcher */}
      <div className="grid grid-cols-2 gap-3 p-2 bg-slate-900 border-2 border-slate-800 rounded-3xl">
        <button
          onClick={() => {
            sound.playTap();
            setActiveSubTab('reminders');
          }}
          className={`py-4 px-6 rounded-2xl font-black text-xl md:text-2xl flex items-center justify-center gap-3 transition-all ${
            activeSubTab === 'reminders'
              ? 'bg-sky-400 text-slate-950 shadow-xl border-2 border-sky-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          aria-label="View Reminders"
        >
          <Bell className="w-7 h-7 stroke-[2.5]" />
          <span>Reminders ({reminders.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveSubTab('alarms');
          }}
          className={`py-4 px-6 rounded-2xl font-black text-xl md:text-2xl flex items-center justify-center gap-3 transition-all ${
            activeSubTab === 'alarms'
              ? 'bg-amber-400 text-slate-950 shadow-xl border-2 border-amber-300'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          aria-label="View Alarms"
        >
          <AlarmClock className="w-7 h-7 stroke-[2.5]" />
          <span>Alarms ({alarms.length})</span>
        </button>
      </div>

      {/* ================= SECTION 1: REMINDERS ================= */}
      {activeSubTab === 'reminders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                <Bell className="w-8 h-8 text-sky-400" />
                <span>Daily Reminders</span>
              </h2>
              <p className="text-slate-300 text-base md:text-lg">
                Tap the circle to mark done, or tap the speaker to hear it.
              </p>
            </div>

            {/* Big Add Reminder Button */}
            <button
              onClick={() => {
                sound.playTap();
                setShowAddReminderModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-sky-400 hover:bg-sky-300 active:bg-sky-500 text-slate-950 font-black rounded-2xl border-2 border-sky-300 shadow-xl text-lg md:text-xl"
              aria-label="Add a new reminder"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
              <span>Add Reminder</span>
            </button>
          </div>

          {/* Reminders List */}
          <div className="space-y-3">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-5 rounded-3xl border-3 transition-all shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  rem.completed
                    ? 'bg-slate-900/90 border-slate-700 opacity-75'
                    : 'bg-slate-800/95 border-sky-400/80 shadow-sky-950/20'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => {
                      sound.playSuccess();
                      onToggleReminder(rem.id);
                    }}
                    className={`mt-1 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border-3 transition-all ${
                      rem.completed
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-400 hover:border-sky-400 bg-slate-900'
                    }`}
                    aria-label={
                      rem.completed
                        ? `Mark ${rem.title} as incomplete`
                        : `Mark ${rem.title} as completed`
                    }
                  >
                    {rem.completed ? (
                      <CheckCircle className="w-6 h-6 stroke-[3]" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-500" />
                    )}
                  </button>

                  <div>
                    <h3
                      className={`text-xl md:text-2xl font-black ${
                        rem.completed
                          ? 'line-through text-slate-400'
                          : 'text-white'
                      }`}
                    >
                      {rem.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-base md:text-lg">
                      <span className="font-bold text-sky-300 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {rem.time}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300 flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {rem.date}
                      </span>
                      {rem.recurrence && rem.recurrence !== 'none' && (
                        <span className="text-xs uppercase bg-sky-950 text-sky-300 border border-sky-600 px-2 py-0.5 rounded-full font-bold">
                          Repeats {rem.recurrence}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => speakReminder(rem)}
                    className="p-3 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-xl border border-slate-600"
                    aria-label={`Read reminder ${rem.title} aloud`}
                    title="Read aloud"
                  >
                    <Volume2 className="w-6 h-6 stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => {
                      sound.playTap();
                      onDeleteReminder(rem.id);
                    }}
                    className="p-3 bg-slate-700 hover:bg-red-900/60 text-red-400 rounded-xl border border-slate-600 hover:border-red-500"
                    aria-label={`Delete reminder ${rem.title}`}
                    title="Delete"
                  >
                    <Trash2 className="w-6 h-6 stroke-[2]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 2: ALARMS ================= */}
      {activeSubTab === 'alarms' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                <AlarmClock className="w-8 h-8 text-amber-400" />
                <span>Wakeup & Medication Alarms</span>
              </h2>
              <p className="text-slate-300 text-base md:text-lg">
                Clear toggle switches, loud ringers, and repeat options.
              </p>
            </div>

            {/* Big Add Alarm Button */}
            <button
              onClick={() => {
                sound.playTap();
                setShowAddAlarmModal(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black rounded-2xl border-2 border-amber-300 shadow-xl text-lg md:text-xl"
              aria-label="Add a new alarm"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
              <span>Add Alarm</span>
            </button>
          </div>

          {/* Alarms List */}
          <div className="space-y-3">
            {alarms.map((alm) => (
              <div
                key={alm.id}
                className={`p-5 rounded-3xl border-3 transition-all shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  alm.enabled
                    ? 'bg-slate-800/95 border-amber-400'
                    : 'bg-slate-900/90 border-slate-700 opacity-70'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Large Clock Digits */}
                  <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight">
                    {alm.time}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-amber-300">
                      {alm.label}
                    </h3>
                    <div className="text-slate-300 text-base flex items-center gap-2 mt-0.5">
                      <span>Repeats:</span>
                      <span className="font-bold text-slate-100">{alm.days.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Right controls: ON/OFF toggle, Test Ring, Delete */}
                <div className="flex items-center flex-wrap gap-2.5 self-end md:self-center">
                  {/* Big Toggle Switch */}
                  <button
                    onClick={() => {
                      sound.playTap();
                      onToggleAlarm(alm.id);
                    }}
                    className={`px-5 py-3 rounded-2xl font-black text-base md:text-lg border-2 transition-all flex items-center gap-2 ${
                      alm.enabled
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md'
                        : 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}
                    aria-label={`Toggle alarm for ${alm.time}. Currently ${
                      alm.enabled ? 'ON' : 'OFF'
                    }`}
                  >
                    <span>{alm.enabled ? 'ALARM ON' : 'ALARM OFF'}</span>
                  </button>

                  {/* Test Ring Button */}
                  <button
                    onClick={() => {
                      sound.playAlarmBeep();
                      onTestAlarmTrigger(alm);
                    }}
                    className="p-3 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-xl border border-slate-600 font-bold flex items-center gap-1.5"
                    aria-label={`Test ringer for ${alm.label}`}
                    title="Test alarm sound"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span className="text-sm">Test</span>
                  </button>

                  {/* Speak details */}
                  <button
                    onClick={() => speakAlarm(alm)}
                    className="p-3 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-xl border border-slate-600"
                    aria-label="Read alarm details aloud"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      sound.playTap();
                      onDeleteAlarm(alm.id);
                    }}
                    className="p-3 bg-slate-700 hover:bg-red-900/60 text-red-400 rounded-xl border border-slate-600"
                    aria-label={`Delete alarm ${alm.label}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD REMINDER ================= */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border-3 border-sky-400 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Bell className="w-7 h-7 text-sky-400" />
                Add New Reminder
              </h3>
              <button
                onClick={() => setShowAddReminderModal(false)}
                className="p-2 text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  What should we remind you of?
                </label>
                <input
                  type="text"
                  required
                  value={newRemTitle}
                  onChange={(e) => setNewRemTitle(e.target.value)}
                  placeholder="e.g. Take Blood Pressure Medication"
                  className="w-full p-4 bg-slate-800 border-2 border-slate-700 focus:border-sky-400 text-white rounded-xl text-lg font-bold"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
                  Quick Suggestions:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Medicine Reminder', 'Drink Water', 'Call Family', 'Check Blood Sugar'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewRemTitle(preset)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold rounded-lg border border-slate-600 text-sm"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-black text-lg mb-1">Date</label>
                  <input
                    type="date"
                    value={newRemDate}
                    onChange={(e) => setNewRemDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-200 font-black text-lg mb-1">Time</label>
                  <input
                    type="text"
                    value={newRemTime}
                    onChange={(e) => setNewRemTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">Recurrence</label>
                <select
                  value={newRemRecurrence}
                  onChange={(e: any) => setNewRemRecurrence(e.target.value)}
                  className="w-full p-3.5 bg-slate-800 border-2 border-slate-700 text-white rounded-xl text-base font-bold"
                >
                  <option value="none">One-time only</option>
                  <option value="daily">Repeats Daily</option>
                  <option value="weekly">Repeats Weekly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black rounded-2xl text-lg border-2 border-sky-300 shadow-lg"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD ALARM ================= */}
      {showAddAlarmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border-3 border-amber-400 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <AlarmClock className="w-7 h-7 text-amber-400" />
                Add New Alarm
              </h3>
              <button
                onClick={() => setShowAddAlarmModal(false)}
                className="p-2 text-slate-400 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <form onSubmit={handleCreateAlarm} className="space-y-4">
              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Alarm Time
                </label>
                <input
                  type="text"
                  required
                  value={newAlarmTime}
                  onChange={(e) => setNewAlarmTime(e.target.value)}
                  placeholder="e.g. 07:30 AM"
                  className="w-full p-4 bg-slate-800 border-2 border-slate-700 focus:border-amber-400 text-white rounded-xl text-2xl font-mono font-black text-center"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Alarm Label / Purpose
                </label>
                <input
                  type="text"
                  required
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  placeholder="e.g. Morning Wakeup, Blood Pressure Medication"
                  className="w-full p-4 bg-slate-800 border-2 border-slate-700 focus:border-amber-400 text-white rounded-xl text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-black text-lg mb-1">
                  Repeat Schedule
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAlarmDays(['Daily'])}
                    className={`py-3 px-4 rounded-xl font-bold text-base border-2 ${
                      newAlarmDays.includes('Daily')
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Every Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAlarmDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
                    className={`py-3 px-4 rounded-xl font-bold text-base border-2 ${
                      newAlarmDays.includes('Mon')
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Weekdays Only
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAlarmModal(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-lg border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-lg border-2 border-amber-300 shadow-lg"
                >
                  Save Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
