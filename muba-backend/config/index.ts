import dotenv from 'dotenv';
dotenv.config();

export const appConfig = {
    port: process.env.PORT,
    admin: process.env.ADMIN_EMAIL
}

export const dbConfig = {
    uri: process.env.DB_URI,
    name: process.env.DB_NAME
}

export const emailConfig = {
    email: process.env.ADMIN_EMAIL,
    pass: process.env.PASSWORD
}

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not set in environment variables.");
}

export const tokenConfig = {
    refresh: process.env.JWT_REFRESH_SECRET,
    access: process.env.JWT_ACCESS_SECRET
}

export const paystackConfig = {
    init_url: process.env.PAYSTACK_INIT_URL,
    verify_url: process.env.PAYSTACK_VERIFY_URL,
    secret_key: process.env.PAYSTACK_SECRET_KEY,
    public_key: process.env.PAYSTACK_PUBLIC_KEY
}