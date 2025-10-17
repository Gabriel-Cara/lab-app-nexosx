import { Router } from "express";
import authRoutes from "./authRoutes";
import packageRoutes from "./packageRoutes";
import visitorRoutes from "./visitorRoutes";
import eventRoutes from "./eventRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/packages", packageRoutes);
router.use("/visitors", visitorRoutes);
router.use("/events", eventRoutes);

export default router;
