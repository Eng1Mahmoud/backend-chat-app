import { Router } from "express";
import { authController } from "../Controller/authController.js";
const authRouter = Router();

// Route to create a new user

authRouter.post("/signup", (req, res) => authController.createUser(req, res));
// Route to verify email with token query param
authRouter.get("/verify-email", (req, res) => authController.verifyEmail(req, res));
// Route to login user
authRouter.post("/login", (req, res) => authController.loginUser(req, res));
// Route to forgot password
authRouter.post("/forgot-password", (req, res) => authController.forgotPassword(req, res));
// Route to reset password
authRouter.post("/reset-password", (req, res) => authController.resetPassword(req, res));

export { authRouter };
