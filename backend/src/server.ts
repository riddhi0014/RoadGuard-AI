import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Simple health-check route so you can confirm the server is running
// before wiring up any real endpoints.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "RoadGuard AI backend is running" });
  console.log("Health check endpoint hit");
});

const PORT = process.env.PORT || 6000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
