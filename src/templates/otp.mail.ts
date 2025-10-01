import { Mail } from '../types/types';

const generateOTPMail = function (
  userName: string,
  otp: string,
  context: '2FA' | 'verify-email' | 'forgot-password'
): Mail {
  let subject: string;

  if (context === '2FA') {
    subject = 'OTP For Two-factor Authentication: Sodium AI';
  } else if (context === 'verify-email') {
    subject = 'OTP For Email Verification: Sodium AI';
  } else {
    subject = 'OTP For Password Reset';
  }

  const text = `Hello ${userName},
  Here is your OTP: ${otp}
  This OTP will expire in 5 minures.
  
  If you did not request this, please ignore this email.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your OTP</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="360" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#37b24d;padding:16px 24px;color:#ffffff;font-size:18px;font-weight:bold;text-align:center;">
              Your OTP
            </td>
          </tr>
          <tr>
            <td style="padding:24px;text-align:center;color:#333;">
              <p style="font-size:16px;margin-bottom:8px;"><strong>${userName}</strong>, here is your one-time verification code:</p>
              <div style="font-size:28px;letter-spacing:4px;font-weight:bold;color:#37b24d;margin:16px 0;">
                ${otp}
              </div>
              <p style="font-size:14px;color:#666;">This code will expire in 5 minutes.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#999;">
              If you did not request this, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return { subject, text, html };
};

export default generateOTPMail;
