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

io.on( 'connection', async (socket) => {
    try {
        socket.join(`user: ${socket.userId}`)

        const rows = await prisma.participant.findMany({
            where: { userId: socket.userId }, 
            select: { convId: true }
        })

        rows.forEach( r => socket.join(`conv:${r.convId}`))
        console.log('user', socket.userId, 'joined', socket.rooms)
    } catch (error) {
        console.log(error)
    }
} )


server.listen(PORT, () => console.log(`Running on Port: ${PORT}`))


// app.listen(PORT, (err) => {
//     console.log(`Running on Port: ${PORT}`)
//     if (err) throw err
// })