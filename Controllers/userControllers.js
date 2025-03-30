const createError = require("http-errors");
const User = require("../Models/userModel");
const bcryptjs = require("bcryptjs");
const { successResponse } = require("../Response/response");
const jwt = require("jsonwebtoken");
const createJwtToken = require("../Helper/createJwtToken");
const cloudinary = require("../Config/cloudinary");
const mongoose = require("mongoose");
const dataUri = require("../Utils/dataUri");
const Post = require("../Models/postModel");

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      throw createError(400, "All fields are required");
    }
    const user = await User.findOne({ email });
    if (user) {
      throw createError(409, "Email already registered");
    }
    // Check if username already exists
    const existUsername = await User.findOne({ username });
    if (existUsername) {
      throw createError(
        409,
        "Username already registered. try onther username"
      );
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcryptjs.hash(password, 10);
    // Save the user to the database

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    successResponse(res, {
      statusCode: 201,
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createError(400, "Email and password are required");
    }

    let user = await User.findOne({ email });

    if (!user) {
      throw createError(401, "Invalid email or password");
    }

    // Compare the hashed password with the provided password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      throw createError(401, "Invalid email or password");
    }

    // Generate JWT token
    const token = createJwtToken(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      "1d"
    );

    const populatePost = await Promise.all(
      user.posts.map(async (postId) => {
        const post = await Post.findById(postId);
        if (post.author.equals(user._id)) {
          return post;
        }
        return null;
      })
    );

    const getUser = {
      _id: user._id,
      username: user.username,
      profilePic: user.profilePic,
      email: user.email,
      posts: populatePost,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
    };

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });
    successResponse(res, {
      statusCode: 200,
      message: "User logged in successfully",
      data: getUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.logOut = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });
    successResponse(res, {
      statusCode: 200,
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw createError(400, "Invalid service ID format");
    }
    const user = await User.findById(userId)
      .select("-password")
      .populate({ path: "posts", createdAt: -1 })
      .populate("bookmarks");
    if (!user) {
      throw createError(404, "User not found");
    }
    successResponse(res, {
      statusCode: 200,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw createError(400, "Invalid service ID format");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw createError(404, "User not found");
    }
    // Upload profile picture to Cloudinary
    if (profilePicture) {
      const profilePicUrl = await cloudinary.uploader.upload(
        dataUri(profilePicture),
        {
          folder: "instagram/profile_Pic",
        }
      );
      user.profilePic = {
        public_id: profilePicUrl.public_id,
        url: profilePicUrl.secure_url,
      };
    }
    user.bio = bio;
    user.gender = gender;
    await user.save();
    successResponse(res, {
      statusCode: 200,
      message: "profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSugesteduser = async (req, res, next) => {
  try {
    const userId = req.id;
    const users = await User.find({ _id: { $ne: userId } })
      .select("-password")
      .limit(30);
    users.sort(() => 0.5 - Math.random()); // Randomize the suggested users by shuffling the array
    if (!users) {
      throw createError(404, "No sugested users found"); // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 404 if no users are found in the database  // Return 40
    }

    successResponse(res, {
      statusCode: 200,
      message: "Suggested users fetched successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

exports.followUnfllowUser = async (req, res, next) => {
  try {
    const sendfollowUser = req.id;
    const receiveFlowerUser = req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(sendfollowUser) ||
      !mongoose.Types.ObjectId.isValid(receiveFlowerUser)
    ) {
      throw createError(400, "Invalid user ID format");
    }
    if (sendfollowUser === receiveFlowerUser) {
      throw createError(400, "You can't follow yourself");
    }
    const user = await User.findById(sendfollowUser);
    const targetUser = await User.findById(receiveFlowerUser);
    if (!user || !targetUser) {
      throw createError(404, "User not found");
    }
    if (user.following.includes(receiveFlowerUser)) {
      await Promise.all([
        User.findByIdAndUpdate(sendfollowUser, {
          $pull: { following: receiveFlowerUser },
        }),
        User.findByIdAndUpdate(receiveFlowerUser, {
          $pull: { followers: sendfollowUser },
        }),
      ]);
      successResponse(res, {
        statusCode: 200,
        message: "unfollowed successfully",
      });
    } else {
      await Promise.all([
        User.findByIdAndUpdate(sendfollowUser, {
          $push: { following: receiveFlowerUser },
        }),
        User.findByIdAndUpdate(receiveFlowerUser, {
          $push: { followers: sendfollowUser },
        }),
      ]);
      successResponse(res, {
        statusCode: 200,
        message: "followed successfully",
      });
    }
  } catch (error) {
    next(error);
  }
};
