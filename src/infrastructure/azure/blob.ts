import { BlobServiceClient } from "@azure/storage-blob";
import { azureConfig } from "../../shared/config/azure.config";
import ApiError from "../../shared/utils/ApiError";

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

export const deleteAzureBlob = async (blobPath: string, containerName = azureConfig.container): Promise<boolean> => {
  try {
    if (!blobPath) return false;

    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists({ access: "container" });

    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    // ✅ Safe delete (won't throw if blob not exists)
    const response = await blockBlobClient.deleteIfExists();

    return response.succeeded;
  } catch (error) {
    console.error("Azure delete blob failed:", error);
    throw new ApiError(500, "Failed to delete file from storage");
  }
};