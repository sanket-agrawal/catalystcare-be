import {prisma} from '../../../../infrastructure/prisma/client'
import ApiError from "../../../../shared/utils/ApiError";
import { SubCategoryInput } from "./subCategory.dto";

export const createSubCategoryService = async (data : SubCategoryInput) => {
    try {
      const { name, description, categoryId } = data;
        const subCategory = await prisma.subCategory.create({
            data : {
                name,
                description,
                categoryId
            }
        })
        return subCategory;
    } catch (error) {
        throw new ApiError(500,"Something went wrong while creating sub-category");
    }
};