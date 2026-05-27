import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

const ChatMember = sequelize.define("ChatMember", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});
export default ChatMember;