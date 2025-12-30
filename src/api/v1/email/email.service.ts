import { parseCSV, parseCSVBuffer } from "../../../shared/utils/parseCSV";
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

    if(target === "SINGLE_EMAIL" && !singleEmail){
      throw new ApiError(400, "Single email is required for SINGLE_EMAIL target");
    }

    if(target === "CUSTOM_CSV" && !csvFile){
      throw new ApiError(400, "CSV file is required for CUSTOM_CSV target");
    }

    let csvEmails: string[] = [];

    if (target === "CUSTOM_CSV") {
      if (!csvFile) throw new ApiError(400, "CSV file is required");

      csvEmails = await parseCSVBuffer(csvFile.buffer);

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