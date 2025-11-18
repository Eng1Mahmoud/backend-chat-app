import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

class EmailService {
  private transporter: nodemailer.Transporter | undefined;
  constructor() {
    this.createTransporter();
  }
  private createTransporter() {
    if (process.env.NODE_ENV === "production") {
      // Production configuration (e.g., SendGrid, Mailgun, AWS SES)
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.APP_PASSWORD,
        },
        secure: true, // Use TLS
        tls: {
          rejectUnauthorized: false, // Accept self-signed certificates in production (not recommended for production)
        },
      });
    } else {
      // Development configuration - using Gmail for testing
      // You can also use Mailtrap, Ethereal Email, or other testing services
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: process.env.EMAIL_USER || "your-email@gmail.com",
          pass: process.env.APP_PASSWORD || "your-app-password",
        },
        tls: {
          rejectUnauthorized: false, // Accept self-signed certificates in development
        },
      });
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Email Verification",
      html: `<p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>`,
    };
    try {
      await this.transporter!.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending verification email:", error);
    }
  }
}

export const emailService = new EmailService();
