import mongoose from "mongoose"
import { dbConfig } from "../../config/index.ts"

export const dbConn = async () => {
    try {
        if (!dbConfig.uri || !dbConfig.name) {
            throw new Error("MongoDB URI or DB name is missing in config");
        }

        await mongoose.connect(`${dbConfig.uri}`, {
            dbName: `${dbConfig.name}`
        });
        console.log('database connection successful')
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}