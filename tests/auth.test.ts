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
} from './constants';
import { API_URL } from '../src/constants';
import app from '../src/app';
import User from '../src/models/user.model';
import { generateTokens } from '../src/controllers/auth/auth.utils';
import { UserDocument } from '../src/types/types';
import {
  USER_CREATION_DATA,
  EXPECTED_USER_DATA,
  TEST_LOGIN_DATA,
  WRONG_LOGIN_PASSWORD_DATA,
  WRONG_LOGIN_EMAIL_DATA,
  WRONG_LOGIN_USERNAME_DATA,
  USER_CREATION_2FA,
  TEST_LOGIN_2FA_DATA,
  TEST_OTP,
} from './constants';
import OTP from '../src/models/otp.model';

// *************************************************************
// TESTING "generateTokens()" FUNCTION
// *************************************************************

describe('generateTokens', () => {
  let user: UserDocument;

  beforeEach(async () => {
    user = await User.create(USER_CREATION_DATA);
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

// *************************************************************
// TESTING USER REGISTRATION ENDPOINT
// *************************************************************

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

        expect(data).toEqual(EXPECTED_USER_DATA);

        expect(res.headers['set-cookie']).toBeTruthy();
        expect(res.headers['set-cookie'][0]).toContain('accessToken');
        expect(res.headers['set-cookie'][1]).toContain('refreshToken');
      });

    const user = await User.findOne({ email: TEST_USER_EMAIL });

    const passwordIsMatching = await bcrypt.compare(TEST_USER_PASSWORD, user?.password as string);

    expect(user).toBeTruthy();
    expect(passwordIsMatching).toBe(true);
  });

  it('should reject registration with existing email', async () => {
    await User.create(USER_CREATION_DATA);

    await request(app)
      .post(`${API_URL}/auth/signup`)
      .field('fullname', TEST_FULLNAME)
      .field('username', 'Testify2')
      .field('email', TEST_USER_EMAIL)
      .field('password', TEST_USER_PASSWORD)
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe('This email address is already registered!');
        expect(res.body.data).toBeUndefined();
      });
  });

  it('should reject registration with existing username', async () => {
    await User.create(USER_CREATION_DATA);

    await request(app)
      .post(`${API_URL}/auth/signup`)
      .field('fullname', TEST_FULLNAME)
      .field('username', TEST_USERNAME)
      .field('email', 'testify2@example.com')
      .field('password', TEST_USER_PASSWORD)
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe('This username is already taken!');
        expect(res.body.data).toBeUndefined();
      });
  });
});

// *************************************************************
// TESTING USER LOGIN ENDPOINT
// *************************************************************

describe('User Login Endpoint (POST /auth/signin)', () => {
  beforeEach(async () => {
    await User.create(USER_CREATION_DATA);
  });

  it('should successfully login user by email and password', async () => {
    await request(app)
      .post(`${API_URL}/auth/signin`)
      .send(TEST_LOGIN_DATA)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        const data = res.body.data.user;

        expect(data._id).toBeDefined();

        delete data._id;
        delete data.createdAt;
        delete data.updatedAt;

        expect(data).toEqual(EXPECTED_USER_DATA);

        expect(res.headers['set-cookie']).toBeTruthy();
        expect(res.headers['set-cookie'][0]).toContain('accessToken');
        expect(res.headers['set-cookie'][1]).toContain('refreshToken');
      });
  });

  it('should successfully login user by username and password', async () => {
    await request(app)
      .post(`${API_URL}/auth/signin`)
      .send(TEST_LOGIN_DATA)
      .expect('Content-Type', /json/)
      .expect(200);
  });

  it('should reject login with wrong password', async () => {
    await request(app)
      .post(`${API_URL}/auth/signin`)
      .send(WRONG_LOGIN_PASSWORD_DATA)
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe('Incorrect email address or password!');
        expect(res.body.data).toBeUndefined();
      });
  });

  it('should reject login with wrong or unregistered email', async () => {
    await request(app)
      .post(`${API_URL}/auth/signin`)
      .send(WRONG_LOGIN_EMAIL_DATA)
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe('Incorrect email address or password!');
        expect(res.body.data).toBeUndefined();
      });
  });

  it('should reject login with wrong username', async () => {
    await request(app)
      .post(`${API_URL}/auth/signin`)
      .send(WRONG_LOGIN_USERNAME_DATA)
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe('Incorrect username or password!');
        expect(res.body.data).toBeUndefined();
      });
  });

  it('should accept login from a 2FA enabled user', async () => {
    const user = await User.create(USER_CREATION_2FA);

    await request(app)
      .post(`${API_URL}/auth/signin`)
      .send(TEST_LOGIN_2FA_DATA)
      .expect('Content-Type', /json/)
      .expect(202)
      .expect(res => {
        expect(res.body.message).toBe('Two-factor Authentication is required!');
        expect(res.body.data).toEqual({
          userId: user._id.toString(),
        });
      });
  });
});

// *************************************************************
// TESTING USER 2FA LOGIN ENDPOINT
// *************************************************************

describe('User 2FA Login Endpoint (POST /auth/2fa-signin)', () => {
  beforeEach(async () => {
    const user = await User.create(USER_CREATION_DATA);
    await OTP.create({
      userId: user._id,
      otp: await bcrypt.hash(TEST_OTP, 10),
      context: '2FA',
    });
  });

  it('should successfully login user with correct OTP', async () => {
    const user = await User.findOne({ email: TEST_USER_EMAIL });

    await request(app)
      .post(`${API_URL}/auth/2fa-signin`)
      .send({
        userId: user?._id.toString(),
        otp: TEST_OTP,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        const data = res.body.data.user;

        expect(data._id).toBeDefined();

        delete data._id;
        delete data.createdAt;
        delete data.updatedAt;

        expect(data).toEqual(EXPECTED_USER_DATA);

        expect(res.headers['set-cookie']).toBeTruthy();
        expect(res.headers['set-cookie'][0]).toContain('accessToken');
        expect(res.headers['set-cookie'][1]).toContain('refreshToken');
      });
  });

  it('should reject login with wrong OTP', async () => {
    const user = await User.findOne({ email: TEST_USER_EMAIL });

    await request(app)
      .post(`${API_URL}/auth/2fa-signin`)
      .send({
        userId: user?._id.toString(),
        otp: '123456',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .expect(res => {
        expect(res.body.message).toBe('Incorrect OTP! Try again.');
        expect(res.body.data).toBeUndefined();
      });
  });
});
