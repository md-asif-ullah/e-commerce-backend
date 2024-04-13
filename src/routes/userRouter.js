import express from "express";
import upload from "../middlewares/uploadfile.js";
import {
    activateAccount,
    deleteUser,
    getUser,
    getUsers,
    processRegister,
    updateUserById,
} from "../controllers/userController.js";
import validateUserRegistration from "../validators/auth.js";
import runValidataon from "../validators/index.js";
import { isLoggedIn } from "../middlewares/Auth.js";
const userRouter = express.Router();

// user routes : /api/users

userRouter.get("/", isLoggedIn, getUsers);
userRouter.get("/:id", isLoggedIn, getUser);
userRouter.delete("/:id", isLoggedIn, deleteUser);
userRouter.post(
    "/process-register",
    upload.single("image"),
    validateUserRegistration,
    runValidataon,
    processRegister
);
userRouter.post("/activate", activateAccount);
userRouter.put("/:id", upload.single("image"), updateUserById);

export default userRouter;
