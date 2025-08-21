import "dotenv/config";
import express from "express";
import dbConnection from "./DB/db.connection.js";
import userController from "./Modules/Users/user.controller.js";
import messageController from "./Modules/Messages/message.controller.js";

const app = express();
dbConnection();
app.use(express.json());

app.use("/user", userController);
app.use("/message", messageController);


// 404 Handling
app.use((req, res, next) => {
  res.status(404).send({ success: false, message: "404 Not Found" });
});

// Error Handling
app.use(async (err, req, res, next) => {
  console.error(err.stack);

  if (req.session && req.session.inTransaction()) {
    // Abort Transaction on Error
    await req.session.abortTransaction();
    // End Session
    req.session.endSession();
    console.log("The Transaction Is Aborted");
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(+process.env.PORT);
