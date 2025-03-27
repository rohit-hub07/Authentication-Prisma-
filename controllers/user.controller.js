import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const registerController = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: "All fields aree required",
        success: false,
      });
    }
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return res.status(400).json({
          message: "USer already exists",
          success: false,
        });
      }

      //hash the pass
      const hashedPassword = await bcrypt.hash(password, 10);

      const verificationToken = crypto.randomBytes(32).toString("hex");

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          verificationToken,
        },
      });

      //send mail
      const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        secure: false,
        auth: {
          user: process.env.MAILTRAP_USERNAME,
          pass: process.env.MAILTRAP_PASSWORD,
        },
      });

      const mailOption = {
        from: process.env.SENDEREMAIL,
        to: user.email,
        subject: "Verify your email",
        text: `Please click on the following link: 
        ${process.env.BASE_URL}/users/verify/${verificationToken}
        `,
      };
      await transporter.sendMail(mailOption);

      res.status(201).json({
        message: "User registered successfully",
        success: true,
      });
    } catch (err) {
      res.status(500).json({
        message: "User not registered!",
        success: false,
        err,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "User not registered!",
      success: false,
      err,
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "All fields are required!",
      success: false,
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(400).json({
        message: "User not found!",
        success: false,
      });
    }
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(400).json({
        message: "Invalid email or password",
        success: false,
      });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.SECRET,
      {
        expiresIn: "24h",
      }
    );
    const cookieOptions = {
      httpOnly: true,
    };
    res.cookie("token", token, cookieOptions);
    return res.status(201).json({
      message: "User Loggedin successfully!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      success: true,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Login failed",
      success: false,
      err,
    });
  }
};

const verifyController = async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({
      message: "Token is invalid",
    });
  }
  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }
    const verifiedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    res.status(201).json({
      message: "User is verified!",
      success: true,
    });
  } catch (error) {
    return res.json({
      message: "Verification failed!",
      error,
      success: false,
    });
  }
};

const logoutController = async (req, res) => {
  try {
    const token = req.user;
    if (!token) {
      return res.status(400).json({
        message: "You need you login first!",
        success: false,
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: token.id,
      },
    });
    if (!user) {
      return res.status(400).json({
        message: "Can not find the user!",
        success: false,
      });
    }
    res.cookie("token", " ");
    res.status(201).json({
      message: "User logged out successfully!",
      success: true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(400).json({
      message: "User logout failed!",
      success: false,
      error,
    });
  }
};

const forgetpasswordController = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      message: "Please provide email!",
      success: false,
    });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        message: "User doesn't exist!",
        success: false,
      });
    }
    // user.passwordResetExpiry = Date.now() + 10 * 60 * 1000;
    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetExpiry: new Date(Date.now() + 10 * 60 * 1000),
        passwordResetToken: resetPasswordToken,
      },
    });
    


    //send mail
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.SENDEREMAIL,
      to: user.email,
      subject: "Verify your email",
      text: `Please click on the following link: 
        ${process.env.BASE_URL}/users/resetpassword/${resetPasswordToken}
        `,
    };
    await transporter.sendMail(mailOption);

    res.status(201).json({
      message: "Please check your email!",
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Something went wrong!",
      error,
      success: false,
    });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(401).json({
        message: "All fields are required!",
        success: false,
      });
    }
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date(Date.now()) },
      },
    });
    if (!user) {
      return res.status({
        message: "Invalid token!",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });
    res.status(201).json({
      message: "Password reset successfully!",
      success: true,
    });
  } catch (error) {
    return res.status(201).json({
      message: "Something went wrong!",
      success: false,
      error,
    });
  }
};

const userProfileController = async (req, res) => {
  try {
  const { id } = req.user;
  console.log("inside userProfile ID: ",id)
  const user = await prisma.user.findUnique({
    where: { id }
  });
  if(!user){
    return res.status(400).json({
      message: "Please login first!",
      success: false,
    })
  }
   res.status(201).json({
    user:{
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    success: true,
  })
  } catch (error) {
    return res.status(400).json({
      message: "Something went wrong",
      success: false,
      error,
    })
  }
};

export {
  registerController,
  loginUser,
  verifyController,
  forgetpasswordController,
  resetPasswordController,
  logoutController,
  userProfileController,
};
