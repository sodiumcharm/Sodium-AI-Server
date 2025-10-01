import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { config } from '../../config/config';
import { OAUTH_REDIRECT_URL } from '../../constants';
import { generateUniqueUsername } from './oauth.utils';
import User from '../../models/user.model';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: OAUTH_REDIRECT_URL,
    },
    async (accessToken: string, refreshToken: string | undefined, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const fullname = profile.displayName;
        const profileImage = profile.photos?.[0].value || '';
        const username = await generateUniqueUsername(fullname);

        if (!email) return done(new Error('Google profile returned no email!'), undefined);

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            fullname,
            username,
            email,
            profileImage,
            registeredBy: 'google',
            isEmailVerified: true,
          });

          if (!user) return done(new Error('Failed to register the user!'), undefined);
        }

        if (user && user.registeredBy === 'credentials')
          return done(
            new Error('This email address is already registered! Please login with password.'),
            undefined
          );

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
