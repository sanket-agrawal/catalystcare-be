// src/jobs/slotGeneration.job.ts

import cron from 'node-cron';
import { prisma } from '../../infrastructure/prisma/client';
import { availabilityService } from '../../api/v1/therapist/availability/availability.service';
import { addDays } from 'date-fns';


/**
 * Generates slots for all active therapists
 * Runs daily at 2 AM
 */
export const scheduleSlotGeneration = () => {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Starting daily slot generation...');
    
    try {
      // Get all active therapists with availability rules
      const therapists = await prisma.therapistProfile.findMany({
        where: {
          status: 'APPROVED'
        },
        include: {
          availability: {
            where: {
              isActive: true
            }
          }
        }
      });

      const therapistsWithAvailability = therapists.filter((t : typeof therapists[number]) => t.availability.length > 0);

      console.log(`[CRON] Found ${therapistsWithAvailability.length} therapists with availability`);

      const today = new Date();
      const futureDate = addDays(today, 30); // Generate 30 days ahead

      let totalSlotsCreated = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const therapist of therapistsWithAvailability) {
        try {
          const result = await availabilityService.generateSlots({
            therapistId: therapist.id,
            startDate: today,
            endDate: futureDate
          });

          totalSlotsCreated += result.slotsCreated;
          successCount++;

          if (result.slotsCreated > 0) {
            console.log(`[CRON] Generated ${result.slotsCreated} slots for therapist ${therapist.id}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`[CRON] Error generating slots for therapist ${therapist.id}:`, error);
        }
      }

      console.log(`[CRON] Slot generation completed:
        - Therapists processed: ${therapistsWithAvailability.length}
        - Success: ${successCount}
        - Errors: ${errorCount}
        - Total slots created: ${totalSlotsCreated}
      `);

      // Log to database (optional - create a JobLog model)
      await logJobExecution({
        jobName: 'slot_generation',
        status: errorCount === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
        therapistsProcessed: therapistsWithAvailability.length,
        slotsCreated: totalSlotsCreated,
        errors: errorCount
      });

    } catch (error) {
      console.error('[CRON] Fatal error in slot generation job:', error);
      
      await logJobExecution({
        jobName: 'slot_generation',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },{
    timezone : "Asia/Kolkata"
  });

  console.log('[CRON] Slot generation job scheduled (daily at 2:00 AM)');
};

/**
 * Cleanup old completed/cancelled slots
 * Runs weekly on Sunday at 3 AM
 */
export const scheduleSlotCleanup = () => {
  cron.schedule('0 3 * * 0', async () => {
    console.log('[CRON] Starting slot cleanup...');

    try {
      const thirtyDaysAgo = addDays(new Date(), -30);

      const result = await prisma.availabilitySlot.deleteMany({
        where: {
          status: {
            in: ['COMPLETED', 'CANCELLED']
          },
          endDateTime: {
            lt: thirtyDaysAgo
          }
        }
      });

      console.log(`[CRON] Cleaned up ${result.count} old slots`);

      await logJobExecution({
        jobName: 'slot_cleanup',
        status: 'SUCCESS',
        slotsDeleted: result.count
      });

    } catch (error) {
      console.error('[CRON] Error in slot cleanup job:', error);
      
      await logJobExecution({
        jobName: 'slot_cleanup',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, {
    timezone : "Asia/Kolkata"
  });

  console.log('[CRON] Slot cleanup job scheduled (weekly on Sunday at 3:00 AM)');
};

/**
 * Mark past available slots as completed
 * Runs every hour
 */
export const scheduleSlotStatusUpdate = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Updating past slot statuses...');

    try {
      const now = new Date();

      // Update available slots that are in the past to COMPLETED
      const result = await prisma.availabilitySlot.updateMany({
        where: {
          status: 'AVAILABLE',
          endDateTime: {
            lt: now
          }
        },
        data: {
          status: 'COMPLETED'
        }
      });

      if (result.count > 0) {
        console.log(`[CRON] Updated ${result.count} past available slots to COMPLETED`);
      }

    } catch (error) {
      console.error('[CRON] Error in slot status update job:', error);
    }
  },
{
    timezone : "Asia/Kolkata"
});

  console.log('[CRON] Slot status update job scheduled (hourly)');
};

/**
 * Initialize all cron jobs
 */
export const initializeCronJobs = () => {
  scheduleSlotGeneration();
  scheduleSlotCleanup();
  scheduleSlotStatusUpdate();
  
  console.log('[CRON] All cron jobs initialized successfully');
};

// Helper function to log job execution
async function logJobExecution(data: any) {
  try {
    // If you create a JobLog model, use it here
    // await prisma.jobLog.create({ data: { ...data, executedAt: new Date() } });
    
    // For now, just console log
    console.log('[CRON] Job execution logged:', data);
  } catch (error) {
    console.error('[CRON] Error logging job execution:', error);
  }
}