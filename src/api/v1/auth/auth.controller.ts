import { Request, Response } from "express";
import { forgotPasswordService, loginService, registerUserService, resetPasswordService, verifyOTPService } from "./auth.service";
import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const user = await registerUserService(req.body);

    res
      .status(201)
      .json(new ApiResponse(true, 201, "OTP Sent Sucessfully"));
  } catch (error) {
    console.error("Register Error:", error);
    if (error instanceof ApiError) {
      res
      .status(error.statusCode)
      .json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res
      .status(500)
      .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOTPService(email, otp);

    res
      .status(200)
      .json(new ApiResponse(true, 200, "OTP verified and user logged in", result));
  } catch (error) {
    console.error("Verify OTP Controller Error:", error);
    if (error instanceof ApiError) {
      res
        .status(error.statusCode)
        .json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password);

    res
      .status(200)
      .json(new ApiResponse(true, 200, result.message, { 
        token: result.token,
        user: result.user 
      }));

  } catch (error) {
    console.error("Login Error:", error);

    if (error instanceof ApiError) {
      res
        .status(error.statusCode)
        .json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const forgotPassword = async (req : Request, res : Response) => {
  try {
    await forgotPasswordService(req.body.email);
    res.status(200).json(new ApiResponse(true,200,"Otp Sent Successfully"))
  } catch (error) {
    console.error("Forgot Password Error:", error);

    if (error instanceof ApiError) {
      res
        .status(error.statusCode)
        .json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
}

export const resetPassword = async (req : Request, res : Response) => {
  try {
    const { newPassword , confirmPassword, email } = req.body;
    await resetPasswordService(newPassword,confirmPassword,email) ;
    res.status(200).json(new ApiResponse(true,200,"Password reset sucessfull"))
  } catch (error) {
    console.log('Error in Reset Password',error);
    if(error instanceof ApiError){
      res.status(error.statusCode).json(new ApiResponse(false,error.statusCode,error.message))
    }else{
      res.status(400).json(new ApiResponse(false,400,'Something went wrong'))
    }
    
  }
}