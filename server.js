import express from 'express';
import cors from 'cors';
import compression from 'compression';
const app=express();app.use(cors());app.use(compression());app.use(express.static('public'));app.get('/api/ping',(req,res)=>res.json({status:'online'}));app.listen(process.env.PORT||3000);