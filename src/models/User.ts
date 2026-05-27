import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

 const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}   ,

{
    timestamps: false
    
});
export default User;