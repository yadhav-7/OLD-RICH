import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import dotenv from 'dotenv'
import User from '../models/userSchema.js'
import Wallet from '../models/walletSchema.js'
import logger from '../utils/logger.js'

dotenv.config()

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      // callbackURL: '/auth/google/callback',
      callbackURL: 'http://oldrich.shop/auth/google/callback',
      passReqToCallback: true, //  This makes `req` available in callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value

        let user = await User.findOne({ googleId: profile.id, email })

        if (req.query.state === 'login') {
          // 1. Check if user exists by Google ID
          user = await User.findOne({ googleId: profile.id })

          // 2. If not found, check if same email exists
          if (!user) {
            const existingEmail = await User.findOne({ email })

            if (existingEmail) {
              return done(null, false, {
                message:
                  'This email exists but is not linked with Google. Try normal login.',
              })
            }

            return done(null, false, {
              message: 'User not found. Please sign up first.',
            })
          }

          // 3. User exists, check if blocked
          if (user.isBlock) {
            return done(null, false, { message: 'User is blocked by admin' })
          }

          req.session.user = user
          return done(null, user)
        }
        // If state is "signin", but user not found → failure
        if (req.query.state === 'signin') {
          // use of passReq
          req.session.user = user
          return done(null, false, {
            message: 'User not found. Please sign up first.',
          })
        }

        const existingEmail = await User.findOne({
          email: profile.emails[0].value,
        })

        if (existingEmail) {
          return done(null, false, { message: 'Email already exists.' })
        }

        const referralCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString()

        // Else it's signup
        user = new User({
          username: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          referralCode,
        })
        await user.save()

        const wallet = new Wallet({
          userId: user._id,
        })
        await wallet.save()
        return done(null, user)
      } catch (error) {
        logger.error(`error from passport ${error}`)
        return done(error, null)
      }
    },
  ),
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user)
    })
    .catch((err) => {
      done(err, null)
    })
})

export default passport
