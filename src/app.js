import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes';

import logger from './logger';

const app = express();

app.set('secretKey', process.env.SECRET);

if (process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:4000',
  'https://api.doenet.cloud',
  'https://doenet.cloud'];

const myCors = cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, new Error('Access not permitted from the given Origin'),
        false);
    }

    return callback(null, true);
  },
});

// preflight for all routes
app.options('*', myCors);
app.use(myCors);

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ strict: false }));

// cookies actually aren't used in light of CORS, but we do use them
// in the tests.  Indeed, "Response to preflight request doesn't pass
// access control check: The value of the
// 'Access-Control-Allow-Origin' header in the response must not be
// the wildcard '*' when the request's credentials mode is 'include'."
app.use(cookieParser());

app.use('/', router);

export default app;
