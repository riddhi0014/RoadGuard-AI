import mongoose, { Schema, Document, Types } from "mongoose";
import { ComplaintStatus, DefectType, Severity } from "../types/enums";

// A single detected defect, as returned by the AI service.
interface IDetection {
  defectType: DefectType;
  confidence: number; // 0-1, model's confidence score
  severity: Severity;
  estimatedAreaSqM?: number; // estimated damaged area in square meters
}

// Repair verification result, filled in AFTER the contractor uploads
// "after" photos and the AI service compares before/after.
interface IVerification {
  sameLocationConfirmed?: boolean;
  repairQualityScore?: number; // 0-100
  remainingDamage?: "none" | "minimal" | "moderate" | "significant";
  fraudFlags?: string[]; // e.g. ["reused_image", "missing_gps", "blurry_photo"]
  verifiedAt?: Date;
}

export interface IComplaint extends Document {
  citizen: Types.ObjectId; // ref -> User

  // "Before" evidence submitted by the citizen
  images: string[]; // Cloudinary URLs
  description?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  address?: string; // human-readable, optional reverse-geocoded address

  // AI outputs
  detections: IDetection[];
  priorityScore?: number;
  inspectionReport?: string; // LLM-generated report text
  recommendedRepair?: string; // RAG-grounded recommendation

  // Workflow
  status: ComplaintStatus;
  assignedOfficer?: Types.ObjectId; // ref -> User
  assignedContractor?: Types.ObjectId; // ref -> User

  // "After" evidence submitted by the contractor
  repairEvidence?: {
    images: string[]; // require 3-5 photos, enforced at the route/controller level
    location: {
      type: "Point";
      coordinates: [number, number];
    };
    uploadedAt: Date;
  };

  verification?: IVerification;

  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    citizen: { type: Schema.Types.ObjectId, ref: "User", required: true },

    images: { type: [String], required: true },
    description: { type: String },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    address: { type: String },

    detections: [
      {
        defectType: { type: String, enum: Object.values(DefectType) },
        confidence: { type: Number },
        severity: { type: String, enum: Object.values(Severity) },
        estimatedAreaSqM: { type: Number },
      },
    ],
    priorityScore: { type: Number },
    inspectionReport: { type: String },
    recommendedRepair: { type: String },

    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.PENDING,
    },
    assignedOfficer: { type: Schema.Types.ObjectId, ref: "User" },
    assignedContractor: { type: Schema.Types.ObjectId, ref: "User" },

    repairEvidence: {
      images: { type: [String] },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number] },
      },
      uploadedAt: { type: Date },
    },

    verification: {
      sameLocationConfirmed: { type: Boolean },
      repairQualityScore: { type: Number },
      remainingDamage: {
        type: String,
        enum: ["none", "minimal", "moderate", "significant"],
      },
      fraudFlags: { type: [String] },
      verifiedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// 2dsphere index enables geospatial queries later
// (e.g. "find duplicate complaints near this location").
ComplaintSchema.index({ location: "2dsphere" });

export default mongoose.model<IComplaint>("Complaint", ComplaintSchema);
