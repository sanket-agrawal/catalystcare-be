import { BlobServiceClient } from "@azure/storage-blob";
import { azureConfig } from "../../shared/config/azure.config";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  azureConfig.connectionString
);

export const uploadFileToAzureBlob = async (
  buffer: Buffer,
  blobName: string,
  contentType: string,
  containerName = azureConfig.container
) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists({ access: "container" });

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType
    }
  });

  return blockBlobClient.url;
};
