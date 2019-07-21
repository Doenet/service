import mongoose from 'mongoose';

const mongoDB = 'mongodb://localhost/lrs';

mongoose.set('useFindAndModify', false);
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;

export default mongoose;
