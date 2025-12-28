import { Request, Response } from "express";
import { emailService } from "./email.service";
import ApiResponse from "../../../shared/utils/ApiResponse";
import ApiError from "../../../shared/utils/ApiError";
import { emailBlastQueue } from "../../../infrastructure/queues";

export const emailController = {
    emailBlast : async (req: Request, res: Response) => {
  try {
    const { target, subject, content, reason, singleEmail } = req.body;

    const csvFile = req.file;

    const payload = await emailService.emailBlastService({
      target,
      subject,
      content,
      csvFile,
      reason,
      adminId : req.user.id,
      singleEmail
    });

    // Add job to queue
    // const job = await emailBlastQueue.add("email-blast", payload);

    return res.status(200).json(
      new ApiResponse(
        true,
        200,
        "Email blast initiated successfully",
        // { jobId: job.id }
      )
    );
  } catch (error) {
    console.error("Error in email blast:", error);

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json(new ApiResponse(false, error.statusCode, error.message));
    }

    return res
      .status(500)
      .json(new ApiResponse(false, 500, "Internal Server Error"));
  }
}
}