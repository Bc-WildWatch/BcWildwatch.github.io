import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./src/config/db.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import AnimalType from "./src/models/AnimalType.js";

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// Serve node_modules for Speed Insights
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));

// ── Public config consumed by the frontend (no secrets) ──
app.get("/api/config", (_req, res) => {
  res.json({
    azureClientId: process.env.AZURE_CLIENT_ID || "",
    azureTenantId: process.env.AZURE_TENANT_ID || ""
  });
});

// ── Animal types: pull from DB or fall back to defaults ──
const DEFAULT_ANIMALS = [
  { name: "Snake",           emoji: "🐍" },
  { name: "Bee Swarm",       emoji: "🐝" },
  { name: "Stray Dog",       emoji: "🐕" },
  { name: "Cockroach",       emoji: "🪳" },
  { name: "Other",           emoji: "⚠" }
];

app.get("/api/animals", async (_req, res) => {
  try {
    const docs = await AnimalType.find({}, "name emoji").lean();
    const animals = docs.length > 0 ? docs : DEFAULT_ANIMALS;
    res.json(animals);
  } catch {
    res.json(DEFAULT_ANIMALS);
  }
});

// ── Routes ──
app.use("/api/auth",    authRoutes);
app.use("/api/reports", reportRoutes);

// ── Page routes ──
app.get("/login", (_req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html")));

app.get("/index.html", (_req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html")));

// Dashboard (default)
app.get("/", (_req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html")));

// ── 404 handlers ──
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "login.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}.\nhttp://localhost:${PORT}`));
