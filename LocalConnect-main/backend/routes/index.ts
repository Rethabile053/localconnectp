import { Router } from "express";
import healthRoutes from "./health.routes.js";
import listingsRoutes from "./listings.routes.js";
import usersRoutes from "./users.routes.js";
import categoriesRoutes from "./categories.routes.js";
import adminRoutes from "./admin.routes.js";
import webhookRoutes from "./webhook.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/listings", listingsRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/categories", categoriesRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/webhooks", webhookRoutes);
