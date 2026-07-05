import mongoose, { Schema, Document } from "mongoose";
import { Role } from "../types/enums";

// One User model handles all 4 roles. Instead of 4 separate collections,
// we keep a single collection with a `role` field, plus a few optional
// fields that only make sense for certain roles (e.g. companyName for
// contractors, department for officers). This keeps auth/login logic
// simple: one User table, one login flow, role decides permissions.
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // optional because Google OAuth users won't have one
  googleId?: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;

  // Officer-specific
  department?: string;
  jurisdictionArea?: string; // e.g. a ward/zone name, used to filter complaints

  // Contractor-specific
  companyName?: string;
  isVerifiedContractor?: boolean;

  isActive: boolean; // admin can deactivate accounts instead of deleting them
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false }, // select:false = never returned by default queries
    googleId: { type: String },

    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      default: Role.CITIZEN,
    },

    phone: { type: String },
    avatarUrl: { type: String },

    department: { type: String },
    jurisdictionArea: { type: String },

    companyName: { type: String },
    isVerifiedContractor: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

export default mongoose.model<IUser>("User", UserSchema);
