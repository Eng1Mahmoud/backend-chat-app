import { Request, Response } from "express";
import { userService } from "../services/userService.js";
class UserController {
  // Get user profile
  async getUserById(req: Request, res: Response) {
    return userService.getUserById(req, res);
  }
  // Get all users
  async getAllUsers(req: Request, res: Response) {
    return userService.getAllUsers(req, res);
  }
}
export const userController = new UserController();
