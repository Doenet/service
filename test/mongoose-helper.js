import mongoose from 'mongoose';

// on nixos, remember to run: patchelf --set-interpreter /nix/store/xdsjx0gba4id3yyqxv66bxnm2sqixkjj-glibc-2.27/lib64/ld-linux-x86-64.so.2  /home/jim/doenet/lrs/node_modules/.cache/mongodb-memory-server/mongodb-binaries/4.0.3/mongod
import { MongoMemoryServer } from 'mongodb-memory-server';

const opts = {useFindAndModify: false, useCreateIndex: true, useNewUrlParser: true};
let mongoServer;

export function before(done) {
  mongoServer = new MongoMemoryServer( { debug: true } );
  mongoServer
    .getConnectionString()
    .then((mongoUri) => {
      mongoose.connect(mongoUri, opts, (err) => {
        if (err) done(err);
      });
    })
    .then(() => done());
}

export function after(done) {
  mongoose.disconnect();
  mongoServer.stop();
  done();
}

