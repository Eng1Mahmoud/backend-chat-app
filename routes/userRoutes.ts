import { Router } from "express";
const userRouter = Router();
import { userController } from "../Controller/userController.js";

// Route to get user profile by ID
userRouter.get("/profile", (req, res) => userController.getUserById(req, res));
// Route to get all users
userRouter.get("/", (req, res) => userController.getAllUsers(req, res));

export { userRouter };
