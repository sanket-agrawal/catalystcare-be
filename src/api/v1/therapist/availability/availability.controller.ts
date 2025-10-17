// src/controllers/availability.controller.ts

import { Request, Response, NextFunction } from 'express';
import { availabilityService } from './availability.service';
import { DayOfWeek } from '@prisma/client';
import { parseISO, addDays } from 'date-fns';

export class AvailabilityController {
  /**
   * POST /api/therapists/:therapistId/availability
   * Create recurring availability for therapist
   */
  async createAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId } = req.params;
      const { dayOfWeek, startTime, endTime, slotDuration, effectiveFrom, effectiveTo } = req.body;

      // Authorization check: ensure therapist can only create their own availability
      // req.user should be populated by auth middleware
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Cannot modify other therapist availability' });
      }

      const availability = await availabilitySlotService.createAvailability({
        therapistId,
        dayOfWeek: dayOfWeek as DayOfWeek,
        startTime,
        endTime,
        slotDuration,
        effectiveFrom: effectiveFrom ? parseISO(effectiveFrom) : undefined,
        effectiveTo: effectiveTo ? parseISO(effectiveTo) : undefined
      });

      // Generate slots for next 30 days
      const today = new Date();
      await availabilitySlotService.generateSlots({
        therapistId,
        startDate: today,
        endDate: addDays(today, 30)
      });

      res.status(201).json({
        success: true,
        data: availability,
        message: 'Availability created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/therapists/:therapistId/availability/generate-slots
   * Manually trigger slot generation
   */
  async generateSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId } = req.params;
      const { startDate, endDate, daysAhead } = req.body;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const start = startDate ? parseISO(startDate) : new Date();
      const end = endDate ? parseISO(endDate) : addDays(start, daysAhead || 30);

      const result = await availabilitySlotService.generateSlots({
        therapistId,
        startDate: start,
        endDate: end
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Slots generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/therapists/:therapistId/available-slots
   * Get available slots for a therapist
   */
  async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId } = req.params;
      const { startDate, endDate, daysAhead } = req.query;

      const start = startDate ? parseISO(startDate as string) : new Date();
      const end = endDate ? parseISO(endDate as string) : addDays(start, parseInt(daysAhead as string) || 30);

      const slots = await availabilitySlotService.getAvailableSlots(therapistId, start, end);

      res.status(200).json({
        success: true,
        data: slots
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/therapists/:therapistId/profile-with-availability
   * Get therapist profile with available slots
   */
  async getProfileWithAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId } = req.params;
      const { daysAhead } = req.query;

      const data = await availabilitySlotService.getTherapistWithAvailability(
        therapistId,
        daysAhead ? parseInt(daysAhead as string) : 30
      );

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/therapists/:therapistId/availability
   * Get all availability rules for a therapist
   */
  async getAvailabilityRules(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId } = req.params;

      const availabilities = await prisma.therapistAvailability.findMany({
        where: {
          therapistId,
          isActive: true
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });

      res.status(200).json({
        success: true,
        data: availabilities
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/therapists/:therapistId/availability/:availabilityId
   * Update availability rule
   */
  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId, availabilityId } = req.params;
      const updateData = req.body;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const updated = await availabilitySlotService.updateAvailability(availabilityId, updateData);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Availability updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/therapists/:therapistId/availability/:availabilityId
   * Delete availability rule
   */
  async deleteAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId, availabilityId } = req.params;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await availabilitySlotService.deleteAvailability(availabilityId);

      res.status(200).json({
        success: true,
        message: 'Availability deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/therapists/:therapistId/slots/:slotId/block
   * Block a specific slot
   */
  async blockSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId, slotId } = req.params;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const slot = await availabilitySlotService.blockSlot(slotId);

      res.status(200).json({
        success: true,
        data: slot,
        message: 'Slot blocked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/therapists/:therapistId/slots/:slotId/unblock
   * Unblock a specific slot
   */
  async unblockSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistId, slotId } = req.params;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const slot = await availabilitySlotService.unblockSlot(slotId);

      res.status(200).json({
        success: true,
        data: slot,
        message: 'Slot unblocked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();