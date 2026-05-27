import User from "./User";
import Chat from "./Chat";
import ChatMember from "./ChatMember";

User.hasMany(ChatMember , {
    foreignKey: "user_id"
})
ChatMember.belongsTo(User, {
    foreignKey: "user_id"
})

Chat.hasMany(ChatMember , {
    foreignKey: "chat_id"
})
ChatMember.belongsTo(Chat, {
    foreignKey: "chat_id"
})

export { User, Chat, ChatMember }
