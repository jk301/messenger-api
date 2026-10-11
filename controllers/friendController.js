import { prisma } from "../lib/prisma.js"

function makeDirectKey (a, b) {
    return [a, b].sort((x, y) => x - y).join(':')
}

export async function searchUsers (req, res) {
    const user = req.user
    const { name } = req.query

    if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Search term is needed' })
    }

    try {
        
        const result = await prisma.user.findMany({
            where: {
                id: { not: user.id }, 
                username: { contains: name.trim(), mode: 'insensitive' }
            },
            select: {
                id: true, 
                username: true
            }, 
            orderBy: { username: 'asc' }, 
            take: 30
        })

        return res.status(200).json({ result })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function sendFriendReq (req, res) {
    const user = req.user
    const receiverId = Number(req.params.receiverId)

    if (!Number.isInteger(receiverId)) return res.status(400).json({ error: "Receiver's id is invalid" })

    if (user.id === receiverId) return res.status(400).json({ error: "Can't send a request to yourself :(" })

    try {
        const recUser = await prisma.user.findUnique({ where: { id: receiverId } })
        if (!recUser) return res.status(404).json({ error: "User not found" })
        
        const key = makeDirectKey(user.id, receiverId)
        const alrExist = await prisma.friend.findUnique({
            where: { pairKey: key }
        })
        if (alrExist) return res.status(409).json({ error: "A request already exist." })

        await prisma.friend.create({
            data: {
                senderId: user.id, 
                receiverId, 
                pairKey: key
            }
        })

        return res.status(201).json({ message: "Friend request sent." })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function getAllFriends (req, res) {
    const user = req.user

    try {
        
        const result = await prisma.friend.findMany({
            where: {
                OR: [
                    { receiverId: user.id }, 
                    { senderId: user.id }
                ],
                AND: [
                    { status: 'ACCEPTED' }
                ]
            }, 
            select: {
                id: true, 
                sender: { select: { id: true, username: true } }, 
                receiver: { select: { id: true, username: true } }
            }
        })

        const friends = result.map(f => { 
            return { 
                reqId: f.id, 
                friend: f.sender.id === user.id ? f.receiver : f.sender 
            }
        })

        return res.status(200).json({ friends })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function getAllSentReq (req, res) {
    const user = req.user

    try {
        const result = await prisma.friend.findMany({
            where: {
                AND: [
                    { status: 'PENDING' }, 
                    { senderId: user.id }
                ]
            }, 
            select: {
                id: true, 
                receiver: { select: { id: true, username: true } }
            }
        })

        const friends = result.map(f => { 
            return { 
                reqId: f.id, 
                friend: f.receiver
            }
        })

        return res.status(200).json({ friends })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function getFriendsRejected (req, res) {
    const user = req.user

    try {
        const result = await prisma.friend.findMany({
            where: {
                AND: [
                    { receiverId: user.id },
                    { status: 'REJECTED' }
                ]
            }, 
            select: {
                id: true, 
                sender: { select: { id: true, username: true } }, 
            }
        })

        const friends = result.map(f => { 
            return { 
                reqId: f.id, 
                friend: f.sender 
            }
        })

        return res.status(200).json({ friends })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function getSentRejected (req, res) {
    const user = req.user

    try {
        const result = await prisma.friend.findMany({
            where: {
                AND: [
                    { senderId: user.id },
                    { status: 'REJECTED' }
                ]
            }, 
            select: {
                id: true, 
                receiver: { select: { id: true, username: true } }, 
            }
        })

        const friends = result.map(f => { 
            return { 
                reqId: f.id, 
                friend: f.receiver 
            }
        })

        return res.status(200).json({ friends })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function getAllfriendReq (req, res) {
    const user = req.user

    try {
        const result = await prisma.friend.findMany({
            where: {
                AND: [
                    { receiverId: user.id },
                    { status: 'PENDING' }
                ]
            }, 
            select: {
                id: true, 
                sender: { select: { id: true, username: true } }, 
            }
        })

        const friends = result.map(f => { 
            return { 
                reqId: f.id, 
                friend: f.sender 
            }
        })

        return res.status(200).json({ friends })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function acceptReq (req, res) {
    const user = req.user
    const reqId = Number(req.params.reqId)

    if (!Number.isInteger(reqId)) return res.status(400).json({ error: "Friend request id is invalid" })

    try {
        const alrAccp = await prisma.friend.findUnique({
            where: { id: reqId }
        })
        if (!alrAccp) return res.status(404).json({ error: "Request doesn't exist" })
        if (alrAccp.receiverId !== user.id) return res.status(403).json({ error: "Not your request" })
        if (alrAccp.status !== "PENDING") {
            return res.status(409).json({ error: "Request is no longer pending" })
        }

        await prisma.friend.update({
            where: { id: reqId }, 
            data: { status: 'ACCEPTED' }
        })
        
        return res.status(200).json({ message: "Friend request accepted" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function rejectReq (req, res) {
    const user = req.user
    const reqId = Number(req.params.reqId)

    if (!Number.isInteger(reqId)) return res.status(400).json({ error: "Friend request id is invalid" })

    try {
        const alrRej = await prisma.friend.findUnique({
            where: { id: reqId }
        })
        if (!alrRej) return res.status(404).json({ error: "Request doesn't exist" })
        if (alrRej.receiverId !== user.id) return res.status(403).json({ error: "Not your request" })
        if (alrRej.status !== "PENDING") {
            return res.status(409).json({ error: "Request is no longer pending" })
        }

        await prisma.friend.update({
            where: { id: reqId }, 
            data: { status: 'REJECTED' }
        })
        
        return res.status(200).json({ message: "Friend request rejected" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function removeFriend (req, res) {
    const user = req.user
    const reqId = Number(req.params.reqId)

    if (!Number.isInteger(reqId)) return res.status(400).json({ error: "Friend request id is invalid" })

    try {
        const exist = await prisma.friend.findUnique({
            where: { id: reqId }
        })
        if (!exist) return res.status(404).json({ error: "Request doesn't exist" })
        if (exist.receiverId !== user.id && exist.senderId !== user.id) {
            return res.status(403).json({ error: "You aren't authorized" })
        }
        if (exist.status === 'REJECTED' && exist.senderId === user.id) {
            return res.status(403).json({ error: "Rejected by the user" })
        } 
        if (exist.status === 'PENDING' && exist.receiverId === user.id) {
            return res.status(403).json({ error: "Only the sender can delete a request" })
        }

        await prisma.friend.delete({
            where: { id: reqId }
        })
        
        return res.status(200).json({ message: "Removed" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}