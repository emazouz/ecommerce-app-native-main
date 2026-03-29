import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhook } from "./controllers/webhooks.js";
import productRouter from "./routes/product-routes.js";
import cartRouter from "./routes/cart-routes.js";
import orderRouter from "./routes/order-routes.js";
import addressRouter from "./routes/address-routes.js";
import adminRouter from "./routes/admin-routes.js";
import { sendSuccess } from "./helpers/response.js";

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());

// ⚠️ Webhook route MUST be registered BEFORE express.json()
// express.raw() needs the raw Buffer body for Clerk signature verification.
app.post("/api/clerk", express.raw({ type: "application/json" }), clerkWebhook);

// JSON parser for all other routes (after webhook route)
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.get("/", (_req: Request, res: Response) => {
  sendSuccess(res, 200, "Server is Live!");
});

app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/addresses", addressRouter);
app.use("/api/admin", adminRouter);

// Only start the listener in local dev — Vercel manages its own listener
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

// Export for Vercel serverless
export default app;
