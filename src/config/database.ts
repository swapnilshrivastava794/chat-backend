import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import "../models"
import sequelize from "./sequelize";



export const connectionDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");
        await sequelize.sync()
        console.log("Database synced successfully.");

    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
}




export default sequelize