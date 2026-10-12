import { Router } from "express";
import {
    register, 
    login, 
} from "../controllers/indexController.js"; 
import {
    getAllConv, 
    getConv, 
    sendMessage, 
    createDirectConv,
    createGroup,
    addToGroup,
    removeFromGroup
} from '../controllers/convController.js'
import {
    sendFriendReq, 
    getAllFriends, 
    acceptReq, 
    rejectReq, 
    removeFriend,
    searchUsers,
    getAllSentReq,
    getAllfriendReq,
    getFriendsRejected,
    getSentRejected
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

// Group

indexRouter.post('/conv/group/create', passport.authenticate('jwt', { session: false }), createGroup)
indexRouter.post('/conv/:groupId/add/:userId', passport.authenticate('jwt', { session: false }), addToGroup)
indexRouter.post('/conv/:groupId/remove/:userId', passport.authenticate('jwt', { session: false }), removeFromGroup)
// indexRouter.delete('/conv/:groupId/delete', passport.authenticate('jwt', { session: false }))


// Friend routes

indexRouter.get('/users/search', passport.authenticate('jwt', { session: false }), searchUsers)
indexRouter.get('/friends', passport.authenticate('jwt', { session: false }), getAllFriends)
indexRouter.get('/friends/sent', passport.authenticate('jwt', { session: false }), getAllSentReq)
indexRouter.get('/friends/received', passport.authenticate('jwt', { session: false }), getAllfriendReq)
indexRouter.get('/friends/rejected', passport.authenticate('jwt', { session: false }), getFriendsRejected)
indexRouter.get('/friends/sent/rejected', passport.authenticate('jwt', { session: false }), getSentRejected)
indexRouter.post('/friend/:receiverId/request', passport.authenticate('jwt', { session: false }), sendFriendReq)
indexRouter.post('/friend/:reqId/accept', passport.authenticate('jwt', { session: false }), acceptReq)
indexRouter.post('/friend/:reqId/reject', passport.authenticate('jwt', { session: false }), rejectReq)
indexRouter.post('/friend/:reqId/remove', passport.authenticate('jwt', { session: false }), removeFriend)
    