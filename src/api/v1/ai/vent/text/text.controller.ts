import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { VentTextSchema } from "./text.validator";
import { VentContextService } from "./text.service";
import { VentLLMService } from "./text.llm.service";
import { VentPersistenceService } from "./text.persistence";
import { VentMessage, VentTextResponse } from "./text.types";
import ApiResponse from "../../../../../shared/utils/ApiResponse";
import ApiError from "../../../../../shared/utils/ApiError";

export class VentController {
  constructor(
    private contextService: VentContextService,
    private llmService: VentLLMService,
    private persistenceService: VentPersistenceService
  ) {}

  /**
   * POST /api/v1/extension/vent/text
   */
  ventText = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = VentTextSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(new ApiResponse(false,400,"Validation failed",parsed.error.flatten().fieldErrors));
        return;
      }

      const { message, sessionId: incomingSessionId } = parsed.data;
      const userId = req.user!.id;
      const sessionId = incomingSessionId ?? uuidv4();

      // Parallel fetch: recent convo context (Redis/PG) + long-term user summary (PG)
      const [history, userSummary] = await Promise.all([
        this.contextService.getContextMessages(userId, sessionId),
        this.persistenceService.getUserSummary(userId),
      ]);

      // LLM call with full context
      const llmResponse = await this.llmService.processVentMessage(message, history, userSummary);

      if (llmResponse.valid && llmResponse.reply) {
        const newMessages: VentMessage[] = [
          { role: "user", content: message, timestamp: Date.now() },
          { role: "assistant", content: llmResponse.reply, timestamp: Date.now() },
        ];

        // Write to Redis + Postgres in parallel — don't block response on either
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
        reply,
        isValid: llmResponse.valid,
      };

      res.status(200).json(new ApiResponse(true, 200,"Vent Reply Successfully",response));
    } catch (error) {
       console.log('Fetching vent response failed', error);
              if(error instanceof ApiError){
                  res.status(error.statusCode).json(new ApiResponse(false, error.statusCode,error.message));
              }else{
                  res.status(500).json(new ApiResponse(false, 500,"Something went wrong while fetching vent response"));
              }
    }
  };

  /**
   * DELETE /api/v1/extension/vent/session/:sessionId
   * Clears Redis cache — Postgres history is always preserved
   */
  clearSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.params;
      await this.contextService.deleteSession(req.user!.id, sessionId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}