import {
  Reminder,
  Alarm,
  Appointment,
  CallAnalysisRecord,
  HighContrastTheme,
  FontSizeScale,
  EmergencyContact,
  Medication,
  DoseLog,
} from '../types';

// Helper to format dates
const getFormattedDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// Helper to find the next upcoming Friday
const getNextFriday = (): string => {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7; // next Friday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
};

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    name: 'Lisinopril (Blood Pressure)',
    dosage: '10 mg',
    instructions: 'Take 1 tablet every morning with a full glass of water. Keep blood pressure monitored.',
    times: ['09:00 AM'],
    frequency: 'daily',
    pillColor: 'blue',
    pillForm: 'tablet',
    refillRemaining: 4, // Low supply (4 doses left)
    totalPills: 30,
    refillThreshold: 5,
    prescribingDoctor: 'Dr. Sarah Adams',
    active: true,
  },
  {
    id: 'med-2',
    name: 'Metformin (Blood Sugar)',
    dosage: '500 mg',
    instructions: 'Take with morning and evening meals to avoid stomach sensitivity.',
    times: ['09:00 AM', '07:00 PM'],
    frequency: 'twice-daily',
    pillColor: 'amber',
    pillForm: 'tablet',
    refillRemaining: 45,
    totalPills: 60,
    refillThreshold: 6,
    prescribingDoctor: 'Dr. Michael Chen',
    active: true,
  },
  {
    id: 'med-3',
    name: 'Vitamin D3 & Calcium',
    dosage: '1000 IU',
    instructions: 'Take after lunchtime for bone strength and vitality.',
    times: ['01:00 PM'],
    frequency: 'daily',
    pillColor: 'emerald',
    pillForm: 'capsule',
    refillRemaining: 60,
    totalPills: 90,
    refillThreshold: 7,
    prescribingDoctor: 'Dr. Sarah Adams',
    active: true,
  },
  {
    id: 'med-4',
    name: 'Baby Aspirin (Cardio Care)',
    dosage: '81 mg',
    instructions: 'Take in the evening with or after dinner for heart care.',
    times: ['08:00 PM'],
    frequency: 'daily',
    pillColor: 'rose',
    pillForm: 'tablet',
    refillRemaining: 28,
    totalPills: 30,
    refillThreshold: 5,
    prescribingDoctor: 'Dr. Sarah Adams',
    active: true,
  },
];

