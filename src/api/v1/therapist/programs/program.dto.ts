export enum ProgramCadence {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  FLEXIBLE = 'FLEXIBLE',
}

export interface CreateProgramInput {
  title: string;
  description?: string;
  outcome?: string;
  plans: {
    name: string;
    sessionsCount: number;
    sessionDuration: number;
    price: number;
    cadence: ProgramCadence;
    recommendedGapDays?: number;
  }[];
}