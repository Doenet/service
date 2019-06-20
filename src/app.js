import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import router from './routes';

const app = express();

app.set('secretKey','notvertysecret');

if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors()); // enable all CORS requests

app.use( '/', router );

export default app;
