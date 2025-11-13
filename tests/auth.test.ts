import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import {
  TEST_USER_EMAIL,
  TEST_FULLNAME,
  TEST_USERNAME,
  TEST_USER_PASSWORD,
  TEST_USER_ID,
  API_URL,
} from '../src/constants';
import app from '../src/app';
import User from '../src/models/user.model';
import { generateTokens } from '../src/controllers/auth/auth.utils';
import { UserDocument } from '../src/types/types';

describe('generateTokens', () => {
  let user: UserDocument;

  beforeEach(async () => {
    user = await User.create({
      fullname: TEST_FULLNAME,
      username: TEST_USERNAME,
      registeredBy: 'credentials',
      email: TEST_USER_EMAIL,
      password: await bcrypt.hash(TEST_USER_PASSWORD, 8),
    });
  });

  it('should successfully return tokens for an user', async () => {
    const result = await generateTokens(user);

    expect(result.success.statusCode).toBe(200);
    expect(result.success.success).toBe(true);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.success.message).toBe('Tokens issued successfully.');
  });

  it('should return valid access and refresh tokens', async () => {
    const result = await generateTokens(user);

    const decodedAccessToken = jwt.verify(
      result.accessToken,
      process.env.ACCESS_TOKEN_SECRET as string
    );
    const decodedRefreshToken = jwt.verify(
      result.refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    );

    expect((decodedAccessToken as jwt.JwtPayload).email).toBe(TEST_USER_EMAIL);
    expect((decodedAccessToken as jwt.JwtPayload)._id).toBeDefined();
    expect((decodedRefreshToken as jwt.JwtPayload)._id).toBeDefined();
  });
});

describe('User Registration Endpoint (POST /auth/signup)', () => {
  it('should successfully register a new user', async () => {
    await request(app)
      .post(`${API_URL}/auth/signup`)
      .field('fullname', TEST_FULLNAME)
      .field('username', TEST_USERNAME)
      .field('email', TEST_USER_EMAIL)
      .field('password', TEST_USER_PASSWORD)
      .expect('Content-Type', /json/)
      .expect(201)
      .expect(res => {
        const data = res.body.data.user;

        expect(data._id).toBeDefined();

        delete data._id;
        delete data.createdAt;
        delete data.updatedAt;

        expect(data).toEqual({
          fullname: TEST_FULLNAME,
          username: TEST_USERNAME,
          email: TEST_USER_EMAIL,
          isEmailVerified: false,
          profileImage: '',
          profileDescription: '',
          twoFAEnabled: false,
          role: 'user',
          status: 'active',
          isPaid: false,
          plan: 'free-tier',
          gender: 'unknown',
          subscriberCount: 0,
          subscribingCount: 0,
          totalFollowers: 0,
          creationCount: 0,
          socialMerit: 0,
          notifications: [],
        });

        expect(res.headers['set-cookie']).toBeTruthy();
        expect(res.headers['set-cookie'][0]).toContain('accessToken');
        expect(res.headers['set-cookie'][1]).toContain('refreshToken');
      });

    const user = await User.findOne({ email: TEST_USER_EMAIL });

    const passwordIsMatching = await bcrypt.compare(TEST_USER_PASSWORD, user?.password as string);

    expect(user).toBeTruthy();
    expect(passwordIsMatching).toBe(true);
  });
});
