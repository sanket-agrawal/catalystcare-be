// src/controllers/availability.controller.ts

import { Request, Response, NextFunction } from 'express';
import { availabilityService } from './availability.service';
import { DayOfWeek } from './availability.dto';
import { parseISO, addDays } from 'date-fns';
import {prisma} from "../../../../infrastructure/prisma/client"
import ApiError from '../../../../shared/utils/ApiError';
import ApiResponse from '../../../../shared/utils/ApiResponse';

export class AvailabilityController {
  /**
   * POST /api/therapists/:therapistId/availability
   * Create recurring availability for therapist
   */
  async createAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistProfileId : therapistId } = req.user;
      const { availabilities } = req.body;

      // Authorization check: ensure therapist can only create their own availability
      // req.user should be populated by auth middleware
      if (req.user?.role !== 'THERAPIST') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Cannot modify other therapist availability' });
      }

      const availability = await availabilityService.createMultipleAvailabilities({
        therapistId,
        availabilities : availabilities
      });

      res.status(201).json( new ApiResponse(
        true,
        201,
        'Availability Created Sucessfully',
        availability
      ));
    } catch (error) {
      console.log("Error in CreateAvailabilty",error);
      if(error instanceof ApiError){
        res.status(error.statusCode).json(
          new ApiResponse(false,error.statusCode,error.message)
        )
      }else{
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
      }
    }
  }

  /**
   * POST /api/therapists/:therapistId/availability/generate-slots
   * Manually trigger slot generation
   */
  async generateSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistProfileId : therapistId } = req.user;
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

      const result = await availabilityService.generateSlots({
        therapistId,
        startDate: start,
        endDate: end
      });

            res.status(201).json( new ApiResponse(
        true,
        200,
        'Slots generated successfully',
        result
      ));
    } catch (error) {
       console.log("Error in CreateAvailabilty",error);
      if(error instanceof ApiError){
        res.status(error.statusCode).json(
          new ApiResponse(false,error.statusCode,error.message)
        )
      }else{
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
      }
    }
  }

  /**
   * GET /api/therapists/:therapistId/available-slots
   * Get available slots for a therapist
   */
  async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
     
      const { therapistProfileId : therapistId} = req.user;

      const slots = await availabilityService.getAvailableSlots(therapistId);

      res.status(200).json({
        success: true,
        data: slots
      });
    } catch (error) {
      console.log("Error in Fetching Available slots",error);
      if(error instanceof ApiError){
        res.status(error.statusCode).json(
          new ApiResponse(false,error.statusCode,error.message)
        )
      }else{
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
      }
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

      const data = await availabilityService.getTherapistWithAvailability(
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
      const { therapistProfileId : therapistId } = req.user;

      const {availabilityByDay, timelineData} = await availabilityService.fetchAvailabilityRules(therapistId)
      res.status(200).json( new ApiResponse(
        true,
        200,
        'Availability fetched successfully',
        {
          availabilities : availabilityByDay,
          timelineData 
        }
      ));
    } catch (error) {
      console.log("Error in Fetching Availability Rules",error);
      if(error instanceof ApiError){
        res.status(error.statusCode).json(
          new ApiResponse(false,error.statusCode,error.message)
        )
      }else{
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
      }
    }
  }

  /**
   * PATCH /api/therapists/:therapistId/availability/:availabilityId
   * Update availability rule
   */
  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistProfileId : therapistId } = req.user;
      const { availabilityId } = req.params;
      const updateData = req.body;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json(new ApiResponse(false,403,'Unauthorized'));
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json(new ApiResponse(false,403,'Unauthorized'));
      }

      const updated = await availabilityService.updateAvailability(availabilityId, updateData,therapistId);

      res.status(200).json( new ApiResponse(
        true,
        200,
        'Availability updated successfully',
        updated,
      ));
    } catch (error) {
      console.log("Error in Updating Availability",error);
      if(error instanceof ApiError){
        res.status(error.statusCode).json(
          new ApiResponse(false,error.statusCode,error.message)
        )
      }else{
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
      }
    }
  }

  /**
   * DELETE /api/therapists/:therapistId/availability/:availabilityId
   * Delete availability rule
   */
  async deleteAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapistProfileId : therapistId } = req.user;
      const { availabilityId } = req.params;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json(new ApiResponse(false,403,'Unauthorized'));
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json(new ApiResponse(false,403,'Unauthorized'));
      }

      await availabilityService.deleteAvailability(availabilityId, therapistId);

      res.status(200).json(new ApiResponse(
        true,
        200,
        'Availability deleted successfully'
      ));
    } catch (error) {
      console.log("Error in Deleting Availability",error);
      if(error instanceof ApiError){
        res.status(error.statusCode).json(
          new ApiResponse(false,error.statusCode,error.message)
        )
      }else{
        res.status(400).json(new ApiResponse(false, 400, "Something went wrong"))
      }
    }
  }

  /**
   * POST /api/therapists/:therapistId/slots/:slotId/block
   * Block a specific slot
   */
  async blockSlot(req: Request, res: Response, next: NextFunction) {
    try {

      const { therapistProfileId : therapistId } = req.user;
      const { slotId } = req.params;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const slot = await availabilityService.blockSlot(slotId);

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
      const { therapistProfileId : therapistId } = req.user;
      const { slotId } = req.params;

      // Authorization check
      if (req.user?.role !== 'THERAPIST' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (req.user?.role === 'THERAPIST' && req.user?.therapistProfileId !== therapistId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const slot = await availabilityService.unblockSlot(slotId);

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