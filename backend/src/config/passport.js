import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './db.js';
import { logger } from '../utils/logger.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email from Google profile'), null);
        }

        // Check if user with this Google ID already exists
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { googleId: profile.id },
              { email },
            ],
          },
        });

        if (user) {
          // Link Google ID if user registered with email first
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                isVerified: true,
              },
            });
          }
          return done(null, user);
        }

        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            googleId: profile.id,
            name: profile.displayName,
            isVerified: true,
            profile: {
              create: {}, // empty profile scaffold
            },
            notificationPrefs: {
              create: {}, // default prefs
            },
          },
        });

        logger.info(`New Google OAuth user: ${email}`);
        return done(null, user);
      } catch (err) {
        logger.error('Google OAuth error:', err);
        return done(err, null);
      }
    }
  )
);

export default passport;
