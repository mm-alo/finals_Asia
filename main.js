import express from 'express'; //server
import bodyParser from 'body-parser'; //Middleware - parsing


const app = express()
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.listen(port,()=>{
    console.log('Running on port ' + port)
    console.log('Server is running on http://localhost:3000')
}) //localserver




