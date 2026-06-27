import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCategoryService } from "./category.service";
import { prisma } from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";

vi.mock("../../../../infrastructure/prisma/client", () => ({
  prisma: {
    category: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("Category Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createCategoryService", () => {
    it("should create category successfully with valid input", async () => {
      const mockCategory = {
        id: "cat-123",
        name: "Stress Management",
        description: "Techniques to manage stress",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.category.create as any).mockResolvedValue(mockCategory);

      const result = await createCategoryService({
        name: "Stress Management",
        description: "Techniques to manage stress",
      });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Stress Management",
          description: "Techniques to manage stress",
        },
      });
      expect(result).toEqual(mockCategory);
      expect(result.id).toBe("cat-123");
      expect(result.name).toBe("Stress Management");
    });

    it("should create category with minimal data", async () => {
      const mockCategory = {
        id: "cat-456",
        name: "Anxiety",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.category.create as any).mockResolvedValue(mockCategory);

      const result = await createCategoryService({
        name: "Anxiety",
        description: "",
      });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Anxiety",
          description: "",
        },
      });
      expect(result).toEqual(mockCategory);
    });

    it("should throw ApiError on database error", async () => {
      (prisma.category.create as any).mockRejectedValue(new Error("Unique constraint violation"));

      await expect(
        createCategoryService({
          name: "Duplicate Category",
          description: "This already exists",
        })
      ).rejects.toThrow("Something went wrong while creating category");
    });

    it("should throw ApiError with status 500 on any error", async () => {
      (prisma.category.create as any).mockRejectedValue(new Error("Any error"));

      try {
        await createCategoryService({
          name: "Test",
          description: "Test",
        });
      } catch (error) {
        expect(error instanceof ApiError).toBe(true);
        expect((error as ApiError).statusCode).toBe(500);
      }
    });

    it("should handle null description", async () => {
      const mockCategory = {
        id: "cat-789",
        name: "Depression",
        description: null,
      };

      (prisma.category.create as any).mockResolvedValue(mockCategory);

      const result = await createCategoryService({
        name: "Depression",
        description: null as any,
      });

      expect(result).toEqual(mockCategory);
    });

    it("should pass exact data to prisma without modification", async () => {
      const categoryInput = {
        name: "Sleep Disorders",
        description: "Issues related to sleep",
      };

      (prisma.category.create as any).mockResolvedValue({
        id: "cat-sleep",
        ...categoryInput,
      });

      await createCategoryService(categoryInput);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: categoryInput,
      });
    });
  });
});
