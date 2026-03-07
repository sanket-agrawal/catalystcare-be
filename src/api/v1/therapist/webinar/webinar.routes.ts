import express from "express"
import WebinarController from "./webinar.controller";

const router = express.Router();

router.post("/create",  WebinarController.create);
router.get("/fetch-all",  WebinarController.fetchAll);
router.get("/fetch/:id",  WebinarController.fetchById);
router.put("/update/:id",  WebinarController.update);
router.post("/publish/:id",  WebinarController.publish);
router.post("/unpublish/:id",  WebinarController.unpublish);

export default router;