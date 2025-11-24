import { User } from "../model/Users.js";
import { Request, Response } from "express";
class UserService {
  // get user by id
  async getUserById(req: Request, res: Response) {
    try {
      const userId = req.user?._id
      const user = await User.findById(userId).select("-password -verificationToken -verificationTokenExpires");
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      return res.json({ success: true, user });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ success: false, message });
    }
  }

  // get all users 
  async getAllUsers(req: Request, res: Response) {
    try {
      const currentUserId = req.user?._id;
      // get all users except the current user
      const users = await User.find({ _id: { $ne: currentUserId } }).select("-password -verificationToken -verificationTokenExpires");
      return res.json({ success: true, users });
    } catch (error: unknown) {

      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ success: false, message });
    }
  }
}

export const userService = new UserService();
