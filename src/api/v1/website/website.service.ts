import ApiError from "../../../shared/utils/ApiError"
import { prisma } from "../../../infrastructure/prisma/client";

export const getAllCategories = async () => {
    try {
        return await prisma.category.findMany({
            include : {
                subCategories : true
            }
        });
    } catch (error) {
        throw new ApiError(500,"Something went wrong while fetching categories");
    }
}