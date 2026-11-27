require("dotenv").config();
const express = require("express");
require("./database/database")
const userRouter = require("./routes/user")
const app = express();
const PORT = process.env.PORT

app.use(express.json());
app.use(userRouter)



app.listen(PORT, () => {
    console.log(`Server is listening on PORT: ${PORT}`)
});