import { prisma } from "../lib/prisma.js"


function makeDirectKey (a, b) {
    return [a, b].sort((x, y) => x - y).join(':')
}

export async function getAllConv (req, res) {
    const user = req.user

    try {
        const allConv = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: user.id }
                }
            }, 
            include: { participants: { include: { user: { select: { id: true, username: true } } } } }
        })

        const conv = allConv.map( c => {
            if (c.type === 'DIRECT') {
                const otherUser = c.participants.find( u => u.userId !== user.id)
                return {...c, other: otherUser?.user.username ?? 'Deleted user'}
            } else {
                return c
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

export async function createGroup (req, res) {
    const user = req.user
    const { groupName } = req.body

    if (typeof groupName !== 'string' || !groupName.trim()) {
        return res.status(400).json({ error: 'Group name is required' })
    }

    try {
        const group = await prisma.conversation.create({
            data: {
                type: 'GROUP', 
                name: groupName.trim(),
                participants: {
                    create: [{ userId: user.id, role: 'ADMIN'}]
                }
            },
            include: { participants: true, messages: true }
        })
        
        return res.status(201).json({ group })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function makeAdmin (req, res) {
    const user = req.user
    const userId = Number(req.params.userId)
    const groupId = req.params.groupId

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: "User Id is invalid" })
    }

    if (user.id === userId) return res.status(409).json({ error: "You can't turn yourself ADMIN" })

    try {
        const group = await prisma.conversation.findUnique({
            where: { id: groupId }, 
            include: { participants: true }
        })
        if (!group) return res.status(403).json({ error: "You don't have access to this group" })
        if (group.type !== 'GROUP') return res.status(403).json({ error: "Conversation isn't a group" })

        const self = group.participants.find( p => p.userId === user.id )
        if (!self) return res.status(403).json({ error: "You don't have access to this group" })
        if (self.role !== 'ADMIN') {
            return res.status(403).json({ error: "Only an ADMIN can turn user into ADMIN (you are not)" })
        }

        const inGroup = group.participants.find( p => p.userId === userId )
        if (!inGroup) {
            return res.status(404).json({ error: "Member is not in group" })
        }
        if (inGroup.role === 'ADMIN') {
            return res.status(409).json({ error: "Already an ADMIN" })
        }

        const turned = await prisma.participant.update({
            where: { convId_userId: { convId: groupId, userId } }, 
            data: { role: 'ADMIN' }, 
            include: {
                user: { select: { id: true, username: true } }
            }
        })

        return res.status(200).json({
            message: 'Member turned admin', 
            participant: turned
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function addToGroup (req, res) {
    const user = req.user
    const userId = Number(req.params.userId)
    const groupId = req.params.groupId

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: "User Id is invalid" })
    }

    if (user.id === userId) return res.status(409).json({ error: "You can't add yourself in a group" })

    try {
        const group = await prisma.conversation.findUnique({
            where: { id: groupId }, 
            include: { participants: true }
        })
        if (!group) return res.status(403).json({ error: "You don't have access to this group" })
        if (group.type !== 'GROUP') return res.status(403).json({ error: "Conversation isn't a group" })

        const self = group.participants.find( p => p.userId === user.id )
        if (!self) return res.status(403).json({ error: "You don't have access to this group" })
        if (self.role !== 'ADMIN') {
            return res.status(403).json({ error: "Only an ADMIN can add users to group (you are not)" })
        }

        const theUser = await prisma.user.findUnique({ where: { id: userId } })
        if (!theUser) return res.status(404).json({ error: "The user doesn't exist" })

        if (group.participants.some(p => p.userId === userId )) {
            return res.status(409).json({ error: "Member already in group" })
        }

        const added = await prisma.participant.create({
            data: {
                convId: groupId, 
                userId: userId
            }, 
            include: {
                user: { select: { id: true, username: true } }
            }
        })

        return res.status(201).json({ 
            message: 'Member added', 
            participant: added
         })        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function removeFromGroup (req, res) {
    const user = req.user
    const userId = Number(req.params.userId)
    const groupId =req.params.groupId

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: "User Id is invalid" })
    }

    try {
        const group = await prisma.conversation.findUnique({
            where: { id: groupId }, 
            include: { participants: true }
        })
        if (!group) return res.status(403).json({ error: "You don't have access to this group" })
        if (group.type !== 'GROUP') return res.status(403).json({ error: "Conversation isn't a group" })

        const self = group.participants.find( p => p.userId === user.id )
        if (!self) return res.status(403).json({ error: "You don't have access to this group" })

        if (user.id === userId) {
            await prisma.participant.delete({
                where: { convId_userId: { convId: groupId, userId } }
            })

            return res.status(200).json({ message: 'Member removed' }) 
        }

        if ( user.id !== userId && self.role !== 'ADMIN') {
            return res.status(403).json({ error: "Only an ADMIN can remove other users in the group (you are not)" })
        }

        const other = group.participants.find( p => p.userId === userId )
        if (!other) return res.status(404).json({ error: "The user is not in the group" })

        await prisma.participant.delete({
            where: { convId_userId: { convId: groupId, userId } }
        })

        return res.status(200).json({ message: 'Member removed' })        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}

export async function deleteGroup (req, res) {
    const user = req.user
    const groupId =req.params.groupId

    try {
        const group = await prisma.conversation.findUnique({
            where: { id: groupId }, 
            include: { participants: true }
        })
        if (!group) return res.status(403).json({ error: "You don't have access to this group" })
        if (group.type !== 'GROUP') return res.status(403).json({ error: "Conversation isn't a group" })

        const self = group.participants.find( p => p.userId === user.id )
        if (!self) return res.status(403).json({ error: "You don't have access to this group" })
        if (self.role !== 'ADMIN') {
            return res.status(403).json({ error: "Only an ADMIN can delete a group (you are not)" })
        }

        await prisma.conversation.delete({ where: { id: groupId } })

        return res.status(200).json({ message: 'Group deleted.' })        
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
    }
}