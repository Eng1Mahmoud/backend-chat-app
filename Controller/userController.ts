import { Request, Response } from "express";
import { userService } from "../services/userService.js";
class UserController {
  // Create a new user
  async createUser(req: Request, res: Response) {
    return userService.createUser(req, res);
  } 

  // Verify email
  async verifyEmail(req: Request, res: Response) {
    return userService.verifyEmail(req, res);
  }

  // Login user
  async loginUser(req: Request, res: Response) {
    return userService.loginUser(req, res);
  }
}
export const userController = new UserController();
