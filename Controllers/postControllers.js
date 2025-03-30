const sharp = require("sharp");
const { successResponse } = require("../Response/response");
const createError = require("http-errors");
const cloudinary = require("../Config/cloudinary");
const Post = require("../Models/postModel");
const User = require("../Models/userModel");
const Comment = require("../Models/commentModel");

exports.newPost = async (req, res, next) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!image) {
      throw createError(400, "Image are required");
    }

    // Resize and optimize the image
    const optimizedImage = await sharp(image.buffer)
      .resize({
        width: 800,
        height: 800,
        withoutEnlargement: true,
        fit: "inside",
      })
      .withMetadata()
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convert the image to base64 format to send to the client
    const fileuri = `data:image/jpeg;base64,${optimizedImage.toString(
      "base64"
    )}`;

    // Save the optimized image to cloudinary
    const imageUrl = await cloudinary.uploader.upload(fileuri, {
      folder: "instagram/posts",
      public_id: `post_${authorId}`,
    });

    if (!imageUrl) {
      throw createError(500, "Failed to upload image to Cloudinary");
    }
    // Save the post to the database
    const post = await Post.create({
      caption,
      author: authorId,
      image: {
        public_id: imageUrl.public_id,
        url: imageUrl.secure_url,
      },
    });
    // Add the post id to the user's posts array
    const user = await User.findById(authorId);
    if (!user) {
      throw createError(404, "User not found");
    }
    user.posts.push(post._id);
    await user.save();

    // Populate the author information before sending the response
    await post.populate("author", "-password");

    // Send the created post back to the client
    successResponse(res, {
      statusCode: 201,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profilePic")
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username profilePic" },
      });
      posts.sort(() => 0.5 - Math.random());
      successResponse(res, {
      statusCode: 200,
      message: "Posts fetched successfully",
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPostById = async (req, res, next) => {
  try {
    const authorId = req.id;
    const post = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username, profilePic" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: { path: "author", select: "username, profilePic" },
      });

    if (!post) {
      throw createError(404, "Post not found");
    }

    successResponse(res, {
      statusCode: 200,
      message: "Post fetched successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

exports.likePost = async (req, res, next) => {
  try {
    const sendLikeUser = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      throw createError(404, "Post not found");
    }

    await post.updateOne({ $addToSet: { likes: sendLikeUser } });
    await post.save();

    successResponse(res, {
      statusCode: 200,
      message: "Post liked successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.disLikePost = async (req, res, next) => {
  try {
    const disLikeUser = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      throw createError(404, "Post not found");
    }

    await post.updateOne({ $pull: { likes: disLikeUser } });
    await post.save();

    successResponse(res, {
      statusCode: 200,
      message: "Post disliked successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.commentPost = async (req, res, next) => {
  try {
    const sendComment = req.id;
    const postId = req.params.id;
    const { commentText } = req.body;
    if (!commentText) {
      throw createError(404, "please write a comment");
    }
    const post = await Post.findById(postId);
    if (!post) {
      throw createError(404, "Post not found");
    }
    const comment = await Comment.create({
      comment: commentText,
      author: sendComment,
      post: postId,
    });

    // Populate the author information before sending the response
    await Comment.findById(comment._id).populate(
      "author",
      "username profilePic"
    );

    post.comments.push(comment._id);
    await post.save();
    successResponse(res, {
      statusCode: 200,
      message: "Comment successfully",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCommentPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username profilePic"
    );
    if (!comments) {
      throw createError(404, "Comments not found");
    }
    successResponse(res, {
      statusCode: 200,
      message: "Comments fetched successfully",
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if (!post) {
      throw createError(404, "Post not found");
    }

    if (String(post.author) !== String(authorId)) {
      throw createError(403, "Unauthorized to delete this post");
    }

    await Post.findByIdAndDelete(postId);

    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => String(id) !== String(postId));
    await user.save();
    await Comment.deleteMany({ post: postId });

    successResponse(res, {
      statusCode: 200,
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.bookmarkPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if (!post) {
      throw createError(404, "Post not found");
    }
    const user = await User.findById(authorId);
    if (user.bookmarks.includes(post._id)) {
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      successResponse(res, {
        statusCode: 200,
        message: "Post removed from bookmarks",
        data: { type: "unsaved" },
      });
    } else {
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      successResponse(res, {
        statusCode: 200,
        message: "Post added to bookmarks",
        data: { type: "saved" },
      });
    }
  } catch (error) {
    next(error);
  }
};
