export const validateOtp = (otpExpires: Date | undefined) => {
  if (!otpExpires) {
    return {
        isValid: false,
        message: "OTP already sent. Please wait before requesting a new one."
    };
  }

  const now = new Date();
  const remainingMs = otpExpires.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return {
        isValid: false,
        message: "Invalid or Expired OTP",
        remainingMinutes: 0 };
  }

  const remainingMinutes = Math.ceil(remainingMs / 60000);
  return { isValid: true, remainingMinutes };
};