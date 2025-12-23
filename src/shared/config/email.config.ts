import dotenv from 'dotenv';

dotenv.config();

export const emailSubjects = (therapistName? : string, clientName? : string) => ({
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
});

export const emailFromAddress = () => ({
    onboarding : {name : "CatalystCare Onboarding" , email : "onboarding@catalystcare.in"},
    otpSending : {name : "CatalystCare", email : "noreply@catalystcare.in"},
    otpVerification : {name : "CatalystCare", email : "noreply@catalystcare.in"},
    infoEmail : {name : "CatalystCare", email : "info@catalystcare.in"}
});
