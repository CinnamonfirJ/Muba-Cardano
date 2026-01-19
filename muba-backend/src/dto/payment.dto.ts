import pkg from "mongoose";
const { Types, Schema } = pkg;

export interface PaymentType {
    _id: string;
    // userId: Types.ObjectId;
    userId: Schema.Types.ObjectId;
    reference: string;
    email: string;
    amount: number;
    status: string;
    paid_at?: Date;
    receipt_number: string
    message: string
    channel: string
    currency: string
    transaction_date: Date
    // raw: any;
}

