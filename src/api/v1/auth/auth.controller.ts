import { Request, Response } from "express";
import {
  forgotPasswordService,
  loginService,
  logoutService,
  refreshTokenService,
  registerUserService,
  resetPasswordService,
  verifyForgotPasswordOTPService,
  verifyOTPService,
} from "./auth.service";
import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";
import { googleSignInService } from "../../../infrastructure/google/googleSignin.service";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../../../shared/utils/refreshToken.service";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const result = await registerUserService(req.body);

    if (result.alreadyRegistered) {
      return res.status(200).json(
        new ApiResponse(true, 200, "User already registered. Please login.", {
          alreadyRegistered: true,
        })
      );
    }

    res.status(201).json(new ApiResponse(true, 201, "OTP Sent Sucessfully"));
  } catch (error) {
    console.error("Register Error:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const result = await verifyOTPService(req.body);

    if (result?.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }

    res.status(200).json(
      new ApiResponse(true, 200, "OTP verified and user logged in", {
        token: result?.token,
        user: result?.user,
      })
    );
  } catch (error) {
    console.error("Verify OTP Controller Error:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, source } = req.body;

    const result = await loginService(email, password, source);

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json(
      new ApiResponse(true, 200, result.message, {
        token: result.token,
        user: result.user,
      })
    );
  } catch (error) {
    console.error("Login Error:", error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    await forgotPasswordService(req.body.email);
    res.status(200).json(new ApiResponse(true, 200, "Otp Sent Successfully"));
  } catch (error) {
    console.error("Forgot Password Error:", error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword, confirmPassword, email } = req.body;
    await resetPasswordService(newPassword, confirmPassword, email);
    res.status(200).json(new ApiResponse(true, 200, "Password reset sucessfull"));
  } catch (error) {
    console.log("Error in Reset Password", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
    }
  }
};

export const verifyForgotPasswordOTP = async (req: Request, res: Response) => {
  try {
    const status = await verifyForgotPasswordOTPService(req.body.email, req.body.otp);
    if (status) {
      res.status(200).json(new ApiResponse(true, 200, "OTP verified successfully"));
    } else {
      res.status(400).json(new ApiResponse(false, 400, "Invalid or expired OTP"));
    }
  } catch (error) {
    console.log("Error in Forgot Password OTP Verification", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(400).json(new ApiResponse(false, 400, "Something went wrong"));
    }
  }
};

export const googleSignin = async (req: Request, res: Response) => {
  try {
    const { idToken, source } = req.body;
    const result = await googleSignInService(idToken, source);

    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }

    res.status(200).json(
      new ApiResponse(true, 200, "Google Sign Successful", {
        token: result.token,
        user: result.user,
      })
    );
  } catch (error) {
    console.error("Google Signin Error:", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(500).json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json(new ApiResponse(false, 401, "No refresh token provided"));
    }

    const result = await refreshTokenService(token);

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json(
      new ApiResponse(true, 200, "Token refreshed", {
        token: result.token,
      })
    );
  } catch (error) {
    console.error("Refresh Token Error:", error);
    clearRefreshTokenCookie(res);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(new ApiResponse(false, error.statusCode, error.message));
    } else {
      res.status(401).json(new ApiResponse(false, 401, "Invalid or expired refresh token"));
    }
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await logoutService(token);
    }

    clearRefreshTokenCookie(res);

    res.status(200).json(new ApiResponse(true, 200, "Logged out successfully"));
  } catch (error) {
    console.error("Logout Error:", error);
    clearRefreshTokenCookie(res);
    res.status(200).json(new ApiResponse(true, 200, "Logged out successfully"));
  }
};
