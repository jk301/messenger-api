import { Router } from "express";
import {
    register, 
    login, 
    test, 
    underJWT, 
    getAllConv, 
    getConv, 
    sendMessage,
    sendFriendReq
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

indexRouter.post('/conv/:convId/message', passport.authenticate('jwt', { session: false }), sendMessage)
indexRouter.post('/friend/:receiverId/request', passport.authenticate('jwt', { session: false }), sendFriendReq)
indexRouter.post('/friend/:reqId/accept', passport.authenticate('jwt', { session: false }))
