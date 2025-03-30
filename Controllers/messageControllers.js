const Conversation = require("../Models/conversationModel");
const Message = require("../Models/messageModel");
const { successResponse } = require("../Response/response");
exports.sendMessage = async (req, res, next) => {
  try {
    const message = req.body.message;
    const senderId = req.id;
    const receiverId = req.params.id;

    let conversation = await Conversation.findOne({
      participants: { $all: { senderId, receiverId } },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    if (newMessage) conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    successResponse(res, {
      statusCode: 200,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMessage = async (req, res, next) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
      throw createError(404, "Conversation not found");
    }
    successResponse(res, {
      statusCode: 200,
      message: "Messages fetched successfully",
      data: conversation.messages,
    });
  } catch (error) {
    next(error);
  }
};
