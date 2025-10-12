import express from "express";
import categoryRoutes from "./category/category.routes";
import subCategoryRoutes from "./sub-category/subCategory.routes";
const router = express.Router();

router.use('/category', categoryRoutes);
router.use('/sub-category', subCategoryRoutes);

export default router;