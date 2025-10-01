import { CookieOptions } from 'express';
import { config } from './config';
import { ACCESSTOKEN_COOKIE_AGE, REFRESHTOKEN_COOKIE_AGE } from '../constants';

const accessTokenOption: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'none',
  maxAge: ACCESSTOKEN_COOKIE_AGE,
};

const refreshTokenOption: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'none',
  maxAge: REFRESHTOKEN_COOKIE_AGE,
};

export const accessTokenCookieOption: CookieOptions = Object.freeze(accessTokenOption);
export const refreshTokenCookieOption: CookieOptions = Object.freeze(refreshTokenOption);
