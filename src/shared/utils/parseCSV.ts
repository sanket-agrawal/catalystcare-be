import fs from "fs";
import csv from "csv-parser";

export const parseCSV = async (filePath: string): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const emails: string[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.email && validateEmail(row.email)) {
          emails.push(row.email.trim());
        }
      })
      .on("end", () => resolve(emails))
      .on("error", reject);
  });

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
