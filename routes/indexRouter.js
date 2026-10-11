import { Router } from "express";
import {
    register, 
    login, 
    getAllConv, 
    getConv, 
    sendMessage,
    createDirectConv
} from "../controllers/indexController.js"; 
import {
    sendFriendReq, 
    getAllFriends, 
    acceptReq, 
    rejectReq, 
    removeFriend,
    searchUsers
} from '../controllers/friendController.js'
import passport from "passport";

export const indexRouter = Router()

indexRouter.post('/register', register)
indexRouter.post('/login', passport.authenticate('local', { session: false }), login)

// protected by jwt

// Conversation
indexRouter.get('/conv', passport.authenticate('jwt', { session: false }), getAllConv)
indexRouter.get('/conv/:convId', passport.authenticate('jwt', { session: false }), getConv)
indexRouter.post('/conv/:otherId/create',passport.authenticate('jwt', { session: false }), 
createDirectConv )
indexRouter.post('/conv/:convId/message', passport.authenticate('jwt', { session: false }), sendMessage)


// Friend routes

indexRouter.get('/users/search', passport.authenticate('jwt', { session: false }), searchUsers)
indexRouter.get('/friends', passport.authenticate('jwt', { session: false }), getAllFriends)
indexRouter.post('/friend/:receiverId/request', passport.authenticate('jwt', { session: false }), sendFriendReq)
indexRouter.post('/friend/:reqId/accept', passport.authenticate('jwt', { session: false }), acceptReq)
indexRouter.post('/friend/:reqId/reject', passport.authenticate('jwt', { session: false }), rejectReq)
indexRouter.post('/friend/:reqId/remove', passport.authenticate('jwt', { session: false }), removeFriend)
