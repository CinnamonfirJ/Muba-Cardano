import crypto from "crypto"

export const getOtp = () => {
    const otp = crypto.randomInt(100000, 999999).toString(); // e.g. "483920"
    const otpExpire = new Date(Date.now() + 1000 * 60 * 15); // 15 mins

    return { otp, otpExpire };
}