import express from 'express'
import cors from 'cors'
import { configDotenv } from "dotenv"
configDotenv()
import passport from 'passport'

import { indexRouter } from './routes/indexRouter.js'

import './passport/local.js'
import './passport/jwt.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(passport.initialize())

app.use(cors({
    origin: ['http://localhost:5173/']
}))

app.use('/', indexRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, (err) => {
    console.log(`Running on Port: ${PORT}`)
    if (err) throw err
})