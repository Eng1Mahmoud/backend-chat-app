import { User } from "../model/Users.js";
import { emailService } from "./emailService.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
class AuthService {
  // Create a new user
  async createUser(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({success: false, message: "User already exists" });
      }
      // Generate verification token
      const verificationToken = Math.random().toString(36).substring(2);
      const verificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours from now
      // Hash password before saving (clamp salt rounds for performance)
      const rawRounds = Number(process.env.SALT);
      const saltRounds = Number.isFinite(rawRounds)
        ? Math.min(Math.max(4, rawRounds), 12)
        : 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

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
        .catch((err) =>
          console.error("Error sending verification email:", err)
        );

      return res.status(201).json({
        success: true,
        message:
          "User created. Verification email will be sent shortly. Please verify your email to activate your account.",
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
        return res
          .status(400)
          .json({ success: false, message: "Verification token is required" });
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
        return res.status(400).json({
          success: false,
          message:
            "Email not verified. Please verify your email before logging in.",
        });
      }

      // Validate password (bcrypt compare cost defined by stored hash)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { _id: user._id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "24h" }
      );

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

  


}

export const authService = new AuthService();
