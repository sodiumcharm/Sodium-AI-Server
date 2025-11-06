import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { TEST_USER_EMAIL, TEST_FULLNAME, TEST_USER_ID } from '../src/constants';
import { UserDocument } from '../src/types/types';
