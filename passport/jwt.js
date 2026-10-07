import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import { prisma } from "../lib/prisma.js";
import { configDotenv } from 'dotenv'

configDotenv()

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
    secretOrKey: process.env.JWT_SECRET
}

passport.use(new JwtStrategy(options, async( payload, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: payload.id }})
        if(!user) return done(null, false)
        
        return done(null, user)
    } catch (error) {
        return done(error)
    }
}))