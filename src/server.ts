import app from "./app"
import { connectionDB } from "./config/database"


const PORT = process.env.PORT || 7200


const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

connectionDB().then(() => {
    startServer()
}).catch((err) => {
    console.log(err)
})

startServer()