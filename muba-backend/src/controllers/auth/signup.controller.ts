import { Request, Response } from "express";
import { UserTypes } from "../../dto/users.dto";
import User from "../../models/users.model";
import { SendEmail } from "../../utils/sendEmail.utils";
import { SendEmailTypes } from "../../dto/email.dto";
import { appConfig } from "../../../config";
import Jwt from "jsonwebtoken";
import fs from "node:fs";
import path from "node:path";
import { hash } from "../../utils/hash.utils";

export const SignUp = async (
  req: Request<{}, {}, UserTypes>,
  res: Response
) => {
  try {
    const { firstname, lastname, middlename, matric_number, email, password } =
      req.body;

    if (!firstname || !lastname || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill the required fields" });
    }

    const query: any[] = [{ email }];
    if (matric_number) {
      query.push({ matric_number });
    }

    const userExist = await User.findOne({
      $or: query,
    });

    if (userExist) {
      return res.status(401).json({ message: "User Already Exists" });
    }

    const hashedPassword = await hash(password);

    const isAdminEmail = email === appConfig.admin;
    const role = isAdminEmail ? "admin" : "user";

    const UserDetails = await User.create({
      firstname,
      lastname,
      middlename,
      //   matric_number,
      email,
      password: hashedPassword,
      role,
    });

    if (matric_number) {
      UserDetails.matric_number = matric_number;
    }

    const RefreshToken = Jwt.sign({ userId: UserDetails._id }, "bdkjbnkj", {
      expiresIn: "30d",
    });
    UserDetails.refresh_token = RefreshToken;
    await UserDetails.save();

    const userObj = UserDetails.toObject();
    delete userObj.password;

    const template = fs.readFileSync(
      path.join(__dirname, "../../emailTemplates/welcome.email.html"),
      "utf-8"
    );
    const msg = template.replace("{{user_name}}", firstname);

    const emailData: SendEmailTypes = {
      email,
      title: `Welcome to Muba`,
      html: msg,
    };

    await SendEmail(emailData);

    const AccessToken = Jwt.sign({ token: UserDetails._id }, "bdkjbnkj", {
      expiresIn: "15mins",
    });

    //  res.cookie(access_token, AccessToken) // res.cookie
    // res.cookie('refreshToken', RefreshToken, {
    //     sameSite;
    // })

    return res.status(201).json({
      message: "User Has been Created",
      data: userObj,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: `Internal Server Error: ${err}` });
  }
};
