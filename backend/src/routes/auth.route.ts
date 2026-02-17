import { Router } from "express";
import { login,register,  logout,checkAuth} from "../controller/auth.controller.js";

const authRouter = Router();


authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.get("/me", checkAuth);
authRouter.post("/logout", logout);


export default authRouter;