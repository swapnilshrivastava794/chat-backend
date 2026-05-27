import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

 const Chat = sequelize.define("Chat", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});
export default Chat;