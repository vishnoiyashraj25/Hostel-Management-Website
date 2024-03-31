bcrypt = require("bcrypt");

const OtpVerification = require("../models/OtpVerification.js");
const User = require("../models/usermodel.js");
const generateWebToken = require("../utils/generateToken.js");
const {
  sendSignupEmailNotification,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("./Nodemailer.js");
const forgotpassword = async (req, res) => {
    const { email } = req.body;
    console.log(email);
    const user = await User.findOne({ email });
    
    if (user) {
        // Generate the password reset token
        const fptoken = jwt.sign({ email }, secretKey, { expiresIn: '5m' });

        // Send the password reset email
        try {
            await sendPasswordResetEmail(email, fptoken);
            return res.status(200).json({ message: "Password reset email sent successfully." });
        } catch (error) {
            console.error("Error sending password reset email:", error);
            return res.status(500).json({ error: "Failed to send password reset email." });
        }
    } else {
        return res.status(404).json({ error: "User with the provided email not found." });
    }
};
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
}
const emailVerification = async (req, res) => {
  const { full_name, email } = req.body;
  let roll_no = email.split("@")[0];
  let domain = email.split("@")[1];
  console.log(roll_no);

  // Check if it's your college domain id
  if (domain === "nitkkr.ac.in") {
    try {
      const existingUser = await User.findOne({ roll_no });
      const existingEmail = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({ err: "Roll number already exists" });
      }

      if (existingEmail) {
        console.log(roll_no);

        return res.status(409).json({ err: "Email already exists" });
      }

      // Generate OTP with timestamp
      const otp = generateOTP();

      // Send email with OTP
      try {
        await sendVerificationEmail(email, otp);
        console.log("Email sent successfully");
        // Check if OTP exists for the email
        const existingOtp = await OtpVerification.findOne({ email });

        if (existingOtp) {
          // Update existing OTP
          existingOtp.otp = otp;
          await existingOtp.save();
        } else {
          // Create new OTP entry
          const newOtp = new OtpVerification({
            email,
            otp,
            full_name,
          });
          await newOtp.save();
        }

        return res.status(200).json({ msg: "OTP sent successfully" });
      } catch (error) {
        console.log("Error sending email5:", error);
        return res
          .status(500)
          .json({ err: "Failed to send verification email" });
      }
    } catch (error) {
      console.log("Error:", error);
      return res.status(500).json({ err: "Internal server error" });
    }
  } else {
    return res.status(400).json({ err: "Please use your college email id" });
  }
};

const otpcheck = async (req, res) => {
  try {
    let { email, otp } = req.body;
    otp = parseInt(otp.join(""));
    console.log(otp);

    // Find the OTP verification document by email
    const verification = await OtpVerification.findOne({ email });

    if (!verification) {
      return res
        .status(404)
        .json({ err: "OTP verification document not found" });
    }

    // Check if OTP matches
    if (verification.otp === otp) {
      // Update the status to true
      verification.status = true;
      await verification.save();
      return res.status(200).json({ message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ err: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ err: "Internal server error" });
  }
};

const signUp = async (req, res) => {
  console.log("Inside Signup");
  try {
    const { email, password } = req.body;
    const roll_no = email.split("@")[0];
    const verification = await OtpVerification.findOne({ email: email });
    if (!verification) {
      return res.status(404).json({ err: "OTP verification not found" });
    }

    const full_name = verification.full_name;
    console.log("Verification:", verification);

    if (!verification || !verification.status) {
      return res.status(404).json({ err: "Email not verified" });
    }

    const date_of_joining = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const salt = await bcrypt.genSalt(5);
    const hashedPassword = await bcrypt.hash(password, salt);

    const profilePic = `https://avatar.iran.liara.run/public/boy?username=${roll_no}`;

    const newUser = new User({
      full_name,
      roll_no,
      email,
      password: hashedPassword,
      date_of_joining,
      profile_pic: profilePic,
    });

    const user = await newUser.save();
    if (user) {
      sendSignupEmailNotification(user.full_name, user.email);
    }

    return res.status(201).json({
      _id: newUser._id,
      msg: "Signed up successfully",
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ err: "Signup error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    const hostel_no = user.hostel_no;
    const userId = user._id;
    const full_name = user.full_name;
    const super_admin = user.super_admin;
    // console.log(user.hostel_no);

    if (!user) {
      return res.status(404).json({ err: "User does not exist" });
    }

    const hashedPassword = await bcrypt.compare(password, user.password);
    if (!hashedPassword) {
      return res.status(401).json({ err: "Password is Incorrect" });
    }
    console.log("super_admin" + super_admin);
    if (user.super_admin)
      generateWebToken(
        { email, super_admin: true, admin: true, hostel_no, userId, full_name },
        res
      );
    else if (user.admin)
      generateWebToken(
        {
          email,
          super_admin: false,
          admin: true,
          hostel_no,
          userId,
          full_name,
        },
        res
      );
    else
      generateWebToken(
        {
          email,
          admin: false,
          super_admin: false,
          hostel_no,
          userId,
          full_name,
        },
        res
      );
    return res.status(201).json("Successful login");
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ err: "Error in Login" });
  }
};
const logout = async (req, res) => {
  try {
    console.log("logout");
    // Clear the JWT cookie
    res.clearCookie("jwt");

    // Optionally, destroy the session if you're using sessions
    // req.session.destroy();

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { signUp, login, logout, emailVerification, otpcheck,forgotpassword };
