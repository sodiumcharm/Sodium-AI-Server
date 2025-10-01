import { Request } from 'express';
import geoip from 'geoip-lite';
import formatLocalDate from '../utils/timeFormatter';
import { CLIENT_URL } from '../constants';
import { Mail } from '../types/types';

const generateLoginAttemptEmail = function (req: Request, userName: string): Mail {
  let city = 'Unknown';
  let country = 'Unknown';
  const siteUrl: string = CLIENT_URL;
  const year = new Date().getFullYear();

  let ip = req.socket.remoteAddress?.replace(/^::ffff:/, '') || 'Unknown';
  if (ip === '::1') ip = '127.0.0.1';

  const geo = ip !== '127.0.0.1' ? geoip.lookup(ip) : null;

  if (geo) {
    city = geo.city || 'Unknown';
    country = geo.country || 'Unknown';
  }

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

  const subject = `Security Alert: Login attempt detected on your Sodium AI account`;

  const text = `
SODIUM AI
Create • Connect • Discover

Hello ${userName},

We noticed an attempt to log in to your Sodium AI account using your username or email.

If this was you, you can safely ignore this message.  
If not, your account may be at risk.

DETAILS:
• Time: ${formatLocalDate(new Date())}
• IP Address: ${ip}
• Location: ${city}, ${country}
• Status: Unsuccessful

WHAT TO DO:
- Make sure your password is secure
- Change your password immediately if you suspect suspicious activity

Your security is our top priority.  

Need help? Visit our Help Center or contact Support.

---
© ${year} Sodium AI. All rights reserved.
This email was sent to you because security is important to us.
`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Security Alert</title>
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
              <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.1;">Security Alert</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">
                Hi <strong>${userName}</strong>, we detected a login attempt on your account.
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
                      For your protection, we want to let you know that someone tried to log in using your username or email. 
                      If this wasn’t you, your account may be at risk.
                    </p>

                    <!-- Features -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Time of attempt</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${formatLocalDate(new Date())}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">IP Address</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${ip}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Location</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${city}, ${country}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Status</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Unsuccessful attempt — no access was granted.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:18px 0 0 0;">
                      If it was not you, we recommend changing your password immediately and enable two-factor authentication.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding:20px 0 6px 0;">
                    <a href="${siteUrl}" target="_blank" style="display:inline-block;text-decoration:none;border-radius:8px;background:linear-gradient(90deg,#b00020,#f48fb1);padding:12px 20px;color:#fff;font-weight:600;font-size:15px;">
                      Secure My Account
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 0 0 0;color:#8b9aa3;font-size:12px;">
                    <p style="margin:0;">If you need help, reply to this email and our team will assist you.</p>
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

export default generateLoginAttemptEmail;
