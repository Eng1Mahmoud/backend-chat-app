import { User } from "../model/Users.js";
import { emailService } from "./emailService.js";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
class UserService {
  // Create a new user
  async createUser(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body ;
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      // Generate verification token
      const verificationToken = Math.random().toString(36).substring(2);
      const verificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours from now
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(
        password,
        parseInt(process.env.SALT as string)
      );

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        verificationTokenExpires: verificationTokenExpires,
      });

      await newUser.save();
      // jwt token generation
      const token = jwt.sign(
        {  email: newUser.email, id: newUser._id },
        process.env.JWT_SECRET as string,
        { expiresIn: "24h" }
      );
      // Send verification email
      try {
        await emailService.sendVerificationEmail(email, verificationToken);
      } catch (emailError) {
        return res.status(201).json({
          message: "User created but failed to send verification email.",
          token,
        });
      }
      return res.status(201).json({
        message:
          "User created. Please verify your email to activate your account.",
        token,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  }
  // Verify email
  async verifyEmail(req: Request, res: Response) {
    try {
      const token = (req.query.token as string) || "";
      if (!token) {
        return res
          .status(400)
          .json({ error: "Verification token is required" });
      }

      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid or expired verification token" });
      }

      user.isVerified = true;
      user.verificationToken = null as unknown as string;
      user.verificationTokenExpires = null as unknown as Date;
      await user.save();

      return res.json({ message: "Email verified successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ error: message });
    }
  }
  // Login user

  async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      // Check if user exists
      if (!user) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      // Check if email is verified
      if (!user.isVerified) {
        return res.status(400).json({
          error:
            "Email not verified. Please verify your email before logging in.",
        });
      }
      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Invalid email or password" });
      }
      return res.json({ message: "Login successful" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  }
}

export const userService = new UserService();
