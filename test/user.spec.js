import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../src/app';
import userModel from '../src/models/users';

chai.use(chaiHttp);

const expect = chai.expect;

import * as helper from './mongoose-helper';

before(helper.before);
after(helper.after);

describe("GET /users/fake@fake.com/token", function() {
  before((done) => {
    let user = new userModel({ name: 'Fake Person', email:'fake@fake.com', password: '1234' });
    user.save()
      .then(() => done());
  });

  it("provides a JWT token", function() {
    chai
      .request(app)
      .get("/users/fake@fake.com/token")
      .auth('fake@fake.com', '1234')
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.body.name).to.eql('Fake Person');
      });
  });

  it("fails with the wrong password", function() {
    chai
      .request(app)
      .get("/users/fake@fake.com/token")
      .auth('fake@fake.com', '12345')
      .end(function (err, res) {
        expect(res).to.have.status(401);
      });
  });

  it("fails with mismatched username", function() {
    chai
      .request(app)
      .get("/users/fake@fake.com/token")
      .auth('fake2@fake.com', '1234')
      .end(function (err, res) {
        expect(res).to.have.status(500);
      });
  });

  it("fails with differently mismatched username", function() {
    chai
      .request(app)
      .get("/users/fake2@fake.com/token")
      .auth('fake@fake.com', '1234')
      .end(function (err, res) {
        // because there is no user named fake2
        expect(res).to.have.status(404);
      });
  });
  
});

describe("GET /users/fake@fake.com", function() {
  before((done) => {
    let user = new userModel({ name: 'Faker Person', email:'fake2@fake.com', password: 'abcd' });
    user.save()
      .then(() => done());
  });

  let agent = chai.request.agent(app);
  
  before((done) => {
    agent
      .get("/users/fake2@fake.com/token")
      .auth('fake2@fake.com', 'abcd')
      .end(function (err,res) {
        done();
      });
  });
  
  it("returns the user's name", function() {
    agent
      .get("/users/fake2@fake.com")
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.body.name).to.eql('Faker Person');
      });
  });

  after( () => {
    agent.close();
  });
});
