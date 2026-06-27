import { Request, Response } from "express";
import ApiResponse from "../../../shared/utils/ApiResponse";
import { aiService } from "./ai.service";
import { ToolRequestDto, VentTextRequestDto, VentVoiceRequestDto } from "./ai.dto";

export const aiController = {
  async ventText(req: Request, res: Response) {
    try {
      const body = req.body as VentTextRequestDto;
      if (!body.message || !body.message.trim()) {
        return res
          .status(400)
          .json(new ApiResponse(false, 400, "message is required"));
      }

      const response = await aiService.processVentText(body);
      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Vent text processed successfully", response));
    } catch (error) {
      return res.status(500).json(
        new ApiResponse(false, 500, (error as Error).message || "Internal server error")
      );
    }
  },

  async ventVoice(req: Request, res: Response) {
    try {
      const body = req.body as VentVoiceRequestDto;
      if (!body.transcript && !body.audioUrl) {
        return res.status(400).json(
          new ApiResponse(false, 400, "transcript or audioUrl is required")
        );
      }

      const response = await aiService.processVentVoice(body);
      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Vent voice processed successfully", response));
    } catch (error) {
      return res.status(500).json(
        new ApiResponse(false, 500, (error as Error).message || "Internal server error")
      );
    }
  },

  async runTool(req: Request, res: Response) {
    try {
      const body = req.body as ToolRequestDto;
      if (!body.tool) {
        return res.status(400).json(new ApiResponse(false, 400, "tool is required"));
      }

      const response = await aiService.executeTool(body.tool, body.input);
      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Tool executed successfully", response));
    } catch (error) {
      return res.status(500).json(
        new ApiResponse(false, 500, (error as Error).message || "Internal server error")
      );
    }
  },
};
