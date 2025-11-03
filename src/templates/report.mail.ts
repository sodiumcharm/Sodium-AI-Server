import { CLIENT_URL } from '../constants';
import { Mail } from '../types/types';
import formatLocalDate from '../utils/timeFormatter';

const generateCharacterReportEmail = function (
  userName: string,
  characterName: string,
  reportReason: string
): Mail {
  const siteUrl: string = CLIENT_URL;
  const year = new Date().getFullYear();

  const warningIcon = `
    <span style="
      display:inline-block;
      width:20px;
      height:20px;
      border-radius:50%;
      background-color:#b00020;
      text-align:center;
      line-height:20px;
      font-size:14px;
      color:#ffffff;
      font-weight:bold;
      font-family:Arial, Helvetica, sans-serif;
      vertical-align:middle;
      margin-right:12px;
    ">!</span>
  `;

  const subject = `Report Alert: Your character "${characterName}" has been reported`;

  const text = `
SODIUM AI
Create • Connect • Discover

Hello ${userName},

Your AI character "${characterName}" has been reported by a user on Sodium AI.

REPORT DETAILS:
- Character: ${characterName}
- Reason: ${reportReason}
- Time: ${formatLocalDate(new Date())}

WHAT HAPPENS NEXT:
Our moderation team will review this report and determine if any action is needed.
If your character violates our Community Guidelines, it may be removed or restricted.

Please ensure your characters comply with our Terms of Service and Community Guidelines.

Need help? Visit our Help Center or contact Support.

---
© ${year} Sodium AI. All rights reserved.
This email was sent to you regarding your content on Sodium AI.
`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Character Report Alert</title>
  <style>
    @media only screen and (max-width:480px) {
      .container { width:100% !important; padding:12px !important; }
      .hero { padding:20px !important; }
      .feature { display:block !important; width:100% !important; }
      .big-btn { padding:12px 18px !important; font-size:16px !important; }
    }
    body, table, td { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;" class="container">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(90deg,#b00020 0%, #f48fb1 100%); border-radius:12px 12px 0 0; padding:28px 28px;" class="hero" align="left">
              <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.1;">Character Report Alert</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">
                <strong>Hello ${userName},</strong> Your character <strong>"${characterName}"</strong> has been reported by a user.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:20px 28px;border:1px solid #e6e9ec;border-top:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#0f2130;font-size:15px;line-height:1.5;">
                    <p style="margin:0 0 12px 0;">
                      We're reaching out to inform you that one of your AI characters has been reported by a user on Sodium AI. 
                      Our moderation team will review this report to ensure community safety.
                    </p>

                    <!-- Report Details -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Character Name</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${characterName}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Report Reason</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${reportReason}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Report Time</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${formatLocalDate(new Date())}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:18px 0 0 0;">
                      Please ensure all your characters comply with our Community Guidelines and Terms of Service. 
                      If violations are found, appropriate action may be taken including content removal or account restrictions.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding:20px 0 6px 0;">
                    <a href="${siteUrl}" target="_blank" style="display:inline-block;text-decoration:none;border-radius:8px;background:linear-gradient(90deg,#b00020,#f48fb1);padding:12px 20px;color:#fff;font-weight:600;font-size:15px;">
                      Review Community Guidelines
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 0 0 0;color:#8b9aa3;font-size:12px;">
                    <p style="margin:0;">If you believe this report was made in error or have questions, please reply to this email.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:14px 28px 6px 28px;color:#9aa7ad;font-size:12px;text-align:center;">
              © ${year} Sodium AI — AI character creation platform.
              <div style="margin-top:6px;"><a href="${siteUrl}" target="_blank" style="color:#b00020;text-decoration:none;">${siteUrl}</a></div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
};

export default generateCharacterReportEmail;
