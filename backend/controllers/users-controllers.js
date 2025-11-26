const { v7: uuid } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { firstName, lastName, mobileNumber, email, password, places } = req.body;

  console.log("Signup received:", { firstName, lastName, mobileNumber, email, password, places });

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name: `${firstName} ${lastName}`,
    mobileNumber,
    email,
    image:
      "https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_incoming&w=740&q=80",
    password,
    places,
  });

  try {
    await createdUser.save();
    console.log("--- USER SIGNED UP ---", createdUser.id);
  } catch (err) {
    console.error("--- SIGNUP FAILED ---", err);

    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  console.log("Login attempt for:", email);

  let existingUser;

  try {
    existingUser = await User.findOne({ email });
    console.log("Found user:", existingUser);
  } catch (err) {
    console.error("--- LOGIN FAILED ---", err.message);
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    console.warn("--- INVALID CREDENTIALS ---");
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  console.log("--- USER LOGGED IN ---", existingUser.name, "with ID:", existingUser.id);

  res.json({
    message: "Logged in!",
    userId: existingUser.toObject({ getters: true })
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
