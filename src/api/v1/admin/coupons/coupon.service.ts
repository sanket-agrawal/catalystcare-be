import { prisma } from "../../../../infrastructure/prisma/client";
import ApiError from "../../../../shared/utils/ApiError";
import { CreateCouponInput, UpdateCouponInput } from "./coupon.dto";
import { rupeesToPaise } from "../../../../shared/lib/money";
import { CouponStatus, DiscountType } from "@prisma/client";

export const adminCouponService = {
  createCoupon: async (data: CreateCouponInput, adminId: string) => {
    const code = data.code.toUpperCase().trim();

    const existing = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ApiError(400, `Coupon code '${code}' already exists`);
    }

    // Convert rupees to paise where appropriate
    const discountValueDecimal =
      data.discountType === DiscountType.FLAT
        ? rupeesToPaise(data.discountValue)
        : data.discountValue;

    const maxDiscountPaise = data.maxDiscountAmount ? rupeesToPaise(data.maxDiscountAmount) : null;

    const minOrderPaise = data.minOrderAmount ? rupeesToPaise(data.minOrderAmount) : null;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        description: data.description,
        discountType: data.discountType,
        discountValue: discountValueDecimal,
        maxDiscountPaise,
        minOrderPaise,
        scope: data.scope,
        applicableFor: data.applicableFor,
        allowedClientIds: data.allowedClientIds || [],
        allowedTherapistIds: data.allowedTherapistIds || [],
        allowedCategoryIds: data.allowedCategoryIds || [],
        maxUsageTotal: data.maxUsageTotal ?? null,
        maxUsagePerUser: data.maxUsagePerUser,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validTill: data.validTill ? new Date(data.validTill) : null,
        createdByAdminId: adminId,
        status: CouponStatus.ACTIVE,
        isVisibleOnWebsite: data.isVisibleOnWebsite ?? true,
      },
    });

    return coupon;
  },

  listCoupons: async (params: {
    status?: CouponStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: { usages: true },
          },
        },
      }),
      prisma.coupon.count({ where }),
    ]);

    return {
      coupons,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getCouponById: async (id: string) => {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        usages: {
          take: 10,
          orderBy: { usedAt: "desc" },
          include: {
            payment: {
              select: {
                id: true,
                status: true,
                amount: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: { usages: true },
        },
      },
    });

    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    return coupon;
  },

  updateCoupon: async (id: string, data: UpdateCouponInput) => {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    const updateData: any = {};

    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isVisibleOnWebsite !== undefined)
      updateData.isVisibleOnWebsite = data.isVisibleOnWebsite;
    if (data.maxDiscountAmount !== undefined) {
      updateData.maxDiscountPaise = data.maxDiscountAmount
        ? rupeesToPaise(data.maxDiscountAmount)
        : null;
    }
    if (data.minOrderAmount !== undefined) {
      updateData.minOrderPaise = data.minOrderAmount ? rupeesToPaise(data.minOrderAmount) : null;
    }
    if (data.maxUsageTotal !== undefined) updateData.maxUsageTotal = data.maxUsageTotal;
    if (data.maxUsagePerUser !== undefined) updateData.maxUsagePerUser = data.maxUsagePerUser;
    if (data.validFrom !== undefined) updateData.validFrom = new Date(data.validFrom);
    if (data.validTill !== undefined) {
      updateData.validTill = data.validTill ? new Date(data.validTill) : null;
    }
    if (data.allowedClientIds !== undefined) updateData.allowedClientIds = data.allowedClientIds;
    if (data.allowedTherapistIds !== undefined)
      updateData.allowedTherapistIds = data.allowedTherapistIds;
    if (data.allowedCategoryIds !== undefined)
      updateData.allowedCategoryIds = data.allowedCategoryIds;

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return updated;
  },

  toggleCouponStatus: async (id: string, status?: CouponStatus) => {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    const newStatus =
      status || (coupon.status === CouponStatus.ACTIVE ? CouponStatus.PAUSED : CouponStatus.ACTIVE);

    return await prisma.coupon.update({
      where: { id },
      data: { status: newStatus },
    });
  },

  getCouponUsages: async (couponId: string, page = 1, limit = 20) => {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    const skip = (page - 1) * limit;

    const [usages, total] = await Promise.all([
      prisma.couponUsage.findMany({
        where: { couponId },
        skip,
        take: limit,
        orderBy: { usedAt: "desc" },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              bookingType: true,
            },
          },
        },
      }),
      prisma.couponUsage.count({ where: { couponId } }),
    ]);

    return {
      usages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
