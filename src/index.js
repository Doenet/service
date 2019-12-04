#!/usr/bin/env node

import app from './app';
import mongoose from './config/mongoose';
import client from './config/redis';

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.listen(process.env.PORT, () => {
  console.log(`Node server listening on port ${process.env.PORT}`);
});
