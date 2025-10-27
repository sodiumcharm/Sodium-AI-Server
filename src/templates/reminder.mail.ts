import { Mail } from '../types/types';

export const generateReminderMail = (
  userName: string,
  characterName: string,
  message: string
): Mail => {
  const subject = `${characterName} has a reminder for you — Sodium AI`;

  const text = `Hello ${userName},

${characterName} wanted to remind you:

"${message}"

Stay connected with your AI companion 💚
— Sodium AI`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${characterName} is waiting for you</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="360" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#37b24d;padding:16px 24px;color:#ffffff;font-size:18px;font-weight:bold;text-align:center;">
              A Message from ${characterName}
            </td>
          </tr>
          <tr>
            <td style="padding:24px;text-align:center;color:#333;">
              <p style="font-size:16px;margin-bottom:12px;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="font-size:15px;margin:12px 0;color:#444;">
                ${characterName} wanted to remind you:
              </p>
              <blockquote style="font-size:18px;font-style:italic;color:#37b24d;margin:16px auto;padding:12px 16px;border-left:4px solid #37b24d;background-color:#f9fafb;border-radius:4px;max-width:280px;">
                “${message}”
              </blockquote>
              <p style="font-size:14px;color:#666;margin-top:20px;">
                Stay connected and keep building your story together 💚
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#999;">
              Sent with care by <strong>${characterName}</strong> · Sodium AI
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
