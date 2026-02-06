import type { Request, Response, NextFunction } from "express";
import AdminAuditLog from "../models/adminAuditLog.model.ts";

/**
 * Admin Audit Logger Middleware
 * 
 * Logs all admin API actions with full context for security auditing.
 * Applied to all /api/v1/admin/* routes after auth verification.
 */

// Sensitive fields to redact from logs
const SENSITIVE_FIELDS = ["password", "token", "secret", "refresh_token", "access_token"];

const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== "object") return body;
  
  const sanitized = { ...body };
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  return sanitized;
};

// Extract target entity and ID from request
const extractTarget = (req: Request): { entity: string; id: string | null } => {
  const pathParts = req.path.split("/").filter(Boolean);
  // Pattern: /vendors/:id/approve or /users/:id/ban
  if (pathParts.length >= 2) {
    const entity = pathParts[0]; // "vendors", "users", "post-office"
    const potentialId = pathParts[1];
    // Check if it looks like a MongoDB ObjectId
    if (potentialId && /^[a-f\d]{24}$/i.test(potentialId)) {
      return { entity, id: potentialId };
    }
  }
  return { entity: pathParts[0] || "unknown", id: null };
};

export const AdminAuditLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user;
  const startTime = Date.now();
  const { entity, id } = extractTarget(req);

  // Capture original end to log response status
  const originalEnd = res.end;
  let responseStatus = 200;

  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    responseStatus = res.statusCode;
    
    // Log asynchronously to not block response
    setImmediate(async () => {
      try {
        await AdminAuditLog.create({
          admin_id: user?._id,
          admin_email: user?.email || "unknown",
          action: `${req.method} ${req.originalUrl}`,
          request_body: req.method !== "GET" ? sanitizeBody(req.body) : undefined,
          target_entity: entity,
          target_id: id,
          ip_address: req.ip || req.headers["x-forwarded-for"] as string || "unknown",
          user_agent: req.headers["user-agent"],
          response_status: responseStatus,
        });
      } catch (err) {
        console.error("[ADMIN_AUDIT] Failed to persist audit log:", err);
      }
    });

    return originalEnd.call(this, chunk, encoding, cb);
  } as typeof res.end;

  // Also log to console for immediate visibility
  console.log(`[ADMIN_AUDIT] ${user?.email || "unknown"} -> ${req.method} ${req.originalUrl}`);

  next();
};

export default AdminAuditLogger;
