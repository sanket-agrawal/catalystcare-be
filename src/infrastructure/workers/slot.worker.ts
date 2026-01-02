import { Worker } from "bullmq";
import slotService from "../../api/v1/therapist/slot/slot.service";
import { redisConnection } from "../redis/index";
import {prisma} from "../prisma/client"
import { addDays } from "date-fns";

const worker = new Worker("slot-queue", async job => {
  if (job.name === "generate_slots") {
    // job.data: { therapistId, dateFrom, dateTo }
    return slotService.generateSlots(job.data);
  }

  if (job.name === "update_slots") {
    // update flow: delete unbooked slots in range then regenerate
    const { therapistId, dateFrom, dateTo } = job.data;
    await slotService.deleteUnbookedSlotsInRange(therapistId, new Date(dateFrom), new Date(dateTo));
    return slotService.generateSlots({ therapistId, dateFrom, dateTo });
  }

if (job.name === "regenerate_future_slots") {
  const therapists = await prisma.therapistProfile.findMany({
    select: { id: true },
    where: { status: "APPROVED" }, // optional
  });

  const now = new Date();
  const end = new Date();
  end.setDate(now.getDate() + 30);

  for (const t of therapists) {
    const createdSlots = await slotService.generateSlots({
      therapistId: t.id,
      dateFrom: now.toISOString(),
      dateTo: end.toISOString(),
    });

    console.log("Total Created Slots",createdSlots.created)
  }

  console.log("🧠 Daily slot regeneration complete.");
}

// slot.worker.ts (only relevant excerpt)
if (job.name === "update_single_availability") {
  const {
    therapistId,
    oldAvailabilityId,
    newAvailabilityId,
    dateFrom,
    dateTo
  } = job.data;

  console.log("⛔ Cancelling old future AVAILABLE slots for old availability...", oldAvailabilityId);

  await prisma.availabilitySlot.deleteMany({
    where: {
      availabilityId: oldAvailabilityId,
      status: "AVAILABLE",
      startDateTime: { gte: new Date(dateFrom) }
    }
  });

  console.log("🔄 Generating new slots for new availability only...");

  // Only generate slots for the new availability (scoped)
  return await slotService.generateSlots({
    therapistId,
    dateFrom,
    dateTo,
    availabilityId: newAvailabilityId
  });
}





  return null;
}, { connection : redisConnection, concurrency : 5 });

worker.on("completed", (job, result) => {
  console.log("Job completed", job.id, job.name, result);
});
worker.on("failed", (job, err) => {
  console.error("Job failed", job?.id, err);
});