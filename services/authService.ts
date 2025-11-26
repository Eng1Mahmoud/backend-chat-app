import { User } from "../model/Users.js";
import { emailService } from "./emailService.js";
import { Request, Response } from "express";
import { hashPassword, comparePassword, generateToken } from "../utils/authUtils.js";

class AuthService {
  // Create a new user
  async createUser(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }
      // Generate verification token
      const verificationToken = Math.random().toString(36).substring(2);
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Hash password using util
      const hashedPassword = await hashPassword(password);

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        verificationTokenExpires: verificationTokenExpires,
      });

      await newUser.save();
      // Send verification email (non-blocking to avoid delaying the response)
      emailService
        .sendVerificationEmail(email, verificationToken)
        .catch((err) => console.error("Error sending verification email:", err));

      return res.status(201).json({
        success: true,
        message:
          "User created. Verification email will be sent shortly. Please verify your email to activate your account. (Check your spam folder)",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ success: false, message });
    }
  }
  // Verify email
  async verifyEmail(req: Request, res: Response) {
    try {
      const token = (req.query.token as string) || "";
      if (!token) {
        return res.status(400).json({ success: false, message: "Verification token is required" });
      }

      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired verification token" });
      }

      user.isVerified = true;
      user.verificationToken = null as unknown as string;
      user.verificationTokenExpires = null as unknown as Date;
      await user.save();

      return res.json({ message: "Email verified successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, message });
    }
  }
  // Login user

  async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Fetch only required fields; ensure index usage on email
      const user = await User.findOne({ email })
        .select("password email username isVerified")
        .maxTimeMS(5000); // fail fast if query hangs

      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
      }

      if (!user.isVerified) {
        // resend verification email again
        emailService.sendVerificationEmail(user.email, user.verificationToken);
        return res.status(400).json({
          success: false,
          message:
            "Email not verified We have sent a verification email to your email again. (check your spam folder)",
        });
      }

      // Validate password using util
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
      }

      const token = generateToken({ _id: user._id, email: user.email });

      // Respond first for speed
      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ success: false, message });
    }
  }

  // Forgot Password
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Return success even if user not found to prevent enumeration attacks
        return res.json({
          success: true,
          message:
            "If an account with that email exists, we have sent a password reset link. (Check your spam folder)",
        });
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2);
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpires;
      await user.save();

      // Send reset email
      emailService
        .sendPasswordResetEmail(email, resetToken)
        .catch((err) => console.error("Error sending password reset email:", err));

      return res.json({
        success: true,
        message:
          "If an account with that email exists, we have sent a password reset link. (Check your spam folder)",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ success: false, message });
    }
  }

  // Reset Password
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ success: false, message: "Token and password are required" });
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
      }

      // Hash new password using util
      const hashedPassword = await hashPassword(password);

      user.password = hashedPassword;
      user.resetPasswordToken = null as unknown as string;
      user.resetPasswordExpires = null as unknown as Date;
      await user.save();

      return res.json({ success: true, message: "Password reset successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ success: false, message });
    }
  }
}

export const authService = new AuthService();
