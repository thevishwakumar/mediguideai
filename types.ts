export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: string[]; // Base64 strings
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

export interface HealthProfile {
  age?: string;
  gender?: string;
  preExistingConditions?: string;
}
