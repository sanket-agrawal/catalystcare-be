import { parseCSV } from "../../../shared/utils/parseCSV";
import ApiError from "../../../shared/utils/ApiError";

interface EmailBlastPayload {
  target: string;
  subject: string;
  content: string;
  reason : string;
  adminId : string;
  csvFile?: Express.Multer.File | undefined;
  singleEmail? : string;
}

export const emailService = {
    emailBlastService : async ({
      reason,
  target,
  subject,
  content,
  csvFile,
  singleEmail,
  adminId
}: EmailBlastPayload) => {
  try {
    if (!target || !subject || !content || !reason) {
      throw new ApiError(400, "Target, subject & content, reason are required");
    }

    let csvEmails: string[] = [];

    if (target === "CUSTOM_CSV") {
      if (!csvFile) throw new ApiError(400, "CSV file is required");

      csvEmails = await parseCSV(csvFile.path);

      if (csvEmails.length === 0) {
        throw new ApiError(400, "No valid emails found in CSV");
      }
    }

    return {
      reason,
      singleEmail,
      target,
      subject,
      content,
      csvEmails,
      adminId
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to prepare email blast payload");
  }
}
}