import dotenv from 'dotenv';

dotenv.config();

export const emailSubjects = () => ({
    otpVerification: "Your OTP Code - Verify Your Email - CatalystCare",
    welcome : "Welcome to Catalystcare! See how your life is going to change.",
    forgotPassword : "Reset Your Password - CatalystCare",
    therapistOnboarding : "Welcome to CatalystCare! Let's Get Started.",
    sessionReminder : "Upcoming Therapy Session Reminder - CatalystCare",
    feedbackRequest : "We Value Your Feedback - CatalystCare",
    subscriptionRenewal : "Your Subscription is Renewing Soon - CatalystCare",
    accountDeactivation : "We're Sorry to See You Go - CatalystCare",
});

export const emailFromAddress = () => ({
    onboarding : {name : "CatalystCare Onboarding" , email : "onboarding@catalystcare.in"},
    otpSending : {name : "CatalystCare", email : "noreply@catalystcare.in"},
    otpVerification : {name : "CatalystCare", email : "noreply@catalystcare.in"},
    infoEmail : {name : "CatalystCare", email : "info@catalystcare.in"}
})