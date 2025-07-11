const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    passReqToCallback: true   //  This makes `req` available in callback
},
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            console.warn('email-------', email)
            let user = await User.findOne({ googleId: profile.id, email: email });


           
            if (req.query.state === 'login') {
                // 1. Check if user exists by Google ID
                user = await User.findOne({ googleId: profile.id });

                // 2. If not found, check if same email exists
                if (!user) {
                    const existingEmail = await User.findOne({ email: email });

                    if (existingEmail) {
                        return done(null, false, { message: 'This email exists but is not linked with Google. Try normal login.' });
                    }


                    return done(null, false, { message: 'User not found. Please sign up first.' });
                }

                // 3. User exists, check if blocked
                if (user.isBlock) {
                    return done(null, false, { message: 'User is blocked by admin' });
                }

                req.session.user=user
                return done(null, user);
            } else {
                // If state is "signin", but user not found → failure
                if (req.query.state === 'signin') {//use of passReq
                    req.session.user=user
                    return done(null, false, { message: 'User not found. Please sign up first.' });
                }

                const existingEmail = await User.findOne({ email: profile.emails[0].value });

                if (existingEmail) {
                    return done(null, false, { message: 'Email already exists.' });
                }

                // Else it's signup
                user = new User({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                });
                await user.save();
                return done(null, user);
            }
        } catch (error) {
            console.error('error from passport', error)
            return done(error, null);
        }
    }));

// serialize is for assigning user details to session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user)
        })
        .catch(err => {
            done(err, null)
        })
});

module.exports = passport;