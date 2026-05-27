import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { createCategory } from "./category.controller";
import ApiError from "../../../../shared/utils/ApiError";

vi.mock("./category.service");
vi.mock("../../../../shared/utils/ApiResponse");

describe("Category Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createCategory", () => {
    it("should create category successfully", async () => {
      const { createCategoryService } = await import("./category.service");
      const mockCategory = {
        id: "cat-123",
        name: "Mental Health",
        description: "Mental health related content",
      };

      (createCategoryService as any).mockResolvedValue(mockCategory);

      mockReq.body = {
        name: "Mental Health",
        description: "Mental health related content",
        imageUrl: "https://example.com/image.jpg",
      };

      await createCategory(mockReq as Request, mockRes as Response);

      expect(createCategoryService).toHaveBeenCalledWith({
        name: "Mental Health",
        description: "Mental health related content",
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should handle ApiError from service", async () => {
      const { createCategoryService } = await import("./category.service");
      const apiError = new ApiError(500, "Something went wrong while creating category");
      (createCategoryService as any).mockRejectedValue(apiError);

      mockReq.body = {
        name: "Duplicate Category",
        description: "This might already exist",
      };

      await createCategory(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should handle generic errors", async () => {
      const { createCategoryService } = await import("./category.service");
      (createCategoryService as any).mockRejectedValue(new Error("Database error"));

      mockReq.body = {
        name: "Test Category",
        description: "Test",
      };

      await createCategory(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it("should pass only name and description to service", async () => {
      const { createCategoryService } = await import("./category.service");
      (createCategoryService as any).mockResolvedValue({});

      mockReq.body = {
        name: "Category",
        description: "Description",
        imageUrl: "https://example.com/image.jpg",
        extraField: "should be ignored",
      };

      await createCategory(mockReq as Request, mockRes as Response);

      expect(createCategoryService).toHaveBeenCalledWith({
        name: "Category",
        description: "Description",
      });
      expect(createCategoryService).not.toHaveBeenCalledWith(
        expect.objectContaining({ imageUrl: expect.any(String) })
      );
    });
  });
});
