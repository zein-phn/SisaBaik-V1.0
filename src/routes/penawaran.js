import {Router} from "express";
import * as controller from "../controllers/penawaran.js";

export const router = Router();
router.get("/", controller.daftar);
router.get("/:id", controller.detail);
router.post("/", controller.buat);
router.put("/:id", controller.ubah);
router.delete("/:id", controller.hapus);
export default router;
