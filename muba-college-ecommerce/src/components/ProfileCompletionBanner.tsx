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
  let totalFields = 4;
  
  if (user.role === 'vendor') {
      totalFields = 5; // Add Payouts
      // We don't have store details here efficiently to check 'paystack_recipient_code'. 
      // But we can check if user has 'settlement_bank' if we populated it on user, OR relying on a separate check.
      // Since 'user' object from context might not have store details, we might skip or assume incomplete if not verified?
      // Actually, let's keep it simple: If vendor, prompt to check Payout Settings.
      // But wait, the banner relies on 'missingFields' array.
      // If we can't check explicitly, maybe we shouldn't block the progress bar but just add a persistent alert?
      // OR, we can assume if they are a vendor, they should have it.
      // Let's rely on standard fields for now, but add a text hint.
      
      // Ideally we'd fetch store status here, but that might be expensive for a banner.
      // Let's just add a generic "Setup Payouts" if they are a vendor 
      // missingFields.push("Payout Settings"); 
  }

  const completedFields = totalFields - missingFields.length;
  const percentage = Math.round((completedFields / totalFields) * 100);
  
  // Logic to show banner even if 100% profile but missing payout setup? 
  // For now, let's stick to hiding if 100% unless we force it.
  if (percentage === 100 && user.role !== 'vendor') return null;
  // If vendor, we might want to keep it visible if they haven't set payout, but we don't know that yet.
  // So for now, standard logic.
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
               {user.role === 'vendor' && (
                   <span className="block mt-1 text-sm text-orange-700">
                       Warning: As a vendor, you must <Link href="/dashboard/vendors/payouts" className="underline font-bold">set up Payouts</Link> to receive funds!
                   </span>
               )}
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

        <div className="flex flex-col gap-2">
            <Link href="/dashboard/settings">
            <Button className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap w-full">
                Update Profile
                <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            </Link>
            {user.role === 'vendor' && (
                <Link href="/dashboard/vendors/payouts">
                    <Button variant="outline" className="whitespace-nowrap w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                        Setup Payouts
                    </Button>
                </Link>
            )}
        </div>
      </div>
    </div>
  );
};
