import bcrypt from 'bcrypt'

export async function passValid (password, hash) {
    return await bcrypt.compare(password, hash)
}

export async function genPass (password) {
    return await bcrypt.hash(password, 10)
}