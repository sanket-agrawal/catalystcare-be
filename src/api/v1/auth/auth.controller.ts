import { Request, Response } from "express";
import { registerUserService, verifyOTPService } from "./auth.service";
import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const user = await registerUserService(req.body);

    res
      .status(201)
      .json(new ApiResponse(201, "User registered successfully", user));
  } catch (error) {
    console.error("Register Error:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOTPService(email, otp);
    res
      .status(200)
      .json(new ApiResponse(200, "OTP verified successfully", result));
  } catch (error) {
        console.error("Register Error:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
