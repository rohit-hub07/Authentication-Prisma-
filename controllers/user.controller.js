import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client/extension";

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
        date: {
          name,
          email,
          hashedPassword,
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
        ${process.env.BASE_URL}/api/v1/users/verify/${token}
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
    const isMatched = bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(400).json({
        message: "Invalid email or password",
        success: false,
      });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, "secret", {
      expiresIn: "24h",
    });
    const cookieOptions = {
      httpOnly: true,
    };
    res.cookie("token", token, cookieOptions);
    return res.status(201).json({
      message: "User registered!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      success: true,
    })
  } catch (err) {
    return res.status(400).json({
      message: "Login failed",
      success: false,
      err,
    });
  }
};

export { registerController };
