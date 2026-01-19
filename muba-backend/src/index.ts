import express from "express";
import type { NextFunction, Request, Response } from "express";
const { urlencoded } = express;
;
import { appConfig } from "../config/index.ts";
import cors from "cors";
import router from "./routes/index.ts";
import cookies from "cookie-parser";
import { dbConn } from "./db/index.ts";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://muba-college-ecommerce.vercel.app",
    ],
    methods: ["POST", "GET", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  })
);

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(urlencoded({ extended: true }));

app.use(cookies());

app.use("/api/v1/", router);



// Add this at the bottom of your Express app setup
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
});

dbConn().then(() => {
  app.listen(appConfig.port, () => {
    console.log(`Server is running on port ${appConfig.port}`);
    
    // Start Engagement Service Worker
    import("./services/engagement.service.ts").then(({ EngagementService }) => {
      EngagementService.startWorker();
    });
  });
});

