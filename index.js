import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import productRoute from "./routes/productRoute.js";
import stripeRoute from "./routes/stripeRoute.js";
import subscriberRoute from "./routes/subscriberRoute.js";
import { authRouter } from "./controllers/authController.js";
import { config } from "dotenv";

config(); // Load environment variables

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (Updated: Removed deprecated options)
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Database is connected"))
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit if DB connection fails
    });

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Make Cloudinary accessible in request objects
app.use((req, res, next) => {
    req.cloudinary = cloudinary;
    next();
});

// Multer + Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "images",
        allowed_formats: ["jpeg", "png", "jpg"],
    },
});
const parser = multer({ storage });

// Upload Route (Handles Image Uploads)
app.post("/upload-image", parser.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
    }

    try {
        res.json({ secure_url: req.file.path });
    } catch (error) {
        console.error("Error during file upload: ", error);
        res.status(500).send("Internal server error");
    }
});
 
// API Routes
app.use("/product", productRoute);
app.use("/stripe", stripeRoute);
app.use("/subscriber", subscriberRoute);
app.use("/auth", authRouter);

// Start the Server  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
