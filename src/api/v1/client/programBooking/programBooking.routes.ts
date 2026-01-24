import express from "express";
import ProgramBookingController from "./programBooking.controller";

const router = express.Router();

router.get("/bookings",ProgramBookingController.fetchProgramBookings);
router.post("/book-slot",ProgramBookingController.bookSlot);
router.get('/fetch-purchase-by-id/:purchaseId',ProgramBookingController.fetchPurchaseById);

export default router;