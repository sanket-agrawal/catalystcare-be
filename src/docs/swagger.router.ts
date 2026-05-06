import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { getOpenApiSpec } from "./openapi";

const router = Router();

const spec = getOpenApiSpec();

router.get("/openapi.json", (_req, res) => {
  res.json(spec);
});

router.use(...swaggerUi.serve);
router.get(
  "/",
  swaggerUi.setup(spec, {
    customSiteTitle: "CatalystCare API — Docs",
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

export default router;
