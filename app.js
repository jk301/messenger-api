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
            return res.status(413).json({ error: "Image must be 2 MB or smaller" })
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

app.listen(PORT, (err) => {
    console.log(`Running on Port: ${PORT}`)
    if (err) throw err
})