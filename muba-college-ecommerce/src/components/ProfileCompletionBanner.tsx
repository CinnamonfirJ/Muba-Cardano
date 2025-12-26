import Link from "next/link";
import { User } from "@/context/AuthContext";
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileCompletionBannerProps {
  user: User | null;
}

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ user }) => {
  if (!user) return null;

  // Fields to check
  const hasName = user.firstname && user.lastname;
  const hasEmail = !!user.email;
  const hasPhone = !!user.phone;
  const hasLocation = !!user.delivery_location;
  // Matric is optional

  const missingFields: string[] = [];
  if (!hasName) missingFields.push("Name");
  if (!hasEmail) missingFields.push("Email");
  if (!hasPhone) missingFields.push("Phone Number");
  if (!hasLocation) missingFields.push("Delivery Location");

  // Calculate percentage (Matric doesn't count against completion but optional)
  const totalFields = 4;
  const completedFields = totalFields - missingFields.length;
  const percentage = Math.round((completedFields / totalFields) * 100);

  if (percentage === 100) return null;

  return (
    <div className="bg-orange-50 mb-6 p-6 border border-orange-200 rounded-lg">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-gray-900 text-lg">
              Complete your profile ({percentage}%)
            </h3>
            <p className="max-w-xl text-gray-600">
              Please update your <strong>{missingFields.join(", ")}</strong> to ensure smooth checkout and delivery.
            </p>
            
            {/* Progress Bar */}
            <div className="bg-gray-200 mt-3 rounded-full w-full max-w-sm h-2">
              <div 
                className="bg-orange-500 rounded-full h-2 transition-all duration-500" 
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        <Link href="/dashboard/settings">
          <Button className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap">
            Update Profile
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
