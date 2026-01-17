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


export type ProgramPurchaseWithRelations = {
  id: string;
  totalSessions: number;
  usedSessions: number;
  status: string;
  validFrom: Date;
  validTill: Date | null;
  createdAt: Date;

  program: {
    id: string;
    title: string;
  };

  programPlan: {
    id: string;
    name: string;
    sessionsCount: number;
  };

  therapist: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };

  client: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
};
