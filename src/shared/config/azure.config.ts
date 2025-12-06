import dotenv from 'dotenv';
dotenv.config();

export const azureConfig = {
  connectionString: process.env.AZURE_CONNECTION_STRING!,
  container: process.env.AZURE_BLOB_CONTAINER!,
};