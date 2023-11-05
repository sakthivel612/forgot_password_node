const express = require("express");
const app = express();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const port = 4000; // Set your desired port number

// Middleware to parse JSON request bodies
app.use(express.json());

// Define a simple route
app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

// Import necessary modules
const router = express.Router();

// Route for initiating the password reset process
app.post("/forgot-password", (req, res) => {
  // Implement the logic for generating a reset token and sending the email
  // ...
  res.status(200).json({ message: "Password reset email sent" });
});

module.exports = router;

const mongoose = require("mongoose");
const dbUrl = "mongodb://127.0.0.1:27017/forgot_password_db";

mongoose.connect(dbUrl, { useUnifiedTopology: true });
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

const User = require("./model/schema");

async function saveUser() {
  const newUser = new User({
    email: "sakthi@example.com",
    password: "Sakthi@12345",
  });

  try {
    const user = await newUser.save();
    console.log("User saved:", user);
  } catch (error) {
    console.error(error);
  }
}

saveUser();

// Route for checking if a user exists
app.post("/check-user", async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // User with the given email exists
      res.status(200).json({ message: "User exists" });
    } else {
      // User with the given email does not exist
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for generating a reset token and sending an email
app.post("/generate-reset-token", async (req, res) => {
  const { email } = req.body;

  try {
    // Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Find the user by email and update the reset token and expiration
    const user = await User.findOneAndUpdate(
      { email },
      {
        resetToken,
        resetTokenExpiry: Date.now() + 3600000, // 1 hour expiration
      }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send an email with the reset token
    const transporter = nodemailer.createTransport({
      service: "YourEmailService", // e.g., 'Gmail'
      auth: {
        user: "your_email@gmail.com",
        pass: "your_email_password",
      },
    });

    const mailOptions = {
      from: "your_email@gmail.com",
      to: email,
      subject: "Password Reset",
      text: `Click the following link to reset your password: http://yourwebsite.com/reset-password/${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: "Email not sent" });
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).json({ message: "Email sent with reset instructions" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for handling the reset password link
app.get("/reset-password/:token", async (req, res) => {
  const resetToken = req.params.token;

  try {
    // Find the user by the reset token and check if it's not expired
    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Send a success response
    res.status(200).json({ message: "Reset token is valid" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add this route to your Express app
app.post("/reset-password", async (req, res) => {
  const { password, resetToken } = req.body;

  try {
    // Find the user by the reset token and check if it's not expired
    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Validate the new password (add your validation logic here)
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // Update the user's password in the database
    const hashedPassword = await hashPassword(password); // Hash the password securely
    user.password = hashedPassword;

    // Clear the reset token and reset token expiry
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
