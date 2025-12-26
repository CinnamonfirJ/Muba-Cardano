import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface OrderQRProps {
  // orderId: string;
  refId?: string; // The short human-readable ID
  sellerId?: string;
  deliveryType?: string;
  action: "handoff" | "pickup";
  size?: number;
  className?: string;
  qrCodeValue?: string; // Direct string value for QR override
}

const OrderQR: React.FC<OrderQRProps> = ({
  // orderId,
  refId,
  sellerId,
  deliveryType = "post_office",
  action,
  size = 200,
  className,
  qrCodeValue,
}) => {
  // Use refId for display and in QR data
  const displayId = refId ;
  
  const qrData = qrCodeValue || JSON.stringify({
    orderId: displayId, // Use refId for scanner lookup
    type: action,
    timestamp: Date.now(),
  });

  return (
    <div className={`flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="mb-4 bg-white p-2 rounded-lg">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
      <div className="text-center space-y-1">
        <p className="font-bold text-gray-900 uppercase tracking-wide">
          {action === "handoff" ? "📦 Vendor Handoff" : "📬 Customer Pickup"}
        </p>
        <p className="text-lg font-mono font-bold text-blue-600 select-all">
          {displayId}
        </p>
        <p className="text-[10px] text-gray-400">
          Scan at Campus Post Office
        </p>
      </div>
    </div>
  );
};

export default OrderQR;
