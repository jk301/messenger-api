import { configDotenv } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

configDotenv()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export function uploadAvatar (buffer, userId) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'messenger/avatars', 
                public_id: String(userId), 
                overwrite: true, 
                invalidate: true, 
                transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }]
            }, 
            (error, result) => {
                if (error) reject(error)
                else resolve(result)
            }
        )

        stream.end(buffer)
    })
}

export function uploadGroupAvatar (buffer, groupId) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'messenger/group-avatars', 
                public_id: String(groupId), 
                overwrite: true, 
                invalidate: true, 
                transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }]
            }, 
            (error, result) => {
                if (error) reject(error)
                else resolve(result)
            }
        )

        stream.end(buffer)
    })
}