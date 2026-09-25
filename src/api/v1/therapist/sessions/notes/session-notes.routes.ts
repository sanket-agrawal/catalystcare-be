import express from "express";
import SessionNotesController from "./session-notes.controller";
import { validateRequest } from "../../../../../shared/middlewares/validate";
import { createSessionNoteSchema, updateSessionNoteSchema } from "./session-notes.dto";

const router = express.Router();

// POST   /api/v1/therapist/sessions/notes
router.post("/", validateRequest(createSessionNoteSchema), SessionNotesController.createNote);

// GET    /api/v1/therapist/sessions/notes
router.get("/", SessionNotesController.listNotes);

// GET    /api/v1/therapist/sessions/notes/booking/:bookingId
router.get("/booking/:bookingId", SessionNotesController.getNoteByBooking);

// GET    /api/v1/therapist/sessions/notes/:noteId
router.get("/:noteId", SessionNotesController.getNote);

// PATCH  /api/v1/therapist/sessions/notes/:noteId
router.patch(
  "/:noteId",
  validateRequest(updateSessionNoteSchema),
  SessionNotesController.updateNote
);

// DELETE /api/v1/therapist/sessions/notes/:noteId
router.delete("/:noteId", SessionNotesController.deleteNote);

export default router;
