import express from "express"
import WebinarController from "./webinar.controller";

const router = express.Router();

router.post("/create",  WebinarController.create);
router.get("/fetch-all",  WebinarController.fetchAll);
router.get("/:id",  WebinarController.fetchById);
router.patch("/:id",  WebinarController.update);
router.post("/:id/publish",  WebinarController.publish);
router.post("/:id/unpublish",  WebinarController.unpublish);

export default router;