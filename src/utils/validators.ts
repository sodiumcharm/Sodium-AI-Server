const isValidEmail = function (email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  email = email.trim();

  if (!email || typeof email !== 'string') return false;

  if (email.length > 254) return false;

  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) return false;

  const [localPart, domainPart] = email.split('@');

  if (localPart.length === 0 || localPart.length > 64) return false;

  if (domainPart.length === 0 || domainPart.length > 253) return false;

  if (email.includes('..')) return false;

  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;

  if (
    domainPart.startsWith('.') ||
    domainPart.endsWith('.') ||
    domainPart.startsWith('-') ||
    domainPart.endsWith('-')
  ) {
    return false;
  }

  if (!emailRegex.test(email)) return false;

  if (!domainPart.includes('.')) return false;

  const domainLabels = domainPart.split('.');

  for (let label of domainLabels) {
    if (label.length === 0 || label.length > 63) return false;

    if (label.startsWith('-') || label.endsWith('-')) return false;
  }

  const tld = domainLabels[domainLabels.length - 1];

  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;

  return true;
};

const isValidName = function (name: string): boolean {
  const INVALID_CHARS_REGEX =
    /[0-9!"#$%&()*+,./:;<=>?@[\\\]^_`{|}~¡¢£¤¥¦§¨©ª«¬­®¯°±²³´¶·¸¹º»¼½¾¿×÷]/;

  if (typeof name !== 'string') return false;

  name = name.trim();

  if (name.length < 2 || name.length > 50) return false;

  if (name.startsWith('-') || name.endsWith('-')) return false;

  return !INVALID_CHARS_REGEX.test(name);
};

const isValidUsername = function (username: string): boolean {
  if (typeof username !== 'string') return false;

  username = username.trim();

  return /^[a-zA-Z_-][a-zA-Z0-9_-]{2,19}$/.test(username);
};

export { isValidEmail, isValidName, isValidUsername };
