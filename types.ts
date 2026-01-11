export enum Screen {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  CONTACTS = 'CONTACTS',
  STATS = 'STATS',
  WILL = 'WILL',
  SETTINGS = 'SETTINGS'
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  roleColorClass: string;
  email: string;
  avatarUrl: string;
  isActive: boolean;
}

export interface MoodData {
  day: string;
  value: number; // 0-100 scale for mood
}