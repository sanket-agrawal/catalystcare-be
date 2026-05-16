import { Request, Response, NextFunction } from "express";
import { VentTextSchema, VentSessionSchema } from "./text.validator";
import { VentContextService } from "./text.service";
import { VentLLMService } from "./text.llm.service";
import { VentPersistenceService } from "./text.persistence";
import { VentMessage, VentTextResponse } from "./text.types";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import ApiError from "../../../../../shared/utils/ApiError";
import { INDIAN_HELPLINES } from "./text.helplines";

export class VentController {
  constructor(
    private contextService: VentContextService,
    private llmService: VentLLMService,
    private persistenceService: VentPersistenceService
  ) {}

  // ─── Session endpoints ─────────────────────────────────────────

  createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.persistenceService.createSession(req.user!.id);
      res.status(201).json(new ApiResponse(true, 201, "Session created", result));
    } catch (error) {
       res.status(404).json(new ApiResponse(false, 400, "Error Creating Session"));
    }
  };

  getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessions = await this.persistenceService.getUserSessions(req.user!.id);
      res.status(200).json(new ApiResponse(true, 200, "Sessions fetched", sessions));
    } catch (error) {
      res.status(404).json(new ApiResponse(false, 400, "Error Getting Session"));
    }
  };

  getSessionMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const messages = await this.persistenceService.getSessionMessages(req.user!.id, sessionId);
      res.status(200).json(new ApiResponse(true, 200, "Messages fetched", messages));
    } catch (error) {
      res.status(404).json(new ApiResponse(false, 400, "Error Getting Messages"));
    }
  };

  deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      await this.persistenceService.deleteSession(req.user!.id, sessionId);
      await this.contextService.deleteSession(req.user!.id, sessionId); // clear Redis too
      res.status(200).json(new ApiResponse(true, 200, "Session deleted"));
    } catch (error) {
      res.status(404).json(new ApiResponse(false, 400, "Error Deleting Session"));
    }
  };

  // ─── Messaging ─────────────────────────────────────────────────

  ventText = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = VentTextSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(new ApiResponse(false, 400, "Validation failed", parsed.error.flatten().fieldErrors));
        return;
      }

      const { message, sessionId } = parsed.data;
      const userId = req.user!.id;

      // Verify this session belongs to the user
      const isOwner = await this.persistenceService.verifySessionOwner(userId, sessionId);
      if (!isOwner) {
        res.status(404).json(new ApiResponse(false, 404, "Session not found"));
        return;
      }

      const [history, userSummary, userName] = await Promise.all([
        this.contextService.getContextMessages(userId, sessionId),
        this.persistenceService.getUserSummary(userId),
         this.persistenceService.getUserFirstName(userId),
      ]);

      const llmResponse = await this.llmService.processVentMessage(message, history, userSummary, userName);

      const isCrisis = llmResponse.isCrisis ?? false;

      const shouldStore = llmResponse.valid;

      if (shouldStore && llmResponse.reply) {
        const newMessages: VentMessage[] = [
          { role: "user", content: message, timestamp: Date.now() },
          { role: "assistant", content: llmResponse.reply, timestamp: Date.now() },
        ];

        await Promise.all([
          this.contextService.appendMessages(userId, sessionId, newMessages),
          this.persistenceService.persistMessages(userId, sessionId, message, llmResponse.reply),
        ]);
      }

      const reply = llmResponse.valid
        ? llmResponse.reply!
        : (llmResponse.message ?? "I'm here for your emotional wellbeing. Feel free to share what's on your mind.");

      const response: VentTextResponse = {
  sessionId,
  reply: llmResponse.valid
    ? llmResponse.reply!
    : (llmResponse.message ?? "I'm here for your emotional wellbeing."),
  isValid: llmResponse.valid,
  isCrisis,
  helplines: isCrisis ? INDIAN_HELPLINES : undefined,
};
      res.status(200).json(new ApiResponse(true, 200, "Vent Reply Successfully", response));
    } catch (error) {
      console.error("Fetching vent response failed", error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
      } else {
        res.status(500).json(new ApiResponse(false, 500, "Something went wrong while fetching vent response"));
      }
    }
  };
}