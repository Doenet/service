import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import router from './routes';

const app = express();

app.set('secretKey','notvertysecret');

app.use(logger('dev'));

// enable all CORS requests
app.options('*', cors());
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// cookies actually aren't used in light of CORS, but we do use them
// in the tests
app.use(cookieParser()); 

app.use( '/', router );

export default app;
