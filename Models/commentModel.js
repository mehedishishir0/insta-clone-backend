const mongoose = require("mongoose");

const commentsSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
});

const Comment = mongoose.model("Comment", commentsSchema);

module.exports = Comment;
