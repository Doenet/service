import mongoose from 'mongoose';

// REDIS_HOST=localhost
// REDIS_PORT=27017
// REDIS_PASS=thepassword

const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_pass = process.env.MONGODB_PASS;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_port = process.env.MONGODB_PORT;

let mongoDB = 'mongodb://';

if (mongodb_user) {
  mongoDB += mongodb_user;
  if (mongodb_pass) {
    mongoDB = `${mongoDB}:${mongodb_pass}`;
  }
  mongoDB += '@';
}

if (mongodb_host) {
  mongoDB += mongodb_host;
} else {
  mongoDB += 'localhost';
}

if (mongodb_port) {
  mongoDB = `${mongoDB}:${mongodb_port}`;
}

if (mongodb_database) {
  mongoDB = `${mongoDB}/${mongodb_database}`;
}

mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;

export default mongoose;
