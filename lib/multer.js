import multer, { memoryStorage } from "multer";

const allowed = [ 'image/jpeg', 'image/png', 'image/webp' ]

export const upload = multer({
    storage: memoryStorage(), 
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (allowed.includes(file.mimetype)) cb(null, true)
        else cb(new Error('Only jpg, png, webp image formats are allowed'))
    }
})