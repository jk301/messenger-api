import { Router } from "express";
import { test } from "../controllers/indexController.js"; 

export const indexRouter = Router()

indexRouter.get('/', test)
