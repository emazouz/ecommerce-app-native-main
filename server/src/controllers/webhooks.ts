import { verifyWebhook } from "@clerk/express/webhooks";
import { Request, Response } from "express";
import User from "../models/user.js";
import { sendSuccess, sendError } from "../helpers/response.js";

export const clerkWebhook = async (req: Request, res: Response) => {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const userData = {
        clerkId: evt.data.id,
        name: `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`.trim() || "User",
        email: evt.data.email_addresses[0].email_address,
        image: evt.data.image_url,
      };

      // Upsert — create if not found, update if exists (single query, atomic)
      await User.findOneAndUpdate({ clerkId: evt.data.id }, userData, {
        upsert: true,
        new: true,
      });
    }

    return sendSuccess(res, 200, "Webhook received", evt.data);
  } catch (err: any) {
    console.error("Error verifying webhook:", err.message);
    return sendError(res, 400, "Error verifying webhook");
  }
};
