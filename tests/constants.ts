export const TEST_USER_ID = '69020b5ee9467cd382b501b6';
export const TEST_USER_EMAIL = 'bhootumr@gmail.com';
export const TEST_USERNAME = 'Testify';
export const TEST_FULLNAME = 'Test User';
export const TEST_USER_PASSWORD = 'Example12345#';
export const TEST_OTP = '854758';

export const USER_CREATION_DATA = {
  fullname: TEST_FULLNAME,
  username: TEST_USERNAME,
  registeredBy: 'credentials',
  email: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD,
  profileImage: '',
  profileImageId: '',
};

export const USER_CREATION_2FA = {
  fullname: TEST_FULLNAME + ' TwoFA',
  username: TEST_USERNAME + '2FA',
  registeredBy: 'credentials',
  email: '2fa@example.com',
  password: TEST_USER_PASSWORD,
  profileImage: '',
  profileImageId: '',
  twoFAEnabled: true,
  isEmailVerified: true,
};

export const EXPECTED_USER_DATA = {
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
};

export const TEST_LOGIN_DATA = {
  email: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD,
};

export const TEST_LOGIN_2FA_DATA = {
  username: TEST_USERNAME + '2FA',
  password: TEST_USER_PASSWORD,
};

export const WRONG_LOGIN_PASSWORD_DATA = {
  email: TEST_USER_EMAIL,
  password: 'WrongPassword123%',
};

export const WRONG_LOGIN_EMAIL_DATA = {
  email: 'wrongemail@example.com',
  password: TEST_USER_PASSWORD,
};

export const WRONG_LOGIN_USERNAME_DATA = {
  username: 'WrongUsername',
  password: TEST_USER_PASSWORD,
};
