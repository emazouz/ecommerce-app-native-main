import { clerkClient } from "@clerk/express";
import User from "../models/user.js";

export const makeAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    if (!email) {
      console.log("Please provide an email");
      return;
    }

    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
    );

    if (user) {
      await clerkClient.users.updateUser(user.clerkId, {
        publicMetadata: {
          role: "admin",
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
};

makeAdmin();
