import Joi from "joi";
import { GenderEnum } from "../../Common/enums/user.enum.js";

export const SignupSchema = {
  body: Joi.object({
    firstName: Joi.string().alphanum().required().messages({
      "string.base": "First Name Must Be A String",
      "any.required": "First Name Is Required",
      "string.alphanum": "First Name Must Contain Only Letters And Numbers",
    }),
    lastName: Joi.string().min(3).max(10).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/
      )
      .required()
      .messages({
        "string.pattern.base":
          "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character",
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Confirm Password must match Password",
        "any.required": "Confirm Password is required",
      }),
    gender: Joi.string()
      .valid(...Object.values(GenderEnum))
      .required(),
    age: Joi.number().greater(18).less(100).required(),
    phoneNumber: Joi.string().required(),
  }),
};
