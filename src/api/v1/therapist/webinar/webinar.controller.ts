import { Request, Response } from "express";
import WebinarService from "./webinar.service";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import ApiError from "../../../../shared/utils/ApiError";

const WebinarController = {

  create: async (req: Request, res: Response) => {
    try {
      const { therapistProfileId } = req.user;
      const webinar = await WebinarService.createWebinar(
        therapistProfileId,
        req.body
      );

      res.status(201).json(
        new ApiResponse(true, 201, "Webinar created", webinar)
      );

    } catch (error) {
      handleError(error, res);
    }
  },

  fetchAll: async (req: Request, res: Response) => {
    try {
      const { therapistProfileId } = req.user;
      const webinars = await WebinarService.fetchAll(therapistProfileId);

      res.json(new ApiResponse(true, 200, "Webinars fetched", webinars));

    } catch (error) {
      handleError(error, res);
    }
  },

  fetchById: async (req: Request, res: Response) => {
    try {
      const { therapistProfileId } = req.user;
      const webinar = await WebinarService.fetchById(
        therapistProfileId,
        req.params.id
      );

      res.json(new ApiResponse(true, 200, "Webinar fetched", webinar));

    } catch (error) {
      handleError(error, res);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { therapistProfileId } = req.user;

      const webinar = await WebinarService.updateWebinar(
        therapistProfileId,
        req.params.id,
        req.body
      );

      res.json(new ApiResponse(true, 200, "Webinar updated", webinar));

    } catch (error) {
      handleError(error, res);
    }
  },

  publish: async (req: Request, res: Response) => {
    try {
      const { therapistProfileId } = req.user;

      const webinar = await WebinarService.publishWebinar(
        therapistProfileId,
        req.params.id
      );

      res.json(new ApiResponse(true, 200, "Webinar published", webinar));

    } catch (error) {
      handleError(error, res);
    }
  },

  unpublish: async (req: Request, res: Response) => {
    try {
      const { therapistProfileId } = req.user;

      const webinar = await WebinarService.unpublishWebinar(
        therapistProfileId,
        req.params.id
      );

      res.json(new ApiResponse(true, 200, "Webinar unpublished", webinar));

    } catch (error) {
      handleError(error, res);
    }
  }
};

export default WebinarController;


function handleError(error: any, res: Response) {
  console.error(error);
  if (error instanceof ApiError)
    return res.status(error.statusCode).json(
      new ApiResponse(false, error.statusCode, error.message)
    );

  return res.status(500).json(
    new ApiResponse(false, 500, "Internal Server Error")
  );
}