import { Router } from "express";
const userRouter = Router();
import { userController } from "../Controller/userController.js";

// Route to create a new user

userRouter.post("/signup", (req, res) =>
  userController.createUser(req, res)
);

// Route to verify email with token query param
userRouter.get("/verify-email", (req, res) =>
  userController.verifyEmail(req, res)
);
// Route to login user
userRouter.post("/login", (req, res) =>
  userController.loginUser(req, res)
);
// Route to get user profile by ID
userRouter.get("/:id", (req, res) =>
  userController.getUserById(req, res)
);
// Route to get all users
userRouter.get("/", (req, res) =>
  userController.getAllUsers(req, res)
);

export { userRouter };
