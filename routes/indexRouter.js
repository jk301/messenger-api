import { Router } from "express";
import { register, login, test } from "../controllers/indexController.js"; 
import passport from "passport";

export const indexRouter = Router()

indexRouter.get('/', test)

indexRouter.post('/register', register)

indexRouter.post('/login', passport.authenticate('local', { session: false }), login)
