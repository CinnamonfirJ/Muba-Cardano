import { Request, Response } from "express";
import Users from "../../models/users.model";
import RequestVendor from "../../models/requestVendor.model";
import fs from "node:fs";
import path from "node:path";
import { SendEmailTypes } from "../../dto/email.dto";
import { SendEmail } from "../../utils/sendEmail.utils";
import Payments from "../../models/payment.models";
import Stores from "../../models/stores.model";

// Get all vendor applications (simplified approach like GetVendors)
export const GetAllVendorApplications = async (req: Request, res: Response) => {
  try {
    console.log("Fetching all vendor applications...");

    // Get all vendor applications from RequestVendor collection
    const applications = await RequestVendor.find({})
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${applications.length} vendor applications`);

    // Add the current status from Users table to each application
    const applicationsWithStatus = await Promise.all(
      applications.map(async (app: any) => {
        const user: any = await Users.findOne({ email: app.email })
          .select("vendorStatus")
          .lean();
        return {
          ...app,
          status: user?.vendorStatus || "pending",
        };
      })
    );

    return res.status(200).json({
      message: "Request Successful",
      data: applicationsWithStatus,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};

// Get pending vendor applications specifically (for overview section)
export const GetPendingVendorApplications = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("Fetching pending vendor applications...");

    // Get users with pending status (exclude admins)
    const pendingUsers = await Users.find({
      vendorStatus: "pending",
      role: { $ne: "admin" },
    })
      .select("email")
      .lean();
    const pendingEmails = pendingUsers.map((user: any) => user.email);

    // Get applications for pending users
    const pendingApplications = await RequestVendor.find({
      email: { $in: pendingEmails },
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log(
      `Found ${pendingApplications.length} pending vendor applications`
    );

    // Add status to each application
    const applicationsWithStatus = pendingApplications.map((app: any) => ({
      ...app,
      status: "pending",
    }));

    return res.status(200).json({
      message: "Request Successful",
      data: applicationsWithStatus,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};

// Get single vendor application by ID
export const GetVendorApplication = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    console.log("Fetching vendor application with ID:", _id);

    const application = await RequestVendor.findById(_id).lean();

    if (!application) {
      return res.status(404).json({
        message: "Vendor application not found",
      });
    }

    // Get current status from Users table
    const user: any = await Users.findOne({ email: (application as any).email })
      .select("vendorStatus")
      .lean();
    const applicationWithStatus = {
      ...application,
      status: user?.vendorStatus || "pending",
    };

    return res.status(200).json({
      message: "Request Successful",
      data: applicationWithStatus,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};

// Approve vendor application (updated version of your ValidateVendor)
export const ApproveVendorApplication = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    console.log("Approving vendor application with ID:", _id);

    // Find the vendor application
    const application = await RequestVendor.findById(_id).lean();
    if (!application) {
      return res.status(404).json({
        message: "Vendor application not found",
      });
    }

    const applicationData = application as any;
    const {
      firstname,
      email,
      address,
      matric_number,
      department,
      faculty,
      valid_id,
      picture,
      cac,
    } = applicationData;

    // Find and update the user
    const user: any = await Users.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({
        message: "User not registered in the database",
      });
    }

    // Check if already approved
    if (user.vendorStatus === "accepted") {
      return res.status(400).json({
        message: "Vendor application already approved",
      });
    }

    // Update user to vendor
    const updatedUser = await Users.findOneAndUpdate(
      { email },
      {
        address,
        matric_number,
        department,
        faculty,
        valid_id,
        picture,
        cac,
        vendorStatus: "accepted",
        role: "vendor",
      },
      { new: true, runValidators: true }
    );

    console.log("User updated to vendor:", (updatedUser as any)?.email);

    // Send approval email
    try {
      const template = fs.readFileSync(
        path.join(__dirname, "../../emailTemplates/kyc.email.html"),
        "utf-8"
      );
      const msg = template.replace("{{user_name}}", firstname);
      const emailData: SendEmailTypes = {
        email,
        title: `Vendor Application Approved - Welcome to MUBAXPRESS!`,
        html: msg,
      };
      await SendEmail(emailData);
      console.log("Approval email sent to:", email);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't fail the approval if email fails
    }

    return res.status(200).json({
      message: "Vendor application approved successfully",
      data: {
        applicationId: _id,
        email,
        status: "approved",
      },
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};

// Reject vendor application
export const RejectVendorApplication = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { rejectionReason } = req.body;
    console.log("Rejecting vendor application with ID:", _id);

    // Find the vendor application
    const application = await RequestVendor.findById(_id).lean();
    if (!application) {
      return res.status(404).json({
        message: "Vendor application not found",
      });
    }

    const applicationData = application as any;
    const { firstname, email } = applicationData;

    // Find and update the user
    const user: any = await Users.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({
        message: "User not registered in the database",
      });
    }

    // Update user vendor status to rejected
    await Users.findOneAndUpdate(
      { email },
      {
        vendorStatus: "rejected",
      },
      { new: true, runValidators: true }
    );

    console.log("User vendor status updated to rejected:", email);

    // Send rejection email
    try {
      let emailContent = `
        <h2>Vendor Application Update</h2>
        <p>Hello ${firstname},</p>
        <p>Unfortunately, your vendor application has not been approved at this time.</p>
        <p><strong>Reason:</strong> ${
          rejectionReason || "Application did not meet requirements"
        }</p>
        <p>You can submit a new application after addressing the issues mentioned above.</p>
        <p>Best regards,<br>The MUBAXPRESS Team</p>
      `;

      const emailData: SendEmailTypes = {
        email,
        title: `Vendor Application Update - MUBAXPRESS`,
        html: emailContent,
      };
      await SendEmail(emailData);
      console.log("Rejection email sent to:", email);
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
      // Don't fail the rejection if email fails
    }

    return res.status(200).json({
      message: "Vendor application rejected successfully",
      data: {
        applicationId: _id,
        email,
        status: "rejected",
        rejectionReason:
          rejectionReason || "Application did not meet requirements",
      },
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};

// Get admin dashboard statistics
export const GetAdminStats = async (req: Request, res: Response) => {
  try {
    console.log("Fetching admin dashboard statistics...");

    // Get user statistics (exclude admins from all counts)
    const totalUsers = await Users.countDocuments({ role: { $ne: "admin" } });

    const totalVendors = await Users.countDocuments({
      role: "vendor",
      //   role: { $ne: "admin" },
    });

    const pendingVendorApplications = await Users.countDocuments({
      vendorStatus: "pending",
      role: { $ne: "admin" },
    });

    const acceptedVendors = await Users.countDocuments({
      vendorStatus: "accepted",
      role: { $ne: "admin" },
    });

    const rejectedApplications = await Users.countDocuments({
      vendorStatus: "rejected",
      role: { $ne: "admin" },
    });

    // Payment stats
    const totalPayments = await Payments.countDocuments();

    // Stores stats
    const totalStores = await Stores.countDocuments();

    const totalRevenueAgg = await Payments.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue =
      totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    const monthlyPayments = await Payments.aggregate([
      { $match: { status: "paid" } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formattedMonthly = monthlyPayments.map((item) => ({
      month: `${months[item._id.month - 1]} ${item._id.year}`,
      totalAmount: item.totalAmount,
      count: item.count,
    }));

    console.log("Stats calculated:", {
      totalUsers,
      totalVendors,
      pendingVendorApplications,
      acceptedVendors,
      rejectedApplications,
    });

    // TODO: Replace these with actual data from your models when available
    // const totalStores = 0;
    const totalProducts = 0;
    const totalOrders = 0;
    const reportedItems = 0;

    const stats = {
      totalUsers,
      totalVendors,
      totalStores,
      totalProducts,
      totalOrders,
      totalRevenue,
      totalPayments,
      monthlyRevenue: formattedMonthly,
      pendingVendorApplications,
      reportedItems,
    };

    return res.status(200).json({
      message: "Request Successful",
      data: stats,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};

// Get users with optional role filter (following your pattern)
export const GetUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    console.log("Fetching users with role filter:", role);

    let filter: any = { role: { $ne: "admin" } }; // Always exclude admins
    if (role && ["user", "vendor"].includes(role as string)) {
      filter.role = role; // This will override the $ne filter for specific roles
    }

    const users = await Users.find(filter)
      .select("-password -refresh_token")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${users.length} users`);

    return res.status(200).json({
      message: "Request Successful",
      data: users,
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};

// Ban/Unban user
export const ToggleUserBan = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const { banned } = req.body;
    console.log("Toggling user ban for ID:", _id, "banned:", banned);

    const user: any = await Users.findById(_id).lean();
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent banning admin users
    if (user.role === "admin") {
      return res.status(400).json({
        message: "Cannot ban admin users",
      });
    }

    await Users.findByIdAndUpdate(
      _id,
      {
        isBanned: banned,
        bannedAt: banned ? new Date() : null,
      },
      { new: true }
    );

    console.log(
      `User ${banned ? "banned" : "unbanned"} successfully:`,
      user.email
    );

    return res.status(200).json({
      message: `User ${banned ? "banned" : "unbanned"} successfully`,
      data: {
        userId: _id,
        banned,
      },
    });
  } catch (err) {
    console.error(`Internal Server Error: ${err}`);
    return res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};
