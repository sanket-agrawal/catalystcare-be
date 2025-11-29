import { parseCSV } from "../../../shared/utils/parseCSV";
import ApiError from "../../../shared/utils/ApiError";

interface EmailBlastPayload {
  target: string;
  subject: string;
  content: string;
  csvFile?: Express.Multer.File | undefined;
}

export const emailService = {
    emailBlastService : async ({
  target,
  subject,
  content,
  csvFile,
}: EmailBlastPayload) => {
  try {
    if (!target || !subject || !content) {
      throw new ApiError(400, "Target, subject & content are required");
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
      target,
      subject,
      content,
      csvEmails,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to prepare email blast payload");
  }
}
}