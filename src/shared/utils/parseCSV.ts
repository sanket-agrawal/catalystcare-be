import fs from "fs";
import csv from "csv-parser";
import { Readable } from "stream";

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

export const parseCSVBuffer = async (buffer: Buffer): Promise<string[]> =>
  new Promise((resolve, reject) => {
    const emails: string[] = [];

    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => {
        if (row.email && validateEmail(row.email)) {
          emails.push(row.email.trim().toLowerCase());
        }
       
        if (!Object.keys(row).includes("email")) {
          throw new Error("CSV must contain 'email' column");
        }
      })
      .on("end", () => resolve([...new Set(emails)])) // de-duplication
      .on("error", reject);
  });

