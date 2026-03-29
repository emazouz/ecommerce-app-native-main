// كنستوردو verifyWebhook باش نأكدو أن الطلب جاي من Clerk بصح
import { verifyWebhook } from "@clerk/express/webhooks";

// Types ديال Express
import { Request, Response } from "express";

// Model ديال User من MongoDB
import User from "../models/user.js";

// هادي function اللي غادي تستقبل webhook
export const clerkWebhook = async (req: Request, res: Response) => {
  try {
    // كنحققو من webhook (security)
    const evt = await verifyWebhook(req);

    // كنشيكو واش الحدث هو user created ولا updated
    if (evt.type === "user.created" || evt.type === "user.updated") {
      // كنقلبو واش user كاين فالداتابيز باستعمال clerkId
      const user = await User.findOne({ clerkId: evt.data.id });

      // كنحضرو البيانات اللي غادي نخزنو
      const userData = {
        clerkId: evt.data.id, // ID ديال Clerk
        name: evt.data.first_name + " " + evt.data.last_name, // الاسم الكامل
        email: evt.data.email_addresses[0].email_address, // أول email
        image: evt.data.image_url, // صورة user
      };

      // إلا كان user موجود → update
      if (user) {
        await User.findByIdAndUpdate({ clerkId: evt.data.id }, userData);
      }
      // إلا ما كانش → create
      else {
        await User.create(userData);
      }
    }

    // نرجعو response ناجح
    return res.json({
      success: true,
      message: "Webhook received",
      data: evt.data,
    });
  } catch (err: any) {
    // إلا وقع خطأ فـ verification
    console.error("Error verifying webhook:", err.message);

    return res
      .status(400)
      .json({ success: false, message: "Error verifying webhook", data: null });
  }
};
