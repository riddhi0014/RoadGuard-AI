import { Request, Response } from "express";
import User from "../models/User";
import Complaint from "../models/Complaint";
import { Role } from "../types/enums";

// GET /api/users/contractors -> officer/admin fetch contractor list with job stats
export const getContractors = async (_req: Request, res: Response) => {
  try {
    const contractors = await User.find({ role: Role.CONTRACTOR }).select(
      "name companyName isVerifiedContractor email phone createdAt"
    );

    // Active/completed counts aren't stored on the User doc - they're derived
    // by counting each contractor's assigned complaints by status.
    const withCounts = await Promise.all(
      contractors.map(async (c) => {
        const [activeJobs, completedJobs] = await Promise.all([
          Complaint.countDocuments({
            assignedContractor: c._id,
            status: { $nin: ["completed", "rejected"] },
          }),
          Complaint.countDocuments({
            assignedContractor: c._id,
            status: "completed",
          }),
        ]);
        return {
          _id: c._id,
          name: c.name,
          companyName: c.companyName,
          isVerifiedContractor: c.isVerifiedContractor,
          email: c.email,
          phone: c.phone,
          createdAt: c.createdAt,
          activeJobs,
          completedJobs,
        };
      })
    );

    res.json(withCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch contractors" });
  }
};


// GET /api/users -> admin's full user list, optionally filtered by role
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query as Record<string, string>;
    const filter: Record<string, any> = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select(
      "name email role companyName isVerifiedContractor isActive createdAt"
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// PATCH /api/users/:id/status -> admin toggles a user's active/inactive state
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;

    // Prevent an admin from locking themselves out by deactivating their
    // own account through this same UI they're currently using.
    if (req.params.id === req.user?.id && isActive === false) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("name email role isActive");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

// PATCH /api/users/:id/verify -> admin verifies a contractor
export const verifyContractor = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== Role.CONTRACTOR) {
      return res.status(400).json({ message: "Only contractors can be verified" });
    }

    user.isVerifiedContractor = true;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to verify contractor" });
  }
};