import User from '../../models/user.model';

const generateBaseUsername = function (fullname: string): string {
  let base = fullname
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (base.length > 15) base = base.slice(0, 15);

  return base;
};

const generateUserCode = function (base: string): string {
  const randomNum = Math.floor(1000 + Math.random() * 90000);
  let username = base + randomNum;

  if (username.length > 20) username = username.slice(0, 20);

  return username;
};

export const generateUniqueUsername = async function (fullname: string): Promise<string> {
  const base = generateBaseUsername(fullname);

  let username: string | null = null;
  let isTaken = true;
  let attempts = 0;

  while (isTaken) {
    attempts++;
    if (attempts > 50) break;
    username = generateUserCode(base);

    const existing = await User.findOne({ username });

    if (!existing) isTaken = false;
  }

  return username as string;
};
