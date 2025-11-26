import Mailjet from "node-mailjet";
import dotenv from "dotenv";

dotenv.config();

class EmailService {
  private mailjet: any;

  constructor() {
    // Initialize Mailjet with API keys
    this.mailjet = new Mailjet.Client({
      apiKey: process.env.MJ_APIKEY,
      apiSecret: process.env.MJ_SECRETKEY,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationLink = `${process.env.CLIENT_URL}/VerifyAccount?token=${token}`;

    const senderEmail = process.env.EMAIL_FROM;
    const senderName = process.env.EMAIL_FROM_NAME || "Chat App";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 0; text-align: center;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <!-- Header -->
                <div style="background: linear-gradient(to right, #6366f1, #a855f7, #ec4899); padding: 30px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Welcome to Chat App!</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; text-align: left;">
                  <h2 style="margin-top: 0; color: #18181b; font-size: 20px; font-weight: 600;">Verify your email address</h2>
                  <p style="margin: 16px 0; color: #52525b; font-size: 16px; line-height: 1.5;">
                    Thanks for signing up! We're excited to have you on board. Please confirm your account by clicking the button below.
                  </p>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${verificationLink}" style="display: inline-block; padding: 14px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s ease;">
                      Verify Account
                    </a>
                  </div>
                  
                  <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.5;">
                    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
                  <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} Chat App. All rights reserved.
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      const request = this.mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: senderName,
            },
            To: [
              {
                Email: to,
                Name: "User",
              },
            ],
            Subject: "Verify your email for Chat App",
            HTMLPart: htmlContent,
            TextPart: `Please verify your email by clicking the following link: ${verificationLink}`,
          },
        ],
      });

      // Send the email
     await request;
    
    } catch (error: any) {
      console.error("❌ Error sending verification email:", error.statusCode, error.message);
    }
  }
}

export const emailService = new EmailService();
