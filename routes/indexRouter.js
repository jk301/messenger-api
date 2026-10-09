import { Router } from "express";
import {
    register, 
    login, 
    test, 
    underJWT, 
    getAllConv, 
    getConv 
} from "../controllers/indexController.js"; 
import passport from "passport";

export const indexRouter = Router()

indexRouter.get('/', test)

indexRouter.post('/register', register)
indexRouter.post('/login', passport.authenticate('local', { session: false }), login)

// protected by jwt
indexRouter.get('/protected', passport.authenticate('jwt', { session: false }), underJWT)
indexRouter.get('/conv', passport.authenticate('jwt', { session: false }), getAllConv)
indexRouter.get('/conv/:convId', passport.authenticate('jwt', { session: false }), getConv)