import { customAlphabet } from "nanoid";

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generator = customAlphabet(alphabet, 4);

export const orderId = () => {
    const first_id = `${generator()}`;
    const second_id = `${generator()}`;
    return `ORD-${first_id}-${second_id}-MBE`
}