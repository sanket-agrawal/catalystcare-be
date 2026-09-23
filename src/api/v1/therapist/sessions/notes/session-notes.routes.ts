import express from "express";
import SessionNotesController from "./session-notes.controller";
import { validateRequest } from "../../../../../shared/middlewares/validate";
import {
  createSessionNoteSchema,
  updateSessionNoteSchema,
} from "./session-notes.dto";

const router = express.Router();

// POST   /api/v1/therapist/sessions/notes
router.post(
  "/",
  validateRequest(createSessionNoteSchema),
  SessionNotesController.createNote
);



// PATCH  /api/v1/therapist/sessions/notes/:noteId
router.patch(
  "/:noteId",
  validateRequest(updateSessionNoteSchema),
  SessionNotesController.updateNote
);

// DELETE /api/v1/therapist/sessions/notes/:noteId
router.delete("/:noteId", SessionNotesController.deleteNote);

export default router;
