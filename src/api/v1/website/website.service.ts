import ApiError from "../../../shared/utils/ApiError"
import { prisma } from "../../../infrastructure/prisma/client";

export const getAllCategories = async () => {
    try {
        return await prisma.category.findMany({
            select : {
                id : true,
                name : true,
                description : true,
                iconUrl : true,
                subCategories : {
                    select : {
                    id : true,
                    name : true,
                    description : true,
                    iconUrl : true
                    }
                }
            }
        });
    } catch (error) {
        throw new ApiError(500,"Something went wrong while fetching categories");
    }
}