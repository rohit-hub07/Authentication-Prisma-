import express from 'express'
import userRoutes from './routes/user.route.js';
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser';


dotenv.config()


const app = express();


const port = process.env.PORT || 4000;

app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(cookieParser())

app.use(cors({
  origin: process.env.BASE_URL
}))


app.use('/users', userRoutes)

app.listen(port, () => {
  console.log(`App is listening to port: ${port}`)
})