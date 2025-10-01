import { CLIENT_URL } from '../constants';
import { Mail } from '../types/types';

const generateWelcomeEmail = function (userName: string): Mail {
  const siteUrl: string = CLIENT_URL;

  const year = new Date().getFullYear();

  const checkIcon = `
    <span style="
      display:inline-block;
      width:20px;
      height:20px;
      border-radius:50%;
      background-color:#0b6623;
      text-align:center;
      line-height:20px;
      font-size:14px;
      color:#ffffff;
      font-weight:bold;
      font-family:Arial, Helvetica, sans-serif;
      vertical-align:middle;
      margin-right:12px;
    ">✓</span>
  `;

  const subject = `Welcome to Sodium AI, ${userName}!`;

  const text = `
SODIUM AI
Create • Connect • Discover

Welcome aboard, ${userName}!

We're thrilled to have you join the Sodium AI community! You've just unlocked access to the most advanced AI character creation platform where imagination meets intelligence.

KEY FEATURES:

🎭 CHARACTER CREATION
Design unique AI personalities with rich backstories and complex traits

🧠 PSYCHOLOGY-BASED
Craft characters using MBTI, Enneagram, and attachment styles

📖 PLOT INTEGRATION
Build compelling narratives and storylines for your characters

⭐ ZODIAC & TRAITS
Add astrological elements and personality nuances

SUPPORTED PERSONALITY SYSTEMS:
• MBTI Types
• Enneagram
• Attachment Styles
• Zodiac Signs
• Custom Traits
• Plot Elements

Ready to bring your first AI character to life? Our intuitive creation tools are waiting for you, complete with advanced personality mapping and narrative development features.

GET STARTED: Visit your dashboard to start creating characters

Thank you for choosing Sodium AI - where every character has a story to tell.

Need help? Visit our Help Center or join our Community for support and updates.

---
© ${year} Sodium AI. All rights reserved.
This email was sent to you because you signed up for Sodium AI.
`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Welcome to Sodium AI</title>
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
            <td style="background:linear-gradient(90deg,#0b6623 0%, #cde76a 100%); border-radius:12px 12px 0 0; padding:28px 28px;" class="hero" align="left">
              <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.1;">Welcome to Sodium AI</h1>
              <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.95);font-size:14px;">
                Hi <strong>${userName}</strong>, thank you for joining. Build deeply believable AI characters — fast, secure, and with creative control.
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
                      Sodium AI helps you create AI characters with professional-level nuance — whether for storytelling, prototyping, role-play, or research.
                    </p>

                    <!-- Features -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${checkIcon}
                          <strong style="vertical-align:middle;">Create characters from a plot</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Quickly spin up characters tailored to any storyline or setting.
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${checkIcon}
                          <strong style="vertical-align:middle;">Personality-driven behavior</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Define MBTI, Enneagram, attachment style, and more to shape consistent responses.
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${checkIcon}
                          <strong style="vertical-align:middle;">Real-trait fine-tuning</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Tune beliefs, memories, and reaction patterns to increase realism.
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:10px 0;" class="feature">
                          ${checkIcon}
                          <strong style="vertical-align:middle;">Zodiac & cultural flavors</strong>
                          <div style="color:#5b6b72;font-size:13px;margin-top:4px;margin-left:32px;">
                            Add astrological, cultural, or era-specific traits to fit your narrative.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:18px 0 0 0;">
                      To get started, visit your dashboard and create your first character. Sodium AI is built to be fast, secure, and focused on creative control — you keep authorship and context.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" style="padding:20px 0 6px 0;">
                    <a href="${siteUrl}" target="_blank" style="display:inline-block;text-decoration:none;border-radius:8px;background:linear-gradient(90deg,#0b6623,#cde76a);padding:12px 20px;color:#fff;font-weight:600;font-size:15px;">
                      Visit Sodium AI
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
              <div style="margin-top:6px;"><a href="${siteUrl}" target="_blank" style="color:#0b6623;text-decoration:none;">${siteUrl}</a></div>
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

export default generateWelcomeEmail;
