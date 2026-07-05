import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import testRoutes from "./routes/testRoutes";

dotenv.config();

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

const PORT = process.env.PORT || 6000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
