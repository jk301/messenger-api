import http from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from './lib/prisma.js'

import { setIO } from './lib/socket.js'

import express from 'express'
import cors from 'cors'
import { configDotenv } from "dotenv"
configDotenv()
import passport from 'passport'
import multer from 'multer'

import { indexRouter } from './routes/indexRouter.js'

import './passport/local.js'
import './passport/jwt.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(passport.initialize())

app.use(cors({
    origin: ['http://localhost:5173']
}))

app.use('/', indexRouter)

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: "Image/file must be 5 MB or smaller" })
        }
        return res.status(400).json({ error: err.message })
    }

    if (err.message === 'Only jpeg, png and webp images are allowed') {
        return res.status(400).json({ error: err.message })
    }

    console.log(err)
    return res.status(500).json({ error: "Server error" })
})

const PORT = process.env.PORT || 3000

const server = http.createServer(app)

const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL }
})

setIO(io)

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        socket.userId = payload.id
        next()
    } catch (error) {
        next(new Error('Unauthorized!'))
    }
})

const onlineNow = new Map()

function addConn (userId) {
    const count = onlineNow.get(userId) ?? 0
    onlineNow.set(userId, count + 1)
    return count === 0
}

function removeConn (userId) {
    const count = onlineNow.get(userId) ?? 0
    if (count <= 1) {
        onlineNow.delete(userId)
        return true
    }
    onlineNow.set(userId, count - 1)
    return false
}

async function getFriendsId (userId) {
    const rows = await prisma.friend.findMany({
        where: {
            status: 'ACCEPTED', 
            OR: [{ senderId: userId }, { receiverId: userId }]
        }, 
        select: { senderId: true, receiverId: true }
    })

    return rows.map( f => f.senderId === userId ? f.receiverId : f.senderId )
}

io.on( 'connection', async (socket) => {
    try {
        socket.join(`user:${socket.userId}`)

        const rows = await prisma.participant.findMany({
            where: { userId: socket.userId }, 
            select: { convId: true }
        })

        rows.forEach( r => socket.join(`conv:${r.convId}`))
        console.log('user', socket.userId, 'joined', socket.rooms)

        const cameOnline = addConn(socket.userId)
        const friendsId = await getFriendsId(socket.userId)

        if (cameOnline) {
            friendsId.forEach(
                id => io.to(`user:${id}`).emit('presence', { userId: socket.userId, online: true }) 
            )
        }

        const onlineFriends = friendsId.filter( id => onlineNow.has(id))
        socket.emit('onlineFriends', onlineFriends)

        socket.on('disconnect', async () => {
            try {
                const wentOff = await removeConn(socket.userId)
                if (wentOff) {
                    const fIds = await getFriendsId(socket.userId)
                    fIds.forEach(
                        id => io.to(`user:${id}`).emit('presence', { userId: socket.userId, online: false })
                    )
                }
                console.log('disconnect', socket.userId, wentOff)
            } catch (error) {
                console.log(error)
            }
        })
    } catch (error) {
        console.log(error)
    }
} )


server.listen(PORT, () => console.log(`Running on Port: ${PORT}`))


// app.listen(PORT, (err) => {
//     console.log(`Running on Port: ${PORT}`)
//     if (err) throw err
// })