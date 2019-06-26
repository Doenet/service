import mongoose from 'mongoose';

// on nixos, remember to run: patchelf --set-interpreter /nix/store/xdsjx0gba4id3yyqxv66bxnm2sqixkjj-glibc-2.27/lib64/ld-linux-x86-64.so.2  /home/jim/doenet/lrs/node_modules/.cache/mongodb-memory-server/mongodb-binaries/4.0.3/mongod
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
const opts = {useFindAndModify: false, useCreateIndex: true, useNewUrlParser: true};

export function before(done) {
  mongoServer = new MongoMemoryServer();
  mongoServer
    .getConnectionString()
    .then((mongoUri) => {
      return mongoose.connect(mongoUri, opts, (err) => {
        if (err) done(err);
      });
    })
    .then(() => done());
}

export function after() {
  mongoose.disconnect();
  mongoServer.stop();
}
