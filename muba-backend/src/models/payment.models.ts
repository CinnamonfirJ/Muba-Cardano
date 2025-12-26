import { model, models, Schema } from "mongoose";
import { PaymentType } from "../dto/payment.dto";

const PaymentSchema = new Schema<PaymentType>(
    {
        _id: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        reference: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "paid", "failed", "abandonded"],
            default: 'pending',
            required: true
        },
        paid_at: {
            type: Date,
            required: false
        },
        // raw: {
        //     type: Schema.Types.Mixed,
        //     required: true
        // }
    },
    { timestamps: true}
)

const Payments = models.Payments || model<PaymentType>("Payments", PaymentSchema);

export default Payments;