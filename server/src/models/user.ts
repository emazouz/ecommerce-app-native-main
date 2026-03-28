// كنستوردو mongoose باش نتعاملو مع MongoDB
import mongoose from "mongoose";

// كنستوردو type ديال IUser (TypeScript) باش نحددو الشكل ديال البيانات
import { IUser } from "../types/index.js";

// هنا كنصايبو schema (القالب ديال user)
const userSchema = new mongoose.Schema<IUser>(
  {
    // الاسم ديال المستخدم
    name: {
      type: String, // خاص يكون نص
      required: true, // ضروري يتعمر (مايمكنش يكون خاوي)
    },

    // الإيميل
    email: {
      type: String, // نص
      required: true, // ضروري
      unique: true, // مايمكنش يكون مكرر فالداتابيز
      trim: true, // كيحيد les espaces (before/after)
    },

    // clerkId (جاي من Clerk auth)
    clerkId: {
      type: String,
      required: true,
      unique: true, // كل user عندو ID خاص
      sparse: true, // كيسمح يكون null لبعض الحالات بلا ما يسبب conflict
    },

    // صورة ديال user (اختيارية)
    image: {
      type: String, // URL ديال الصورة
    },

    // الدور ديال user (user ولا admin)
    role: {
      type: String,
      enum: ["user", "admin"], // غير هاد القيم مسموحين
      default: "user", // القيمة الافتراضية
    },
  },
  {
    timestamps: true,
    // كيضيف:
    // createdAt -> وقت الإنشاء
    // updatedAt -> آخر تحديث
  },
);

// كنصايبو Model من schema
// "User" هو الاسم اللي غادي يتخزن به فالداتابيز (collection)
const User = mongoose.model<IUser>("User", userSchema);

// كنصدروه باش نستعملوه فباقي الملفات
export default User;
