import { Request, Response } from "express";
import Complaint from "../models/Complaint";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload";
import User from "../models/User";
import { Types } from "mongoose";
import { analyzeComplaintPhoto } from "../services/aiService";

// POST /api/complaints
// Expects multipart/form-data:
//   - images: 1+ image files
//   - latitude, longitude: strings (from the citizen's device GPS)
//   - description: optional string
export const createComplaint = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const { latitude, longitude, description, address } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "GPS location is required" });
    }

    // Upload all images to Cloudinary in parallel
    const imageUrls = await Promise.all(
      files.map((file) =>
        uploadBufferToCloudinary(file.buffer, "roadguard/complaints")
      )
    );

    const complaint = await Complaint.create({
      citizen: req.user?.id,
      images: imageUrls,
      description,
      address,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    analyzeComplaintPhoto((complaint._id as Types.ObjectId).toString(), imageUrls[0]);

    res.status(201).json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create complaint" });
  }
};

// GET /api/complaints/mine  -> citizen views their own complaint history
export const getMyComplaints = async (req: Request, res: Response) => {
  const complaints = await Complaint.find({ citizen: req.user?.id }).sort({
    createdAt: -1,
  });
  res.json(complaints);
};

// GET /api/complaints/:id  -> view a single complaint (citizen, officer, or admin)
export const getComplaintById = async (req: Request, res: Response) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("assignedContractor", "name companyName")
    .populate("assignedOfficer", "name");
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }
  res.json(complaint);
};


// GET /api/complaints  -> officer/admin view of all complaints
// Supports filtering, sorting, and pagination for the dashboard/map views.
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const {
      status,
      severity,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};

    if (status) {
      // supports comma-separated multi-status filtering, e.g. ?status=pending,assigned
      filter.status = status.includes(",") ? { $in: status.split(",") } : status;
    }

    if (severity) {
      // severity lives inside the detections[] array
      filter["detections.severity"] = severity.includes(",")
        ? { $in: severity.split(",") }
        : severity;
    }

    // Whitelist sortable fields to avoid arbitrary/unsafe sort injection
    const allowedSortFields = ["createdAt", "priorityScore", "status"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("assignedContractor", "name")
        .populate("assignedOfficer", "name")
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Complaint.countDocuments(filter),
    ]);

    res.json({
      complaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
};

// PATCH /api/complaints/:id  -> officer/admin updates status and/or assigns
// an officer/contractor. Partial updates only — send just the fields you're changing.
export const updateComplaint = async (req: Request, res: Response) => {
  try {
    const { status, assignedOfficer, assignedContractor } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (status) complaint.status = status;
    if (assignedOfficer) complaint.assignedOfficer = assignedOfficer;
    if (assignedContractor) complaint.assignedContractor = assignedContractor;

    await complaint.save();

    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update complaint" });
  }
};

// GET /api/complaints/analytics -> officer/admin dashboard charts
export const getComplaintAnalytics = async (req: Request, res: Response) => {
  try {
    const days = parseInt((req.query.days as string) || "30", 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const complaints = await Complaint.find({ createdAt: { $gte: since } }).select(
      "status createdAt detections assignedContractor"
    );

    // --- Complaints over time (daily counts, zero-filled for empty days) ---
    const overTimeMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      overTimeMap[d.toISOString().slice(0, 10)] = 0;
    }
    complaints.forEach((c) => {
      const key = c.createdAt.toISOString().slice(0, 10);
      if (key in overTimeMap) overTimeMap[key]++;
    });
    const overTime = Object.entries(overTimeMap).map(([date, count]) => ({ date, count }));

    // --- Status breakdown ---
    const statusCounts: Record<string, number> = {};
    complaints.forEach((c) => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // --- Severity breakdown: worst-of-detections per complaint, matching the
    // same logic the frontend uses (empty detections[] defaults to "low") ---
    const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    const severityCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    complaints.forEach((c) => {
      let worst = "low";
      (c.detections || []).forEach((d: any) => {
        if (severityRank[d.severity] > severityRank[worst]) worst = d.severity;
      });
      severityCounts[worst]++;
    });
    const severityBreakdown = Object.entries(severityCounts).map(([severity, count]) => ({ severity, count }));

    // --- Top contractors by completed jobs (all-time, not limited to `days`) ---
    const completedAgg = await Complaint.aggregate([
      { $match: { status: "completed", assignedContractor: { $ne: null } } },
      { $group: { _id: "$assignedContractor", completedJobs: { $sum: 1 } } },
      { $sort: { completedJobs: -1 } },
      { $limit: 10 },
    ]);
    const contractorIds = completedAgg.map((c) => c._id);
    const contractorUsers = await User.find({ _id: { $in: contractorIds } }).select("name companyName");
    const contractorMap = new Map(contractorUsers.map((u) => [u._id.toString(), u]));
    const contractorPerformance = completedAgg.map((c) => {
      const user = contractorMap.get(c._id.toString());
      return {
        contractorId: c._id,
        name: user?.companyName ?? user?.name ?? "Unknown",
        completedJobs: c.completedJobs,
      };
    });

    res.json({ overTime, statusBreakdown, severityBreakdown, contractorPerformance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

// GET /api/complaints/assigned -> contractor's own assigned complaints
// Must be registered before "/:id" in the routes file, same reason as
// the analytics route - otherwise Express treats "assigned" as an :id.
export const getAssignedComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await Complaint.find({ assignedContractor: req.user?.id }).sort({
      createdAt: -1,
    });
    res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch assigned complaints" });
  }
};

// POST /api/complaints/:id/repair-evidence -> contractor uploads "after" photos
// Expects multipart/form-data: images (3-5 files), latitude, longitude.
// Does NOT change complaint status - the officer reviews the uploaded
// evidence and updates status manually via the existing Assign modal,
// since automated verification (AI service) doesn't exist yet.
export const uploadRepairEvidence = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const { latitude, longitude } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one repair photo is required" });
    }
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "GPS location is required" });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Ownership check: a contractor can only upload evidence for jobs
    // actually assigned to them, not any complaint by ID.
    if (
      !complaint.assignedContractor ||
      complaint.assignedContractor.toString() !== req.user?.id
    ) {
      return res.status(403).json({ message: "This job is not assigned to you" });
    }

    const imageUrls = await Promise.all(
      files.map((file) => uploadBufferToCloudinary(file.buffer, "roadguard/repairs"))
    );

    complaint.repairEvidence = {
      images: imageUrls,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      uploadedAt: new Date(),
    };

    await complaint.save();
    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upload repair evidence" });
  }
};