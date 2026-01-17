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

export type ProgramPurchaseMapped = {
  id: string;

  totalSessions: number;
  usedSessions: number;

  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  validFrom: Date | null;
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


export type ProgramPurchaseDb = {
  id: string;
  totalSessions: number;
  usedSessions: number;
  status: "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "CANCELLED" ;
  validFrom: Date | null;
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
