import { compareSync, hashSync } from "bcrypt";
import Users from "./../../../DB/Models/user.model.js";
import { customAlphabet } from "nanoid";
import { emitter } from "./../../../Utils/send-email.utils.js";
import { generateToken, verifyToken } from "../../../Utils/tokens.utils.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import BlackListedTokens from "../../../DB/Models/black-listed-tokens.model.js";
import Messages from "./../../../DB/Models/message.model.js";

const uniqueString = customAlphabet("0123456789", 5);

export const SignupService = async (req, res) => {
  const { firstName, lastName, email, password, age, gender, phoneNumber } =
    req.body;

  // Check If User Valid
  const isUserValid = await Users.findOne({
    $or: [{ email }, { $and: [{ firstName }, { lastName }] }],
  });

  if (isUserValid) {
    return res
      .status(409)
      .json({ success: false, message: "User Is Already Exist" });
  }

  // Hashing Password
  const hashedPassword = hashSync(password, +process.env.SALT_ROUNDS);

  // Create OTP
  const OTP = uniqueString();

  // Create User In DB
  const user = await Users.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    age,
    gender,
    phoneNumber,
    otps: { confermation: hashSync(OTP, +process.env.SALT_ROUNDS) },
  });

  const userObjectForResponse = user;
  delete userObjectForResponse.password;

  // Send Confirmation Email
  emitter.emit("sendEmail", {
    to: email,
    subject: "Confirmation Email",
    content: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 500px; margin: auto; background: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        
        <h1 style="color: #4CAF50; margin-bottom: 10px;">Confirm Your Email</h1>
        <p style="font-size: 16px; color: #555;">Thank you for signing up! Please use the OTP code below to confirm your email address:</p>
        
        <div style="font-size: 24px; font-weight: bold; background: #f0f0f0; padding: 10px; border-radius: 6px; display: inline-block; margin: 15px 0; color: #333;">
          ${OTP}
        </div>
        
        <p style="font-size: 14px; color: #777;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        
      </div>
    </div>
  `,
  });

  return res.status(200).json({
    success: true,
    message: "User Created Successfully",
    user: userObjectForResponse,
  });
};

export const ConfirmEmailService = async (req, res) => {
  const { email, otp } = req.body;

  const user = await Users.findOne({ email, isConfirmed: false });
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User Not Found Or Already Confirmed" });
  }

  // Validate On OTP
  const isOtpMatched = compareSync(otp, user.otps?.confermation);
  if (!isOtpMatched) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  user.isConfirmed = true;
  user.otps.confermation = undefined;

  user.save();

  return res
    .status(200)
    .json({ success: true, message: "Account Is Confirmed" });
};

export const SigninService = async (req, res) => {
  const { email, password } = req.body;

  const user = await Users.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Email Or Password" });
  }

  // Password Validation
  const isPasswordMatched = compareSync(password, user.password);
  if (!isPasswordMatched) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid Email Or Password" });
  }

  // Generate Access Token
  const accessToken = generateToken(
    { _id: user._id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    {
      jwtid: uuidv4(),
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    }
  );
  // Generate Refresh Token
  const refreshToken = generateToken(
    { _id: user._id, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    {
      jwtid: uuidv4(),
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    }
  );

  return res.status(200).json({
    success: true,
    message: "User Logged In Successfully",
    accessToken,
    refreshToken,
  });
};

export const UpdateAccountService = async (req, res) => {
  const { _id: userId } = req.loggedInUser;
  const { firstName, lastName, age, gender, email } = req.body;

  // Validate On User Id Format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid User ID" });
  }

  const user = await Users.findByIdAndUpdate(userId, {
    firstName,
    lastName,
    age,
    gender,
    email,
  });
  if (!user) {
    return res.status(404).json({ success: false, message: "User Not Found" });
  }

  return res
    .status(200)
    .json({ success: true, message: "User Updated Successfully" });
};

export const DeleteAccountService = async (req, res) => {
  // Start Session
  const session = await mongoose.startSession();
  req.session = session;

  const { _id: userId } = req.loggedInUser;

  // Start Transaction
  await session.startTransaction();

  // Validate On User ID Format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid User ID" });
  }

  // Delete User And His Messages
  const deletedUser = await Users.findByIdAndDelete(userId, { session });
  if (!deletedUser) {
    return res.status(404).json({ success: false, message: "User Not Found" });
  }

  await Messages.deleteMany({ receiverId: userId }, { session });
  
  // Commit Transaction
  await session.commitTransaction()

  return res
    .status(200)
    .json({ success: true, message: "User Deleted Successfully" });
};

export const ListUsersService = async (req, res) => {
  const { _id: userId } = req.loggedInUser;

  // Validate On User ID Format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid User ID" });
  }

  const users = await Users.find()
    .select("-password -__v -otps")
    .populate([
      {
        path: "Messages",
        select: "-__v",
      },
    ]);

  return res.status(200).json({ success: true, users });
};

export const LogoutService = async (req, res) => {
  const { _id: userId, tokenId, expirationDate } = req.loggedInUser;

  // Validate On User ID Format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid User ID" });
  }

  // Add Token To BlackList
  await BlackListedTokens.create({
    tokenId,
    expirationDate: new Date(expirationDate * 1000),
  });

  return res
    .status(200)
    .json({ success: true, message: "User Logged Out Successfully" });
};

export const RefreshTokenService = async (req, res) => {
  const { refreshtoken: refreshToken } = req.headers;

  const decotedData = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

  // Generate New Access Token
  const accessToken = generateToken(
    { _id: decotedData._id, email: decotedData.email },
    process.env.JWT_ACCESS_SECRET,
    {
      jwtid: uuidv4(),
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    }
  );

  return res.status(200).json({
    success: true,
    message: "User Token Is Refreshed Successfully",
    accessToken,
  });
};
