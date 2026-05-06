import { describe, expect, it } from "vitest";
import {
  emailFromAddress,
  emailSubjects,
  organizationOnboardingSubjects,
  programSlotBookingSubjects,
  therapistSessionSubjects,
  webinarEmailSubjects,
} from "./email.config";

describe("emailSubjects", () => {
  it("interpolates names into assessment and reschedule subjects", () => {
    const s = emailSubjects("Dr. A", "Client B", "Burnout Check");
    expect(s.assessmentResults).toContain("Burnout Check");
    expect(s.rescheduleSessionConfirmationClient).toContain("Dr. A");
    expect(s.rescheduleSessionConfirmationTherapist).toContain("Client B");
  });
});

describe("webinarEmailSubjects", () => {
  it("includes webinar title in each subject", () => {
    const s = webinarEmailSubjects("Sleep & Stress");
    expect(s.clinetRegistrationConfirmation).toContain("Sleep & Stress");
    expect(s.reminder).toContain("Sleep & Stress");
  });
});

describe("organizationOnboardingSubjects", () => {
  it("embeds organization name", () => {
    const s = organizationOnboardingSubjects("Acme Clinic");
    expect(s.onboardingInitiated).toContain("Acme Clinic");
    expect(s.adminInvite).toContain("Acme Clinic");
  });
});

describe("emailFromAddress", () => {
  it("returns fixed sender profiles", () => {
    const from = emailFromAddress();
    expect(from.otpSending.email).toMatch(/@/);
    expect(from.onboarding.name).toContain("CatalystCare");
  });
});

describe("programSlotBookingSubjects", () => {
  it("includes session number and names", () => {
    const s = programSlotBookingSubjects(
      "Gold",
      3,
      "Anxiety Program",
      "Chris",
      "Dr. Lee"
    );
    expect(s.clientSlotBookingConfirmation).toContain("Session 3");
    expect(s.clientSlotBookingConfirmation).toContain("Anxiety Program");
    expect(s.therapistSlotBookingConfirmation).toContain("Chris");
  });
});

describe("therapistSessionSubjects", () => {
  it("returns reschedule-related subjects", () => {
    const s = therapistSessionSubjects();
    expect(s.adminNotification).toContain("Reschedule");
    expect(s.therapistNotification).toContain("Reschedule");
  });
});
