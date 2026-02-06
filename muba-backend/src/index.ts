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
    methods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "Origin",
      "X-Requested-With",
      "Accept",
    ],
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

    // === START AGENDA & EVENT SYSTEM ===
    import("./queue/agenda.ts").then(async ({ startAgenda }) => {
        // Define jobs first
        const { defineEmailJobs } = await import("./queue/email.queue.ts");
        defineEmailJobs();

        const { defineScheduledJobs, initScheduler } = await import("./queue/scheduler.queue.ts");
        defineScheduledJobs();

        // Register event handlers
        await import("./events/handlers/vendor.handler.ts");

        // Start scheduler
        await startAgenda();
        await initScheduler();
    });
  });
});