export const INITIAL_DOSE_LOGS: DoseLog[] = [
  {
    id: 'log-1',
    medicationId: 'med-1',
    medicationName: 'Lisinopril (Blood Pressure)',
    dosage: '10 mg',
    scheduledTime: '09:00 AM',
    scheduledDate: getFormattedDate(0),
    status: 'taken',
    recordedAt: '09:04 AM',
    notes: 'Taken with breakfast and water',
  },
  {
    id: 'log-2',
    medicationId: 'med-2',
    medicationName: 'Metformin (Blood Sugar)',
    dosage: '500 mg',
    scheduledTime: '09:00 AM',
    scheduledDate: getFormattedDate(0),
    status: 'taken',
    recordedAt: '09:05 AM',
    notes: 'Taken with breakfast',
  },
  {
    id: 'log-3',
    medicationId: 'med-4',
    medicationName: 'Baby Aspirin (Cardio Care)',
    dosage: '81 mg',
    scheduledTime: '08:00 PM',
    scheduledDate: getFormattedDate(-1),
    status: 'taken',
    recordedAt: '08:15 PM',
    notes: 'Taken after dinner',
  },
  {
    id: 'log-4',
    medicationId: 'med-2',
    medicationName: 'Metformin (Blood Sugar)',
    dosage: '500 mg',
    scheduledTime: '07:00 PM',
    scheduledDate: getFormattedDate(-1),
    status: 'taken',
    recordedAt: '07:10 PM',
  },
  {
    id: 'log-5',
    medicationId: 'med-3',
    medicationName: 'Vitamin D3 & Calcium',
    dosage: '1000 IU',
    scheduledTime: '01:00 PM',
    scheduledDate: getFormattedDate(-1),
    status: 'missed',
    recordedAt: '02:30 PM',
    notes: 'Was visiting family at park',
  },
];

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    title: 'Medicine reminder – Blood pressure pill',
    date: getFormattedDate(0),
    time: '09:00 AM',
    recurrence: 'daily',
    completed: false,
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-2',
    title: 'Call daughter Emily',
    date: getFormattedDate(0),
    time: '07:00 PM',
    recurrence: 'none',
    completed: false,
    priority: 'normal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-3',
    title: 'Drink 2 glasses of water & light stretching',
    date: getFormattedDate(0),
    time: '02:00 PM',
    recurrence: 'daily',
    completed: true,
    priority: 'normal',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    title: 'Doctor appointment – Dr. Adams Cardiology',
    date: getFormattedDate(1), // Tomorrow
    time: '10:00 AM',
    location: 'Downtown Medical Center, Suite 304',
    notes: 'Bring Medicare card, list of current medications, and blood pressure notebook. Fasting not required.',
    category: 'Doctor',
  },
  {
    id: 'apt-2',
    title: 'Train journey – Visit family in Oakridge',
    date: getNextFriday(),
    time: '08:30 AM',
    location: 'Central Railway Station, Platform 3',
    notes: 'Car 4, Seat 12B. Arrive 25 minutes early for senior baggage assistance.',
    category: 'Travel',
  },
  {
    id: 'apt-3',
    title: 'Weekly Senior Book Club & Tea',
    date: getFormattedDate(2),
    time: '03:00 PM',
    location: 'Community Library Garden Room',
    notes: 'Discussing chapters 4-6. Neighbor Arthur will offer a ride.',
    category: 'Meeting',
  },
];

export const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alm-1',
    time: '07:00 AM',
    label: 'Morning Wakeup & Gentle Stretch',
    days: ['Daily'],
    enabled: true,
  },
  {
    id: 'alm-2',
    time: '09:00 AM',
    label: 'Morning Heart Medication with Water',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    enabled: true,
  },
  {
    id: 'alm-3',
    time: '09:30 PM',
    label: 'Bedtime Alarm & Lock Front Door',
    days: ['Daily'],
    enabled: false,
  },
];

export const SAMPLE_CALLS = [
  {
    id: 'sample-call-1',
    title: 'Doctor Clinic: Dr. Adams Appointment Confirmation',
    duration: '1 min 14 sec',
    transcript: `Receptionist: Good morning, Mr. Jenkins! This is Nurse Clara calling from Dr. Adams' office at Downtown Medical Center.
Jenkins: Oh hello Clara.
Receptionist: I am calling to confirm your annual cardiology checkup scheduled for tomorrow morning at 10:00 AM.
Jenkins: Yes, tomorrow at 10 AM. Where should I go again?
Receptionist: We are located in Suite 304 on the third floor of the Downtown Medical Center. Please remember to bring your Medicare card and your daily blood pressure log. Also, please do not drink coffee or caffeinated tea for two hours prior.
Jenkins: Got it, Suite 304, Medicare card and blood pressure log.
Receptionist: Wonderful! If you need wheelchair assistance from the main entrance, please call us on our direct line at 555-0192 when you arrive. Have a great day!`,
  },
  {
    id: 'sample-call-2',
    title: 'Family Call: Daughter Emily Weekend Visit & Groceries',
    duration: '1 min 45 sec',
    transcript: `Emily: Hi Dad! Just calling to see how you are feeling today.
Jenkins: Hi Emily, doing well! Taking my walks in the garden.
Emily: That's great! Remember, I am coming over to your house this Saturday at 11:30 AM to cook lunch and bring your weekly groceries.
Jenkins: Saturday at 11:30 AM, wonderful.
Emily: Yes! I already ordered your low-sodium vegetable soup and whole wheat bread. Also, please check your medicine cabinet—I made an appointment for your prescription refill pickup at Green Cross Pharmacy on Friday at 4:00 PM.
Jenkins: Okay, refill on Friday at 4 PM, and see you Saturday at 11:30.
Emily: Exactly. Love you, call me if you need anything before then!`,
  },
  {
    id: 'sample-call-3',
    title: 'Train Station: Friday Journey to Oakridge Details',
    duration: '52 sec',
    transcript: `Rail Agent: Thank you for calling Central Rail Helpline. This is Marcus confirming your senior passenger booking for this Friday at 8:30 AM.
Jenkins: Hello Marcus, what platform will the train to Oakridge be departing from?
Rail Agent: You will depart from Platform 3. Your reservation is Coach 4, Seat 12B. Complimentary senior porter assistance is booked for you at Customer Desk A. Please arrive at 8:05 AM, 25 minutes prior to departure.
Jenkins: Platform 3 at 8:05 AM. Thank you kindly Marcus.`,
  },
];

