import dotenv from 'dotenv';

dotenv.config();

export const emailSubjects = (therapistName? : string, clientName? : string, assessmentName? : string, programName? : string, programTitle? :string) => ({
    otpVerification: "Your OTP Code - Verify Your Email - CatalystCare",
    welcome : "Welcome to Catalystcare! See how your life is going to change.",
    forgotPassword : "Reset Your Password - CatalystCare",
    therapistRegisterationRecieved : "Therapist Registration Received - Catalystcare",
    therapistOnboarding : "Welcome to CatalystCare! Let's Get Started.",
    therapistProfileRejection : "Your Therapist Profile is Rejected - CatalystCare",
    sessionReminder : "Upcoming Therapy Session Reminder - CatalystCare",
    feedbackRequest : "We Value Your Feedback - CatalystCare",
    subscriptionRenewal : "Your Subscription is Renewing Soon - CatalystCare",
    accountDeactivation : "We're Sorry to See You Go - CatalystCare",
    therapistCalendarConnection : "Your Google Calendar Is Now Connected to Catalyst Care ✔",
    clientBookingConfirmation : "Your Therapy Session Is Confirmed - CatalystCare ✔",
    therapistBookingConfirmation : "New Therapy Session Scheduled - CatalystCare 🗓",
    therapistProfileHold : "Action Required: Your Therapist Profile Is On Hold - CatalystCare",
    therapistProfileHoldRemoved : "Your Therapist Profile Is Active Again - CatalystCare",
    contactFormSubmissionClientCopy : "We Received Your Message - CatalystCare",
    contactFormSubmissionAdminCopy : "New Contact Form Submission - CatalystCare",
    rescheduleSessionConfirmationClient : `Your Therapy Session with ${therapistName} Has Been Rescheduled - CatalystCare ✔`,
    rescheduleSessionConfirmationTherapist : `Schedule Update : Therapy Session with ${clientName} Rescheduled - CatalystCare 🗓`,
    assessmentResults : `Your ${assessmentName} Results Are Here - CatalystCare ✔`,
    therapistProfileResubmissionAdmin : "Therapist Profile Resubmission Received - CatalystCare",
    therapistProfileSubmissionAcknowledgement : "Therapist Profile Resubmission Received - CatalystCare",
    therapistProfileSubmissionAdmin : "New Therapist Profile Submission - CatalystCare",
    clientProgramBookingConfirmation : `Your Enrollment for ${programName} - ${programTitle} Is Confirmed | Catalyst Care ✔`,
    therapistProgramBookingConfirmaton : `New Client Enrolled in Your ${programName} - ${programTitle}`
});


export const programSlotBookingSubjects =  (planName? : string, sessionNumber? : number,programTitle? : string, clientName? : string, therapistName? : string) => ({
    clientSlotBookingConfirmation : `Session ${sessionNumber} Confirmed for ${programTitle} - ${planName}`,
    therapistSlotBookingConfirmation : `Session ${sessionNumber} Booked by ${clientName} ${programTitle} - ${planName}`,
})

export const emailFromAddress = () => ({
    onboarding : {name : "CatalystCare Onboarding" , email : "onboarding@catalystcare.in"},
    otpSending : {name : "CatalystCare", email : "noreply@catalystcare.in"},
    otpVerification : {name : "CatalystCare", email : "noreply@catalystcare.in"},
    infoEmail : {name : "CatalystCare", email : "info@catalystcare.in"}
});
