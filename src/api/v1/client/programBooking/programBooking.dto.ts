export type FetchProgramPurchasesResponse = {
  id: string;

  program: {
    id: string;
    title: string;
  };

  plan: {
    id: string;
    name: string;
    totalSessions: number;
  };

  therapist: {
    id: string;
    name: string;
  };

  client: {
    id: string;
    name: string;
  };

  usage: {
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
  };

  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | string;

  validFrom: Date;
  validTill: Date | null;

  canBookSlot: boolean;
  createdAt: Date;
};
