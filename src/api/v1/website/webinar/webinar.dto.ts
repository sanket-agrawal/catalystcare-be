

export enum WebinarStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}


export enum WebinarRegistrationStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED"
}

export interface InitiateRegistrationInput {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}

export interface VerifyPaymentInput {
  registrationId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}