import { prisma } from "../lib/prisma.js"
import { genPass } from "../lib/utils.js"
import jwt from 'jsonwebtoken'


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

export async function getProfile (req, res) {
    const user = req.user

    try {
        const profile = await prisma.user.findUnique({
            where: { id: user.id }, 
            select: { id: true, username: true, email: true }
        })

        if (!profile) return res.status(401).json({ error: "Profile data is not available" })

        return res.status(200).json({ profile })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function changePassword (req, res) {
    const user = req.user
    const { password } = req.body

    try {
        const profile = await prisma.user.findUnique({ where: { id: user.id } })
        if (!profile) return res.status(404).json({ error: "Profile data is not available" })

        const hashed = await genPass(password)

        const updated = await prisma.user.update({
            where: { id: user.id }, 
            data: { hash: hashed }, 
            select: { id: true, username: true, email: true }
        })
        
        return res.status(200).json({ message: "Password updated", updated })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function changeUsername (req, res) {
    const user = req.user
    const username = req.body.username.trim()

    if (typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ error: "Username is invalid" })
    } 

    try {
        const profile = await prisma.user.findUnique({ where: { id: user.id } })
        if (!profile) return res.status(404).json({ error: "Profile data is not available" })
        if (profile.username === username) {
            return res.status(409).json({ error: "Username is the same as the existing one" })
        }

        const alrExist = await prisma.user.findUnique({ where: { username } })
        if (alrExist) return res.status(409).json({ error: "Username already taken" })

        const updated = await prisma.user.update({
            where: { id: user.id }, 
            data: { username }, 
            select: { id: true, username: true, email: true }
        })
        
        return res.status(200).json({ message: "Username updated", updated })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function deleteUser (req, res) {
    const user = req.user

    try {
        const profile = await prisma.user.findUnique({ where: { id: user.id } })
        if (!profile) return res.status(404).json({ error: "Profile data is not available" })

        await prisma.user.delete({ where: { id: user.id } })

        return res.status(200).json({ message: "User deleted" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}