const STORAGE_KEYS = {
  REMINDERS: 'assistai_reminders_v1',
  APPOINTMENTS: 'assistai_appointments_v1',
  ALARMS: 'assistai_alarms_v1',
  CALL_HISTORY: 'assistai_call_history_v1',
  THEME: 'assistai_contrast_theme_v1',
  FONT_SCALE: 'assistai_font_scale_v1',
  SPEECH_SPEED: 'assistai_speech_speed_v1',
  EMERGENCY_CONTACT: 'assistai_emergency_contact_v1',
  MEDICATIONS: 'assistai_medications_v1',
  DOSE_LOGS: 'assistai_dose_logs_v1',
};

export const INITIAL_EMERGENCY_CONTACT: EmergencyContact = {
  name: 'Emily Jenkins',
  relationship: 'Daughter / Primary Caregiver',
  phoneNumber: '555-234-5678',
  customMessage: 'EMERGENCY ALERT from Dad: I need urgent help! Please call me or come over immediately.',
  notifyWithLocation: true,
};

export const storage = {
  getReminders: (): Reminder[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      return data ? JSON.parse(data) : INITIAL_REMINDERS;
    } catch {
      return INITIAL_REMINDERS;
    }
  },
  saveReminders: (reminders: Reminder[]) => {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  },

  getAppointments: (): Appointment[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  },
  saveAppointments: (appointments: Appointment[]) => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },

  getAlarms: (): Alarm[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALARMS);
      return data ? JSON.parse(data) : INITIAL_ALARMS;
    } catch {
      return INITIAL_ALARMS;
    }
  },
  saveAlarms: (alarms: Alarm[]) => {
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
  },

  getCallHistory: (): CallAnalysisRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALL_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveCallHistory: (records: CallAnalysisRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify(records));
  },

  getTheme: (): HighContrastTheme => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as HighContrastTheme) || 'default';
  },
  saveTheme: (theme: HighContrastTheme) => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  getFontScale: (): FontSizeScale => {
    return (localStorage.getItem(STORAGE_KEYS.FONT_SCALE) as FontSizeScale) || 'large';
  },
  saveFontScale: (scale: FontSizeScale) => {
    localStorage.setItem(STORAGE_KEYS.FONT_SCALE, scale);
  },

  getEmergencyContact: (): EmergencyContact => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACT);
      return data ? JSON.parse(data) : INITIAL_EMERGENCY_CONTACT;
    } catch {
      return INITIAL_EMERGENCY_CONTACT;
    }
  },
  saveEmergencyContact: (contact: EmergencyContact) => {
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_CONTACT, JSON.stringify(contact));
  },

  getMedications: (): Medication[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
      return data ? JSON.parse(data) : INITIAL_MEDICATIONS;
    } catch {
      return INITIAL_MEDICATIONS;
    }
  },
  saveMedications: (meds: Medication[]) => {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(meds));
  },

  getDoseLogs: (): DoseLog[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOSE_LOGS);
      return data ? JSON.parse(data) : INITIAL_DOSE_LOGS;
    } catch {
      return INITIAL_DOSE_LOGS;
    }
  },
  saveDoseLogs: (logs: DoseLog[]) => {
    localStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(logs));
  },
};
