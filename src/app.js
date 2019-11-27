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
// in the tests.  Indeed, "Response to preflight request doesn't pass
// access control check: The value of the
// 'Access-Control-Allow-Origin' header in the response must not be
// the wildcard '*' when the request's credentials mode is 'include'."
app.use(cookieParser()); 

app.use( '/', router );

export default app;
