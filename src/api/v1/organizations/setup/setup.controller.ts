import { Request, Response } from "express";
import ApiResponse from "../../../../shared/utils/ApiResponse";
import ApiError from "../../../../shared/utils/ApiError";
import SetupService from "./setup.service";

const SetupController = {

  // ── 1. Validate setup token ──────────────────────────────────
  // Called by frontend as soon as the contact lands on /org-setup?token=
  // Tells frontend: is this token valid? what org is it for?
  validateSetupToken: async (req: Request, res: Response) => {
    try {
      const { token } = req.query as { token: string };

      if (!token) {
        return res
          .status(400)
          .json(new ApiResponse(false, 400, "Setup token is required"));
      }

      const result = await SetupService.validateSetupToken(token);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Token is valid", result));
    } catch (error) {
      console.error("Error validating setup token:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  // ── 2. Submit org admin email ────────────────────────────────
  // Contact fills the form on /org-setup — enters the email of whoever
  // should be the ORG_ADMIN. Platform sends them an invite.
  // Requires req.user to be a platform admin (protect with admin middleware).
  submitOrgAdminEmail: async (req: Request, res: Response) => {
    try {
      const { token } = req.query as { token: string };

      if (!token) {
        return res
          .status(400)
          .json(new ApiResponse(false, 400, "Setup token is required"));
      }

      // req.user is the platform admin who is acting on behalf
      // (if this endpoint is hit from the org-setup page by the contact
      //  without auth, swap req.user?.id for a dedicated system/admin id)

      const result = await SetupService.submitOrgAdminEmail(
        token,
        req.body
      );

      return res
        .status(200)
        .json(new ApiResponse(true, 200, result.message));
    } catch (error) {
      console.error("Error submitting org admin email:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  // ── 3. Validate invite token ─────────────────────────────────
  // Called when the invited admin opens /org-invite?token=
  // Returns: email, orgName, role, userExists
  // Frontend uses userExists to decide: show signup form or login redirect
  validateInviteToken: async (req: Request, res: Response) => {
    try {
      const { token } = req.query as { token: string };

      if (!token) {
        return res
          .status(400)
          .json(new ApiResponse(false, 400, "Invite token is required"));
      }

      const result = await SetupService.validateInviteToken(token);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Invite is valid", result));
    } catch (error) {
      console.error("Error validating invite token:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },

  // ── 4. Accept org invite ─────────────────────────────────────
  // Called after the invited user has authenticated (signed up or logged in).
  // Frontend passes the invite token + the now-authenticated userId.
  // Protect this route with your normal auth middleware.
  acceptOrgInvite: async (req: Request, res: Response) => {
    try {
      const result = await SetupService.acceptOrgInvite(req.body);

      return res
        .status(200)
        .json(new ApiResponse(true, 200, "Organization setup complete", result));
    } catch (error) {
      console.error("Error accepting org invite:", error);
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(new ApiResponse(false, error.statusCode, error.message));
      }
      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal Server Error"));
    }
  },
};

export default SetupController;