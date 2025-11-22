import { Router } from "express";
import { authController } from "../Controller/authController.js";
const authRouter = Router();

// Route to create a new user

authRouter.post("/signup", (req, res) => authController.createUser(req, res));
// Route to verify email with token query param
authRouter.get("/verify-email", (req, res) =>
  authController.verifyEmail(req, res)
);
// Route to login user
authRouter.post("/login", (req, res) => authController.loginUser(req, res));

export { authRouter };