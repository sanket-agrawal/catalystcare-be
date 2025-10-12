import {prisma} from '../../../../infrastructure/prisma/client'
import ApiError from "../../../../shared/utils/ApiError";

import { CreateCategoryInput } from "./category.dto";

export const createCategoryService = async (data: CreateCategoryInput) => {
  try {
    const { name, description } = data;   
    const category = await prisma.category.create({
        data : {
            name,
            description,
            }
    })
    return category;
  } catch (error) {
    throw new ApiError(500,"Something went wrong while creating category");
  }
};