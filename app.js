import express from 'express'
import { configDotenv } from "dotenv"
configDotenv()

import { indexRouter } from './routes/indexRouter.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', indexRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, (err) => {
    console.log(`Running on Port: ${PORT}`)
    if (err) throw err
})