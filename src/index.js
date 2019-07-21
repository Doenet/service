import app from './app';
import mongoose from './config/database';

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.listen(4000, () => {
  console.log('Node server listening on port 4000');
});

