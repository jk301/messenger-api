import { prisma } from "../lib/prisma.js"
import { genPass } from "../lib/utils.js"
import jwt from 'jsonwebtoken'


export function test (req, res) {
    return res.json({ message: 'Got the JSON' })
}

export function underJWT (req, res) {
    return res.json({ message: 'Got through JWT' })
}

export async function register (req, res) {
    const email = req.body.email
    const username = req.body.username
    const password = req.body.password

    if (!email || !username || !password) {
        return res.status(400).json({
            error: 'All input fields must me filled'
        })
    }

    try {
        const hashed = await genPass(password)

        await prisma.user.create({
            data: { email, username, hash: hashed }
        })

        return res.status(201).json({ message: 'User created' })
        
    } catch (err) {
        if (err.code === 'P2002') {
            const target = err.meta?.target || []

            if (target.includes('email')) {
                return res.status(409).json({ error: 'Email is already taken.' })
            }
            if (target.includes('username')) {
                return res.status(409).json({ error: 'Username is already taken. Choose another.' })
            }

            return res.status(409).json({ error: 'A Unique field is already taken.' })
        }
        console.log(err)
        return res.status(500).json({ error: 'Something went wrong.' })
    }
}

export function login (req, res) {
    // issue a jwt (later)
    const user = req.user

    const payload = { id: user.id, email: user.email, username: user.username }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

    return res.status(200).json({
        token
    })
}