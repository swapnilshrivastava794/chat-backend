import express from 'express'
import cors from 'cors'
import chatRoutes from "./routes/chatRoutes"
import userRoutes from "./routes/userRoutes"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/chat", chatRoutes)
app.use("/api/user", userRoutes)

app.get("/", (req, res) => {
    res.send("Chat App Backend is running")
})

export default app