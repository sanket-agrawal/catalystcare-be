import dotenv from "dotenv";

dotenv.config();

export const emailSubjects = (
  therapistName?: string,
  clientName?: string,
  assessmentName?: string,
  programName?: string,
  programTitle?: string
) => ({
  otpVerification: "Your OTP Code - Verify Your Email - CatalystCare",
  welcome: "Welcome to Catalystcare! See how your life is going to change.",
  forgotPassword: "Reset Your Password - CatalystCare",
  therapistRegisterationRecieved: "Therapist Registration Received - Catalystcare",
  therapistOnboarding: "Welcome to CatalystCare! Let's Get Started.",
  therapistProfileRejection: "Your Therapist Profile is Rejected - CatalystCare",
  sessionReminder: "Upcoming Therapy Session Reminder - CatalystCare",
  feedbackRequest: "We Value Your Feedback - CatalystCare",
  subscriptionRenewal: "Your Subscription is Renewing Soon - CatalystCare",
  accountDeactivation: "We're Sorry to See You Go - CatalystCare",
  therapistCalendarConnection: "Your Google Calendar Is Now Connected to Catalyst Care ✔",
  clientBookingConfirmation: "Your Therapy Session Is Confirmed - CatalystCare ✔",
  clientBookingIncomplete: therapistName
    ? `Complete Your Booking with ${therapistName} - CatalystCare`
    : "Complete Your Booking - CatalystCare",
  therapistBookingConfirmation: "New Therapy Session Scheduled - CatalystCare 🗓",
  therapistProfileHold: "Action Required: Your Therapist Profile Is On Hold - CatalystCare",
  therapistProfileHoldRemoved: "Your Therapist Profile Is Active Again - CatalystCare",
  contactFormSubmissionClientCopy: "We Received Your Message - CatalystCare",
  contactFormSubmissionAdminCopy: "New Contact Form Submission - CatalystCare",
  rescheduleSessionConfirmationClient: `Your Therapy Session with ${therapistName} Has Been Rescheduled - CatalystCare ✔`,
  rescheduleSessionConfirmationTherapist: `Schedule Update : Therapy Session with ${clientName} Rescheduled - CatalystCare 🗓`,
  assessmentResults: `Your ${assessmentName} Results Are Here - CatalystCare ✔`,
  therapistProfileResubmissionAdmin: "Therapist Profile Resubmission Received - CatalystCare",
  therapistProfileSubmissionAcknowledgement:
    "Therapist Profile Resubmission Received - CatalystCare",
  therapistProfileSubmissionAdmin: "New Therapist Profile Submission - CatalystCare",
  clientProgramBookingConfirmation: `Your Enrollment for ${programName} - ${programTitle} Is Confirmed | Catalyst Care ✔`,
  therapistProgramBookingConfirmaton: `New Client Enrolled in Your ${programName} - ${programTitle}`,
  rescheduleSessionRejectionClient:
    "Reschedule Request Rejected – Session Remains Scheduled - CatalystCare",
});

export const programSlotBookingSubjects = (
  planName?: string,
  sessionNumber?: number,
  programTitle?: string,
  clientName?: string,
  therapistName?: string
) => ({
  clientSlotBookingConfirmation: `Session ${sessionNumber} Confirmed for ${programTitle} - ${planName}`,
  therapistSlotBookingConfirmation: `Session ${sessionNumber} Booked by ${clientName} ${programTitle} - ${planName}`,
});

export const therapistSessionSubjects = (therapistName?: string, clientName?: string) => ({
  adminNotification: "Therapist Reschedule Request – Action Required - CatalystCare",
  therapistNotification: "Your Reschedule Request Has Been Submitted - CatalystCare",
});

export const emailFromAddress = () => ({
  onboarding: { name: "CatalystCare Onboarding", email: "onboarding@catalystcare.in" },
  otpSending: { name: "CatalystCare", email: "noreply@catalystcare.in" },
  otpVerification: { name: "CatalystCare", email: "noreply@catalystcare.in" },
  infoEmail: { name: "CatalystCare", email: "info@catalystcare.in" },
});

export const webinarEmailSubjects = (webinarTitle: string) => ({
  clinetRegistrationConfirmation: `Your Registration for ${webinarTitle} is Confirmed - CatalystCare ✔`,
  therapistConfirmation: `New Registration for : ${webinarTitle}`,
  reminder: `Reminder: Upcoming Webinar "${webinarTitle}" - CatalystCare`,
  followUp: `Thank You for Attending "${webinarTitle}" - CatalystCare`,
});

export const organizationOnboardingSubjects = (orgName: string) => ({
  onboardingInitiated: `Your Request for ${orgName} is being Processed - CatalystCare`,

  adminInternalNotification: `New Organization Onboarding Request: ${orgName}`,

  onboardingApproved: `Your Organization ${orgName} is Approved - Next Steps Inside`,

  planCreated: `Complete Your Payment to Activate Your Custom Plan for ${orgName} - CatalystCare`,

  paymentPending: `Action Required: Complete Payment for ${orgName} - CatalystCare`,

  paymentReceived: `Payment Received for ${orgName} - CatalystCare`,

  onboardingCompleted: `${orgName} is Now Live on CatalystCare 🚀`,

  onboardingRejected: `Update on Your Onboarding Request for ${orgName}`,

  followUp: `Need Help Completing Onboarding for ${orgName}?`,

  activated: `Welcome Aboard, ${orgName}! Your Plan is Now Active 🎉 CatalystCare!`,

  adminInvite: `You've Been Invited to Manage ${orgName} on Catalyst Care`,
});
