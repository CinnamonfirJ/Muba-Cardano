import bcrypt from "bcrypt";

export const hash = async (item: string) => {
    const rounds = 10;
    const salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash(item, salt);
}