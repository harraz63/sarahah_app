import { Router } from "express";
import * as Services from "./Services/user.service.js";
import { authenticationMiddleware } from "./../../Middlewares/authentication.middleware.js";
import { authorizationMiddleware } from "./../../Middlewares/authorization.middleware.js";
import { RoleEnum } from "../../Common/enums/user.enum.js";
import { SignupSchema } from "../../Validators/Schemas/user.schema.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";

const userController = Router();

// Authentication Routes
userController.post(
  "/signup",
  validationMiddleware(SignupSchema),
  Services.SignupService
);
userController.post("/signin", Services.SigninService);
userController.put("/confirm", Services.ConfirmEmailService);
userController.post("/refresh-token", Services.RefreshTokenService);
userController.post(
  "/logout",
  authenticationMiddleware,
  Services.LogoutService
);

// Account Routes
userController.post(
  "/update",
  authenticationMiddleware,
  Services.UpdateAccountService
);
userController.delete(
  "/delete",
  authenticationMiddleware,
  Services.DeleteAccountService
);

// Admin Routes
userController.get(
  "/list",
  authenticationMiddleware,
  authorizationMiddleware([
    RoleEnum.ADMIN,
    RoleEnum.SUPER_ADMIN,
    RoleEnum.USER,
  ]),
  Services.ListUsersService
);

export default userController;
