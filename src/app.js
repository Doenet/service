import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
const app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors()); // enable all CORS requests

// express doesn't consider not found 404 as an error so we need to
// handle 404 explicitly handle 404 error
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// handle errors
app.use((err, req, res, next) => {
  if (err.status === 404) res.status(404).json({ message: 'Not found' });
  else { res.status(500).json({ message: 'Something looks wrong :( !!!' }); }
});

app.listen(4000, () => {
  console.log('Node server listening on port 4000');
});
