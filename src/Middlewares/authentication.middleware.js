import BlackListedTokens from "../DB/Models/black-listed-tokens.model.js";
import User from "../DB/Models/user.model.js";
import { verifyToken } from "../Utils/tokens.utils.js";

export const authenticationMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization; // standard header

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1]; // extract token after "Bearer"

  // Verify Token
  const decodedData = verifyToken(token, process.env.JWT_ACCESS_SECRET);
  if (!decodedData?.jti) {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }

  // Check If Token Is Blacklisted
  const blackListedToken = await BlackListedTokens.findOne({
    tokenId: decodedData.jti,
  });
  if (blackListedToken) {
    return res
      .status(401)
      .json({ success: false, message: "Token Is Blacklisted" });
  }

  // Get User Data From DB
  const user = await User.findById(decodedData._id, "-password").lean();
  if (!user) {
    return res.status(404).json({ success: false, message: "User Not Found" });
  }

  req.loggedInUser = {
    ...user,
    tokenId: decodedData.jti,
    expirationDate: decodedData.exp,
  };

  next();
};
