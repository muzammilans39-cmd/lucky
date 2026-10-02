/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { AssistantScreen } from './components/AssistantScreen';
import { CallAnalysisScreen } from './components/CallAnalysisScreen';
import { RemindersAlarmsScreen } from './components/RemindersAlarmsScreen';
import { AppointmentsScreen } from './components/AppointmentsScreen';
import { DailyPlannerScreen } from './components/DailyPlannerScreen';
import { MedicationsScreen } from './components/MedicationsScreen';
import { BottomNav } from './components/BottomNav';
import { AlarmRingerModal } from './components/AlarmRingerModal';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { ShareLocationModal } from './components/ShareLocationModal';
import { DataBackupModal } from './components/DataBackupModal';
import { SettingsPanelModal } from './components/SettingsPanelModal';
import {
  AppTab,
  Reminder,
  Alarm,
  Appointment,
  CallAnalysisRecord,
  HighContrastTheme,
  FontSizeScale,
  EmergencyContact,
  Medication,
  DoseLog,
  BackupDataBundle,
} from './types';
import { storage } from './utils/storage';
import { speech } from './utils/speechEngine';
import { sound } from './utils/audioFeedback';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [theme, setTheme] = useState<HighContrastTheme>(() => storage.getTheme());
  const [fontScale, setFontScale] = useState<FontSizeScale>(() => storage.getFontScale());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Core Data
  const [reminders, setReminders] = useState<Reminder[]>(() => storage.getReminders());
  const [appointments, setAppointments] = useState<Appointment[]>(() => storage.getAppointments());
  const [alarms, setAlarms] = useState<Alarm[]>(() => storage.getAlarms());
  const [callHistory, setCallHistory] = useState<CallAnalysisRecord[]>(() => storage.getCallHistory());

  // Medication Tracking Data
  const [medications, setMedications] = useState<Medication[]>(() => storage.getMedications());
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(() => storage.getDoseLogs());

  // Emergency SOS & Location Sharing State
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(() =>
    storage.getEmergencyContact()
  );
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isShareLocationOpen, setIsShareLocationOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Active Alarm triggering
  const [ringingAlarm, setRingingAlarm] = useState<Alarm | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    storage.saveReminders(reminders);
  }, [reminders]);

  useEffect(() => {
    storage.saveAppointments(appointments);
  }, [appointments]);

  useEffect(() => {
    storage.saveAlarms(alarms);
  }, [alarms]);

  useEffect(() => {
    storage.saveCallHistory(callHistory);
  }, [callHistory]);

  useEffect(() => {
    storage.saveEmergencyContact(emergencyContact);
  }, [emergencyContact]);

  useEffect(() => {
    storage.saveMedications(medications);
  }, [medications]);

  useEffect(() => {
    storage.saveDoseLogs(doseLogs);
  }, [doseLogs]);

  useEffect(() => {
    storage.saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    storage.saveFontScale(fontScale);
  }, [fontScale]);

  // Next upcoming reminder or appointment
  const nextPendingReminder = reminders.find((r) => !r.completed);
  const nextAppointment = appointments[0];

  // Actions for Reminders
  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddReminder = (newRem: Omit<Reminder, 'id' | 'createdAt'>) => {
    const item: Reminder = {
      ...newRem,
      id: 'rem-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [item, ...prev]);
  };

  // Actions for Alarms
  const handleToggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddAlarm = (newAlarm: Omit<Alarm, 'id'>) => {
    const item: Alarm = {
      ...newAlarm,
      id: 'alm-' + Date.now(),
    };
    setAlarms((prev) => [...prev, item]);
  };

  // Actions for Appointments
  const handleAddAppointment = (newApt: Omit<Appointment, 'id'>) => {
    const item: Appointment = {
      ...newApt,
      id: 'apt-' + Date.now(),
    };
    setAppointments((prev) => [item, ...prev]);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  // Actions for Call History
  const handleSaveAnalysisRecord = (record: CallAnalysisRecord) => {
    setCallHistory((prev) => [record, ...prev]);
  };

  // Actions for Medications
  const handleAddMedication = (newMed: Omit<Medication, 'id'>) => {
    const item: Medication = {
      ...newMed,
      id: 'med-' + Date.now(),
    };
    setMedications((prev) => [item, ...prev]);

    // Also automatically create a daily medicine reminder so it appears in alarms & planner
    newMed.times.forEach((t) => {
      handleAddReminder({
        title: `Take ${newMed.name} (${newMed.dosage})`,
        date: new Date().toISOString().split('T')[0],
        time: t,
        recurrence: 'daily',
        completed: false,
        priority: 'high',
      });
    });
  };

  const handleDeleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const handleLogDose = (newLog: Omit<DoseLog, 'id' | 'recordedAt'>) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logItem: DoseLog = {
      ...newLog,
      id: 'log-' + Date.now(),
      recordedAt: timeStr,
    };
    setDoseLogs((prev) => [logItem, ...prev]);

    // If taken, decrement refill count by 1
    if (newLog.status === 'taken') {
      setMedications((prev) =>
        prev.map((m) =>
          m.id === newLog.medicationId
            ? { ...m, refillRemaining: Math.max(0, m.refillRemaining - 1) }
            : m
        )
      );
    }
  };

  const handleUpdateMedication = (updatedMed: Medication) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === updatedMed.id ? updatedMed : m))
    );
  };

  const handleUndoDoseLog = (logId: string) => {
    setDoseLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  const handleRestoreData = (backup: BackupDataBundle, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      if (backup.reminders) setReminders(backup.reminders);
      if (backup.appointments) setAppointments(backup.appointments);
      if (backup.medications) setMedications(backup.medications);
      if (backup.doseLogs) setDoseLogs(backup.doseLogs);
      if (backup.alarms) setAlarms(backup.alarms);
      if (backup.emergencyContact) setEmergencyContact(backup.emergencyContact);
      if (backup.callHistory) setCallHistory(backup.callHistory);
    } else {
      // Merge mode: deduplicate by id
      if (backup.reminders?.length) {
        setReminders((prev) => {
          const ids = new Set(prev.map((r) => r.id));
          return [...prev, ...backup.reminders.filter((r) => !ids.has(r.id))];
        });
      }
      if (backup.appointments?.length) {
        setAppointments((prev) => {
          const ids = new Set(prev.map((a) => a.id));
          return [...prev, ...backup.appointments.filter((a) => !ids.has(a.id))];
        });
      }
      if (backup.medications?.length) {
        setMedications((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return [...prev, ...backup.medications.filter((m) => !ids.has(m.id))];
        });
      }
      if (backup.doseLogs?.length) {
        setDoseLogs((prev) => {
          const ids = new Set(prev.map((d) => d.id));
          return [...prev, ...backup.doseLogs.filter((d) => !ids.has(d.id))];
        });
      }
      if (backup.alarms?.length) {
        setAlarms((prev) => {
          const ids = new Set(prev.map((al) => al.id));
          return [...prev, ...backup.alarms!.filter((al) => !ids.has(al.id))];
        });
      }
      if (backup.callHistory?.length) {
        setCallHistory((prev) => {
          const ids = new Set(prev.map((c) => c.id));
          return [...prev, ...backup.callHistory!.filter((c) => !ids.has(c.id))];
        });
      }
      if (backup.emergencyContact) {
        setEmergencyContact(backup.emergencyContact);
      }
    }

    if (backup.macros?.length) {
      try {
        localStorage.setItem('assistai_voice_macros_v1', JSON.stringify(backup.macros));
      } catch {}
    }
    if (backup.stepData) {
      try {
        localStorage.setItem('assistai_step_tracker_v1', JSON.stringify(backup.stepData));
      } catch {}
    }
  };

  // Global "Read Screen Aloud" implementation
  const handleReadCurrentScreen = () => {
    let screenSpeech = '';

    if (currentTab === 'home') {
      const today = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date());

      screenSpeech = `You are on the Home screen. Today is ${today}. `;
      if (nextPendingReminder) {
        screenSpeech += `Your next upcoming reminder is: ${nextPendingReminder.title} at ${nextPendingReminder.time}. `;
      } else if (nextAppointment) {
        screenSpeech += `Your next appointment is: ${nextAppointment.title} at ${nextAppointment.time}. `;
      }
      screenSpeech += `You have main options on screen: AI Assistant, Medications Tracker, Call Analysis, Reminders and Alarms, Appointments, and Daily Planner.`;
    } else if (currentTab === 'medications') {
      const todayIso = new Date().toISOString().split('T')[0];
      const takenToday = doseLogs.filter(
        (l) => l.scheduledDate === todayIso && l.status === 'taken'
      ).length;
      screenSpeech = `You are on the Medication Manager screen. You have ${medications.length} active prescriptions. Today, you have logged ${takenToday} doses as taken. Tap any medication card to mark it as taken or read full instructions.`;
    } else if (currentTab === 'assistant') {
      screenSpeech = `You are on the AssistAI Voice Assistant screen. Tap the large microphone in the center to speak your command, or select one of the suggested questions. You can ask for reminders, schedule, alarms, or call summaries.`;
    } else if (currentTab === 'call-analysis') {
      screenSpeech = `You are on the Call Recording and Analysis screen. You can record a live phone call, upload an audio file, or test one of the sample doctor or family calls. Gemini AI will summarize the call and extract names, times, phone numbers, and tasks. Notice: Always obtain consent before recording phone calls.`;
      if (callHistory.length > 0) {
        screenSpeech += ` Latest analyzed call: ${callHistory[0].title}. Takeaway: ${callHistory[0].seniorExplanation}`;
      }
    } else if (currentTab === 'reminders-alarms') {
      screenSpeech = `You are on the Reminders and Alarms screen. You have ${
        reminders.filter((r) => !r.completed).length
      } pending reminders: ${reminders
        .map((r) => `${r.title} at ${r.time}`)
        .join(', ')}. And ${alarms.length} alarms configured.`;
    } else if (currentTab === 'appointments') {
      screenSpeech = `You are on the Appointments and Travel screen. You have ${
        appointments.length
      } scheduled events: ${appointments
        .map((a) => `${a.title} on ${a.date} at ${a.time}`)
        .join('. ')}.`;
    } else if (currentTab === 'planner') {
      screenSpeech = `You are on the Daily Planner screen showing today's timeline of alarms, doctor visits, travel plans, and medication reminders.`;
    }

    speech.speakText(screenSpeech);
  };

  // Theme root classes
  const getThemeClass = () => {
    switch (theme) {
      case 'yellow':
        return 'theme-yellow bg-black text-yellow-300';
      case 'light':
        return 'theme-light bg-slate-50 text-slate-900';
      default:
        return 'theme-default bg-slate-950 text-slate-100';
    }
  };

  const getFontScaleClass = () => {
    switch (fontScale) {
      case 'large':
        return 'text-scale-large';
      case 'xlarge':
        return 'text-scale-xlarge';
      default:
        return 'text-scale-normal';
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${getThemeClass()} ${getFontScaleClass()}`}
    >
      {/* Top Accessible Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        theme={theme}
        onThemeChange={setTheme}
        fontScale={fontScale}
        onFontScaleChange={setFontScale}
        soundEnabled={soundEnabled}
        onToggleSound={setSoundEnabled}
        onReadScreen={handleReadCurrentScreen}
        onTriggerSOS={() => setIsSOSActive(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 pb-28">
        {currentTab === 'home' && (
          <HomeScreen
            onNavigate={setCurrentTab}
            nextReminder={nextPendingReminder}
            nextAppointment={nextAppointment}
            onOpenVoiceAssistant={() => setCurrentTab('assistant')}
            onTriggerSOS={() => setIsSOSActive(true)}
            onShareLocation={() => setIsShareLocationOpen(true)}
            onOpenBackup={() => setIsBackupModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        )}

        {currentTab === 'medications' && (
          <MedicationsScreen
            medications={medications}
            doseLogs={doseLogs}
            onAddMedication={handleAddMedication}
            onDeleteMedication={handleDeleteMedication}
            onLogDose={handleLogDose}
            onUndoDoseLog={handleUndoDoseLog}
            onUpdateMedication={handleUpdateMedication}
            caregiverContact={emergencyContact}
          />
        )}

        {currentTab === 'assistant' && (
          <AssistantScreen
            reminders={reminders}
            appointments={appointments}
            alarms={alarms}
            callHistory={callHistory}
            onAddReminder={handleAddReminder}
            onAddAppointment={handleAddAppointment}
            onAddAlarm={handleAddAlarm}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'call-analysis' && (
          <CallAnalysisScreen
            onAddReminder={handleAddReminder}
            onAddAppointment={handleAddAppointment}
            callHistory={callHistory}
            onSaveAnalysisRecord={handleSaveAnalysisRecord}
          />
        )}

        {currentTab === 'reminders-alarms' && (
          <RemindersAlarmsScreen
            reminders={reminders}
            alarms={alarms}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
            onAddReminder={handleAddReminder}
            onToggleAlarm={handleToggleAlarm}
            onDeleteAlarm={handleDeleteAlarm}
            onAddAlarm={handleAddAlarm}
            onTestAlarmTrigger={(alarm) => setRingingAlarm(alarm)}
          />
        )}

        {currentTab === 'appointments' && (
          <AppointmentsScreen
            appointments={appointments}
            onAddAppointment={handleAddAppointment}
            onDeleteAppointment={handleDeleteAppointment}
          />
        )}

        {currentTab === 'planner' && (
          <DailyPlannerScreen
            reminders={reminders}
            alarms={alarms}
            appointments={appointments}
            onToggleReminder={handleToggleReminder}
            onNavigateTab={setCurrentTab}
          />
        )}
      </main>

      {/* Fixed Bottom Accessible Navigation Bar */}
      <BottomNav currentTab={currentTab} onNavigate={setCurrentTab} />

      {/* Live Alarm Ringer Modal */}
      {ringingAlarm && (
        <AlarmRingerModal
          alarm={ringingAlarm}
          onDismiss={() => setRingingAlarm(null)}
          onSnooze={() => {
            sound.playTap();
            speech.speakText('Alarm snoozed for 5 minutes.');
            setRingingAlarm(null);
          }}
        />
      )}

      {/* Emergency SOS Modal */}
      {isSOSActive && (
        <EmergencySOSModal
          contact={emergencyContact}
          onUpdateContact={setEmergencyContact}
          onClose={() => setIsSOSActive(false)}
        />
      )}

      {/* Share Location Modal */}
      {isShareLocationOpen && (
        <ShareLocationModal
          contact={emergencyContact}
          onClose={() => setIsShareLocationOpen(false)}
        />
      )}

      {/* Data Backup & Restore Modal */}
      {isBackupModalOpen && (
        <DataBackupModal
          reminders={reminders}
          appointments={appointments}
          medications={medications}
          doseLogs={doseLogs}
          alarms={alarms}
          emergencyContact={emergencyContact}
          callHistory={callHistory}
          onRestoreData={handleRestoreData}
          onClose={() => setIsBackupModalOpen(false)}
        />
      )}

      {/* Settings & Volume Booster Modal */}
      {isSettingsModalOpen && (
        <SettingsPanelModal
          theme={theme}
          onThemeChange={setTheme}
          fontScale={fontScale}
          onFontScaleChange={setFontScale}
          soundEnabled={soundEnabled}
          onToggleSound={setSoundEnabled}
          onOpenBackup={() => {
            setIsSettingsModalOpen(false);
            setIsBackupModalOpen(true);
          }}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
}
