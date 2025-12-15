import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface OrderQRProps {
  orderId: string;
  sellerId?: string;
  deliveryType?: string;
  action: "handoff" | "pickup";
  size?: number;
  className?: string;
}

const OrderQR: React.FC<OrderQRProps> = ({
  orderId,
  sellerId,
  deliveryType = "post_office", // Default to post_office as that's the main use case
  action,
  size = 200,
  className,
}) => {
  const qrData = JSON.stringify({
    order_id: orderId,
    seller_id: sellerId,
    delivery_type: deliveryType,
    action,
  });

  return (
    <div className={`flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="mb-4 bg-white p-2 rounded-lg">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="H" // High error correction
          includeMargin={true}
        />
      </div>
      <div className="text-center space-y-1">
        <p className="font-bold text-gray-900 uppercase tracking-wide">
          {action === "handoff" ? "📦 Vendor Handoff" : "📬 Customer Pickup"}
        </p>
        <p className="text-xs text-gray-500 font-mono">
          {orderId}
        </p>
        <p className="text-[10px] text-gray-400">
          Scan at Campus Post Office
        </p>
      </div>
    </div>
  );
};

export default OrderQR;
