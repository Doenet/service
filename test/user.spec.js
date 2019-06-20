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
  before(() => {
    let user = new userModel({ name: 'Fake Person', email:'fake@fake.com', password: '1234' });
    return user.save();
  });

  it("provides a JWT token", function() {
    return chai
      .request(app)
      .get("/users/fake@fake.com/token")
      .auth('fake@fake.com', '1234')
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res).to.have.cookie('token');
        expect(res.body.name).to.eql('Fake Person');
      });
  });

  it("fails with the wrong password", function() {
    return chai
      .request(app)
      .get("/users/fake@fake.com/token")
      .auth('fake@fake.com', '12345')
      .then(function (res) {
        expect(res).to.have.status(401);
      });
  });

  it("fails with mismatched username", function() {
    return chai
      .request(app)
      .get("/users/fake@fake.com/token")
      .auth('fake2@fake.com', '1234')
      .then(function (res) {
        expect(res).to.have.status(500);
      });
  });

  it("fails with differently mismatched username", function() {
    return chai
      .request(app)
      .get("/users/mismatch@fake.com/token")
      .auth('fake@fake.com', '1234')
      .then(function (res) {
        // because there is no user named fake2
        expect(res).to.have.status(404);
      });
  });
  
});

describe("GET /users/fake2@fake.com", function() {
  before(() => {
    let user = new userModel({ name: 'Faker Person',
                               email:'fake2@fake.com',
                               password: 'abcd' });
    return user.save();
  });

  let agent = chai.request.agent(app);
  
  before(() => {
    return agent
      .get("/users/fake2@fake.com/token")
      .auth('fake2@fake.com', 'abcd');
  });
  
  it("returns the user's name", function() {
    return agent
      .get("/users/fake2@fake.com")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.name).to.eql('Faker Person');
      });
  });

  after( () => {
    return agent.close();
  });
});

describe("GET /users/missing@person.com", function() {
  before(() => {
    let user = new userModel({ name: 'Also Me', email:'me2@me.com', password: 'abcd' });
    return user.save();
  });

  let agent = chai.request.agent(app);
  
  before(() => {
    return agent
      .get("/users/me2@me.com/token")
      .auth('me2@me.com', 'abcd');
  });

  it("responds with 404", function() {
    return agent
      .get("/users/missing@person.com")
      .then(function (res) {
        expect(res).to.have.status(404);
      });
  });

  after( () => {
    return agent.close();
  });

});
  
describe("GET /users/somebody@else.com", function() {
  before(() => {
    let user = new userModel({ name: 'Me', email:'me@me.com', password: 'abcd' });
    return user.save();
  });

  before(() => {
    let user = new userModel({ name: 'Somebody Else', email:'somebody@else.com', password: 'abcd' });
    return user.save();
  });  
  
  let agent = chai.request.agent(app);

  it("returns 401 before authentication", function() {
    return agent
      .get("/users/somebody@else.com")
      .then(function (res) {
        expect(res).to.have.status(401);
      });
  });
  
  it("provides a token", function() {
    return agent
      .get("/users/me@me.com/token")
      .auth('me@me.com', 'abcd')
      .then(function (res) {
        expect(res).to.have.cookie('token');
      });
  });
  
  it("returns 403 after authentication", function() {
    return agent
      .get("/users/somebody@else.com")
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  after( () => {
    return agent.close();
  });
});

describe("PUT /users/name@change.com", function() {
  before(() => {
    let user = new userModel({ name: 'Original Name', email:'name@change.com', password: 'abcde' });
    return user.save();
  });

  let agent = chai.request.agent(app);
  
  before(() => {
    return agent
      .get("/users/name@change.com/token")
      .auth('name@change.com', 'abcde');
  });

  it("originally has name Original Name", function() {
    return agent
      .get("/users/name@change.com")
      .then(function (res) {
        expect(res.body.name).to.eql('Original Name');
      });
  });

  it("name is changed to New Name", function() {
    return agent
      .put("/users/name@change.com")
      .send({name:"New Name"})
      .then(function (res) {
        expect(res.body.name).to.eql('New Name');
      });
  });  

  it("still has New Name", function() {
    return agent
      .get("/users/name@change.com")
      .then(function (res) {
        expect(res.body.name).to.eql('New Name');
      });
  });

  after( () => {
    return agent.close();
  });

});
