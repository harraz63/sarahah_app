import { Router } from "express";
import * as Services from "./Services/message.service.js";
const messageController = Router();

messageController.post("/send/:receiverId", Services.SendMessageService);
messageController.get("/", Services.GetMessagesService);


export default messageController;
