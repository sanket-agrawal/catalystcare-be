import express from "express";
import ProgramBookingController from "./programBooking.controller";

const router = express.Router();

router.get("/bookings",ProgramBookingController.fetchProgramBookings);
router.post("/book-slot",ProgramBookingController.bookSlot);

export default router;