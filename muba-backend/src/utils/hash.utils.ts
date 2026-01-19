import bcryptPkg from "bcrypt";
const bcrypt = bcryptPkg;

export const hash = async (item: string) => {
    const rounds = 10;
    const salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash(item, salt);
}

export const compare = async (item: string, hashedItem: string) => {
    return await bcrypt.compare(item, hashedItem);
}

