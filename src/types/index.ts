export type AppTab = 'home' | 'assistant' | 'call-analysis' | 'reminders-alarms' | 'appointments' | 'planner' | 'medications';

export type HighContrastTheme = 'default' | 'yellow' | 'light';
export type FontSizeScale = 'normal' | 'large' | 'xlarge';

export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g. "10 mg"
  instructions: string; // e.g. "Take with food & full glass of water"
  times: string[]; // e.g. ["09:00 AM", "08:00 PM"]
  frequency: 'daily' | 'twice-daily' | 'weekly' | 'as-needed';
  pillColor: string; // 'blue' | 'amber' | 'emerald' | 'purple' | 'rose'
  pillForm: 'tablet' | 'capsule' | 'liquid' | 'drops' | 'inhaler';
  refillRemaining: number;
  totalPills?: number;
  refillThreshold?: number; // e.g. 5 doses threshold for caregiver alert
  prescribingDoctor?: string;
  active: boolean;
}

export interface VoiceMacro {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: string[];
  isCustom?: boolean;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  scheduledDate: string; // YYYY-MM-DD
  status: 'taken' | 'missed' | 'skipped';
  recordedAt: string; // Timestamp
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24-hour or 12-hour display)
  recurrence?: 'none' | 'daily' | 'weekly';
  completed: boolean;
  priority?: 'normal' | 'high';
  createdAt: string;
}

export interface Alarm {
  id: string;
  time: string; // "07:30"
  label: string; // e.g., "Blood Pressure Medicine"
  days: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri"] or ["Daily"]
  enabled: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  location?: string;
  notes?: string;
  category: 'Doctor' | 'Family' | 'Travel' | 'Meeting' | 'Other';
}

export interface CallEntities {
  names: string[];
  dates: string[];
  times: string[];
  locations: string[];
  phoneNumbers: string[];
  tasksAndPromises: string[];
  importantInstructions: string[];
}

export interface CallSuggestedAction {
  type: 'reminder' | 'appointment' | 'alarm' | 'none';
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
}

export interface CallAnalysisRecord {
  id: string;
  timestamp: string;
  title: string;
  audioDuration?: string;
  transcript: string;
  summary: string;
  seniorExplanation: string;
  detectedType: 'appointment' | 'reminder' | 'meeting' | 'travel' | 'task' | 'general';
  entities: CallEntities;
  suggestedAction?: CallSuggestedAction;
  actionSaved?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionTaken?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  customMessage: string;
  notifyWithLocation: boolean;
}

export interface BackupDataBundle {
  version: string;
  exportedAt: string;
  app: string;
  reminders: Reminder[];
  appointments: Appointment[];
  medications: Medication[];
  doseLogs: DoseLog[];
  alarms?: Alarm[];
  emergencyContact?: EmergencyContact;
  callHistory?: CallAnalysisRecord[];
  macros?: VoiceMacro[];
  stepData?: any;
}


