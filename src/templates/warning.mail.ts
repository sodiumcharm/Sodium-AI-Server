import { CLIENT_URL } from '../constants';
import { Mail } from '../types/types';
import formatLocalDate from '../utils/timeFormatter';

export const generateCharacterDisabledEmail = function (
  creatorName: string,
  characterName: string
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

  const subject = `Character Disabled: "${characterName}" has been permanently removed`;

  const text = `
SODIUM AI
Create • Connect • Discover

Hello ${creatorName},

After careful review of multiple user reports, we have permanently disabled your AI character "${characterName}" for violating our Community Guidelines.

CHARACTER DETAILS:
- Character: ${characterName}
- Status: Permanently Disabled
- Reason: Multiple reports - Community Guidelines violation
- Date: ${formatLocalDate(new Date())}

IMPORTANT: This character cannot be edited or re-approved. Due to the nature of the violations, this character has been permanently removed. You will need to create a new character if you wish to continue.

We take community safety seriously. Please review our Community Guidelines before creating new characters to ensure compliance. Repeated violations may result in account restrictions.

If you believe this action was taken in error, please contact our support team within 7 days.

---
© ${year} Sodium AI. All rights reserved.
This email was sent to you regarding your content on Sodium AI.
`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Character Disabled</title>
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
              <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.1;">Character Permanently Disabled</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">
                Hi <strong>${creatorName}</strong>, your character has been removed from Sodium AI.
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
                      After careful review of multiple user reports, we have permanently disabled your AI character 
                      <strong>"${characterName}"</strong> for violating our Community Guidelines.
                    </p>

                    <!-- Action Details -->
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
                          <strong style="vertical-align:middle;">Status</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Permanently Disabled
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Reason</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Multiple reports - Community Guidelines violation
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Action Taken</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${formatLocalDate(new Date())}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin:18px 0;padding:14px;background-color:#fff3e0;border-left:4px solid #f57c00;border-radius:4px;">
                      <p style="margin:0;color:#e65100;font-size:14px;font-weight:600;">
                        ⚠️ This character cannot be edited or re-approved
                      </p>
                      <p style="margin:8px 0 0 0;color:#5b6b72;font-size:13px;">
                        Due to the nature of the violations, this character has been permanently removed. 
                        You will need to create a new character if you wish to continue.
                      </p>
                    </div>

                    <p style="margin:18px 0 0 0;">
                      We take community safety seriously. Please review our Community Guidelines before creating new characters 
                      to ensure compliance. Repeated violations may result in account restrictions.
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
                    <p style="margin:0;">If you believe this action was taken in error, please contact our support team within 7 days.</p>
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

export const generateAccountSuspensionEmail = function (
  userName: string,
  suspensionEndDate: Date
): Mail {
  const siteUrl: string = CLIENT_URL;
  const year = new Date().getFullYear();

  const warningIcon = `
    <span style="
      display:inline-block;
      width:20px;
      height:20px;
      border-radius:50%;
      background-color:#e65100;
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

  const subject = `Account Suspended: Your Sodium AI account has been temporarily suspended`;

  const text = `
SODIUM AI
Create • Connect • Discover

Hello ${userName},

Your Sodium AI account has been temporarily suspended due to violations of our Community Guidelines or Terms of Service.

SUSPENSION DETAILS:
- Account: ${userName}
- Status: Temporarily Suspended
- Suspension End Date: ${formatLocalDate(suspensionEndDate)}
- Reason: Community Guidelines or Terms of Service violation

WHAT THIS MEANS:
During the suspension period, you will not be able to:
- Access your account
- Create or edit characters
- Interact with the community
- Use any Sodium AI features

Your account will be automatically reactivated on ${formatLocalDate(suspensionEndDate)}.

AFTER SUSPENSION:
Once your suspension ends, you'll regain full access to your account. However, please note that repeated violations may result in permanent account termination.

We strongly encourage you to review our Community Guidelines and Terms of Service to prevent future violations.

If you believe this suspension was issued in error, please contact our support team.

---
© ${year} Sodium AI. All rights reserved.
This email was sent to you regarding your Sodium AI account.
`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Account Suspended</title>
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
            <td style="background:linear-gradient(90deg,#e65100 0%, #ff9800 100%); border-radius:12px 12px 0 0; padding:28px 28px;" class="hero" align="left">
              <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.1;">Account Temporarily Suspended</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">
                Hi <strong>${userName}</strong>, your account has been temporarily suspended.
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
                      Your Sodium AI account has been temporarily suspended due to violations of our Community Guidelines or Terms of Service.
                    </p>

                    <!-- Suspension Details -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Account</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${userName}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Status</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Temporarily Suspended
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Suspension End Date</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            ${formatLocalDate(suspensionEndDate)}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${warningIcon}
                          <strong style="vertical-align:middle;">Reason</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Community Guidelines or Terms of Service violation
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin:18px 0;padding:14px;background-color:#fff3e0;border-left:4px solid #f57c00;border-radius:4px;">
                      <p style="margin:0;color:#e65100;font-size:14px;font-weight:600;">
                        ⚠️ What this means for your account
                      </p>
                      <p style="margin:8px 0 0 0;color:#5b6b72;font-size:13px;">
                        During the suspension period, you will not be able to access your account, create or edit characters, 
                        or interact with the community. Your account will be automatically reactivated on <strong>${formatLocalDate(suspensionEndDate)}</strong>.
                      </p>
                    </div>

                    <p style="margin:18px 0 0 0;">
                      Once your suspension ends, you'll regain full access to your account. However, please note that repeated violations 
                      may result in permanent account termination. We strongly encourage you to review our Community Guidelines and Terms of Service.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding:20px 0 6px 0;">
                    <a href="${siteUrl}" target="_blank" style="display:inline-block;text-decoration:none;border-radius:8px;background:linear-gradient(90deg,#e65100,#ff9800);padding:12px 20px;color:#fff;font-weight:600;font-size:15px;">
                      Review Community Guidelines
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 0 0 0;color:#8b9aa3;font-size:12px;">
                    <p style="margin:0;">If you believe this suspension was issued in error, please contact our support team.</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:14px 28px 6px 28px;color:#9aa7ad;font-size:12px;text-align:center;">
              © ${year} Sodium AI — AI character creation platform.
              <div style="margin-top:6px;"><a href="${siteUrl}" target="_blank" style="color:#e65100;text-decoration:none;">${siteUrl}</a></div>
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
