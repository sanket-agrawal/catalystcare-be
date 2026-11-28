import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { fetchAllCategories, fetchCategoryDetailsBySlug } from "./website.controller";
import * as websiteService from "./website.service";

vi.mock("./website.service", () => ({
  getAllCategories: vi.fn(),
  fetchCategoryBySlugService: vi.fn(),
  fetchTherapistProfileService: vi.fn(),
  fetchTherapistBySlugService: vi.fn(),
  createSlotNotificationRequestService: vi.fn(),
}));

describe("Website Controller - Category Endpoints", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
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

  describe("fetchAllCategories", () => {
    it("should return categories with status 200", async () => {
      const mockCategories = [
        { slug: "anxiety-stress", name: "Anxiety & Stress", h1: "Therapy for Anxiety & Stress" },
      ];
      vi.mocked(websiteService.getAllCategories).mockResolvedValue(mockCategories as any);

      await fetchAllCategories(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 200,
          data: mockCategories,
        })
      );
    });
  });

  describe("fetchCategoryDetailsBySlug", () => {
    it("should return category details with status 200 when found", async () => {
      const mockCategory = {
        slug: "anxiety-stress",
        name: "Anxiety & Stress",
        h1: "Therapy for Anxiety & Stress, Online Across India",
        therapists: [],
      };
      mockReq.params = { slug: "anxiety-stress" };
      mockReq.query = { focus: "social-anxiety" };

      vi.mocked(websiteService.fetchCategoryBySlugService).mockResolvedValue(mockCategory as any);

      await fetchCategoryDetailsBySlug(mockReq as Request, mockRes as Response);

      expect(websiteService.fetchCategoryBySlugService).toHaveBeenCalledWith(
        "anxiety-stress",
        "social-anxiety"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 200,
          data: mockCategory,
        })
      );
    });

    it("should return 404 when category is not found", async () => {
      mockReq.params = { slug: "unknown-slug" };
      vi.mocked(websiteService.fetchCategoryBySlugService).mockResolvedValue(null);

      await fetchCategoryDetailsBySlug(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          message: "Category not found",
        })
      );
    });
  });
});
