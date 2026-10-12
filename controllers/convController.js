import { prisma } from "../lib/prisma.js"


function makeDirectKey (a, b) {
    return [a, b].sort((x, y) => x - y).join(':')
}

export async function getAllConv (req, res) {
    const user = req.user

    try {
        const conv = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: user.id }
                }
            }
        })

        return res.status(200).json({ conv })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function getConv (req, res) {
    const user = req.user
    const { convId } = req.params

    try {
        const isMember = await prisma.participant.findUnique({
            where: { convId_userId: { convId, userId: user.id } }
        })
        if (!isMember) {
            return res.status(403).json({
                error: 'You are not authorized to see this conversation.' 
            })
        }

        const conv = await prisma.conversation.findUnique({
            where: { id: convId }, 
            include: {
                participants: true, 
                messages: true
            }
        })
        if (!conv) return res.status(404).json({ error: "Conversation doesn't exist." })
        
        return res.status(200).json({ conv })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function sendMessage (req, res) {
    const user = req.user
    const { convId } = req.params
    const { text } = req.body

    if (!text) return res.status(400).json({ error: "Message body is empty" })
    
    try {
        const isMember = await prisma.participant.findUnique({
            where: { convId_userId: { convId, userId: user.id } }
        })
        if (!isMember) {
            return res.status(403).json({
                error: 'You are not authorized for sending message in this conversation.' 
            })
        }
        
        const message = await prisma.message.create({
            data: {
                convId, 
                senderId: user.id, 
                text
            }
        })

        return res.status(201).json({ message })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function createDirectConv (req, res) {
    const user = req.user
    const otherId = Number(req.params.otherId)

    if (!Number.isInteger(otherId)) {
        return res.status(400).json({ error: "Friend's user id is invalid" })
    } 
    if (otherId === user.id) {
        return res.status(400).json({ error: "Can't start a conversation with yourself" })
    }

    try {
        const otherUser = await prisma.user.findUnique({ where: { id: otherId } })
        if (!otherUser) return res.status(404).json({ error: "Friend's account doesn't exist" })

        const key = makeDirectKey(user.id, otherId)

        const areFriends = await prisma.friend.findUnique({ where: { pairKey: key } })
        if (!areFriends) {
            return res.status(403).json({ error: "Need to be friends for conversation" })
        }
        if (areFriends.status !== "ACCEPTED") {
            return res.status(403).json({ error: "Friend request needs to be accepted for conversation" })
        }
        
        const directConv = await prisma.conversation.upsert({
            where: { directKey: key }, 
            update: {}, 
            create: {
                type: 'DIRECT', 
                directKey: key, 
                participants: {
                    create: [{ userId: user.id}, { userId: otherId }]
                }
            },
            include: { participants: true, messages: true }
        })

        return res.status(200).json({ directConv })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}
