import mongoose from "mongoose";
import Users from "./../../../DB/Models/user.model.js";
import Messages from "./../../../DB/Models/message.model.js";

export const SendMessageService = async (req, res) => {
  const { content } = req.body;
  const { receiverId } = req.params;

  // Check If receiverId Is True
  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Receiver ID" });
  }

  // Check If Receiver ID Is Real User
  const receiver = await Users.findById(receiverId);
  if (!receiver) {
    return res.status(400).json({ success: false, message: "User Not Found" });
  }

  // Create Message And Send It
  const message = new Messages({
    content,
    receiverId,
  });

  await message.save();

  return res
    .status(200)
    .json({ success: true, message: "Message Send Successfully", message });
};

export const GetMessagesService = async (req, res) => {
  const messages = await Messages.find().populate([
    {
      path: "receiverId",
      select: "firstName lastName age gender phoneNumber role",
    },
  ]);

  return res.status(200).json({ success: true, messages });
};
