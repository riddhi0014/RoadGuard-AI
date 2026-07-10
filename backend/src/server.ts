
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import testRoutes from "./routes/testRoutes";
import complaintRoutes from "./routes/complaintRoutes";
import userRoutes from "./routes/userRoutes";


const app = express();

app.use(cors());
app.use(express.json());

// Simple health-check route so you can confirm the server is running
// before wiring up any real endpoints.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "RoadGuard AI backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
