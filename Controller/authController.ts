import { Request, Response } from "express";
import {authService} from "../services/authService.js"
class AuthController {
  // Create a new user
  async createUser(req: Request, res: Response) {
    return authService.createUser(req, res);
  } 

  // Verify email
  async verifyEmail(req: Request, res: Response) {
    return authService.verifyEmail(req, res);
  }

  // Login user
  async loginUser(req: Request, res: Response) {
    return authService.loginUser(req, res);
  }

}
export const authController = new AuthController();
  