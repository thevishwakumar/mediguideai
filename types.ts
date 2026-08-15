export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: string[]; // Base64 strings
  isBookmarked?: boolean;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  conversation: Message[];
}

export enum UrgencyLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  EMERGENCY = 'Emergency'
}

export interface EmergencyContact {
  name: string;
  relationship: string; // e.g., "Primary Care Physician", "Spouse", "Parent", "Caregiver"
  phone: string;
  email?: string;
  notes?: string;
}

export interface HealthProfile {
  age?: string;
  gender?: string;
  preExistingConditions?: string;
  emergencyContact?: EmergencyContact;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  healthProfile?: HealthProfile;
  summary?: string;
}

export interface SavedInsight {
  id: string;
  messageId: string;
  title: string;
  content: string;
  timestamp: number;
}

export type ReminderType = 'medication' | 'symptom_check';
export type ReminderFrequency = 'once' | 'daily' | 'weekly';

export interface Reminder {
  id: string;
  title: string;
  type: ReminderType;
  time: string; // "HH:MM" 24h format e.g. "09:00"
  frequency: ReminderFrequency;
  daysOfWeek?: number[]; // [0,1,2,3,4,5,6] Sunday = 0
  notes?: string;
  enabled: boolean;
  lastTriggeredDate?: string; // e.g., "2026-08-15"
  createdAt: number;
}

export interface SymptomLog {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  symptomName: string; // e.g., "Headache", "Fever", "Lower Back Pain"
  painLevel: number; // 0 - 10
  temperature?: number; // e.g. 98.6 or 101.2
  mood?: number; // 1 - 5 scale (1: Very Low, 2: Low, 3: Neutral, 4: Good, 5: Excellent)
  notes?: string;
  trigger?: string; // e.g. "Stress", "Lack of Sleep", "Weather Change"
  tags?: string[];
}

export interface MedicalArticleSource {
  title: string;
  url: string;
  domain?: string;
  snippet?: string;
}

export interface MedicalArticleSearchResult {
  query: string;
  summary: string;
  sources: MedicalArticleSource[];
  searchQueries?: string[];
  timestamp: number;
}


