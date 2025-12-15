import { RequestHandler } from "express";
// import { json } from "stream/consumers";
import { paystackConfig } from "../../../config";
import Payments from "../../models/payment.models";
import { orderId } from "../../utils/genId.utils";

export const InitializePayment: RequestHandler = async (req, res) => {
  const { email, amount, metadata } = req.body;
  // i'll install and use nanoid here to generate orderId that starts with ORD-(6digits code)-MBE
  const order_id = orderId();

  if (!email || !amount) {
    return res.status(400).json({ error: "email and amount are required" });
  }

  try {
    const reqt = await fetch(`${paystackConfig.init_url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackConfig.secret_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount) * 100),
        metadata,
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify`,
      }),
    });
    const resp = await reqt.json();

    console.log(resp);

    const tx = await Payments.create({
      _id: order_id,
      userId: metadata?.userId, // Save userId locally for redundancy
      email,
      amount: Math.round(Number(amount) * 100),
      status: "pending",
      reference: resp.data.reference,
    });

    return res.status(200).json({
      status: true,
      tx,
      authorization_url: resp.data.authorization_url,
    });

    // const tx = new Payment({
    //     reference: res.data.data.reference,
    //     // orderId,
    //     email,
    //     amount: res.data.data.unit_amount ?? Number(amount) * 100,
    //     status: 'pending',
    //     raw: res.data,
    // });
  } catch (err) {
    console.error(`Server Error: ${err}`);
    return res.status(500).json({ message: `Server Error: ${err}` });
  }
};
