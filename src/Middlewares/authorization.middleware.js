export const authorizationMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const { role } = req.loggedInUser;

    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(401).json({ success: false, message: "Unauthorized" });
  };
};
