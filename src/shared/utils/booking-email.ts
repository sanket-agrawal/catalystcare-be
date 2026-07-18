import { prisma } from "../../infrastructure/prisma/client";
import { emailQueue } from "../../infrastructure/queues";
import { emailSubjects, emailFromAddress } from "../config/email.config";
import { serverConfig } from "../config/server.config";
import { clientBookingIncompleteTemplate } from "../email-templates/booking";

export async function sendIncompleteBookingEmail(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking || !booking.client?.user?.email || !booking.therapist?.user) {
      console.log(
        `踩 Skipping incomplete booking email for booking ${bookingId} - user or therapist details missing`
      );
      return;
    }

    const clientFirstName = booking.client.user.firstName;
    const therapistFullName = `${booking.therapist.user.firstName} ${booking.therapist.user.lastName}`;
    const therapistProfileUrl = booking.therapist.slug
      ? `${serverConfig.baseFrontendUrl}/therapist/${booking.therapist.slug}`
      : `${serverConfig.baseFrontendUrl}/therapist/${booking.therapist.id}`;
    const therapistsUrl = `${serverConfig.baseFrontendUrl}/therapists`;

    await emailQueue.add("clientBookingIncomplete", {
      to: booking.client.user.email,
      subject: emailSubjects(therapistFullName).clientBookingIncomplete,
      html: clientBookingIncompleteTemplate(
        clientFirstName,
        therapistFullName,
        therapistProfileUrl,
        therapistsUrl
      ),
      sender: emailFromAddress().infoEmail,
    });

    console.log(
      `✉️ Queued incomplete booking email for booking ${bookingId} to ${booking.client.user.email}`
    );
  } catch (error) {
    console.error("Failed to queue incomplete booking email:", error);
  }
}
