import { Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Construction className="w-16 h-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This feature is currently under development and will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
