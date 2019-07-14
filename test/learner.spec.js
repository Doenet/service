import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app';

import userModel from '../src/models/users';
import progressModel from '../src/models/progress';

chai.use(chaiHttp);

const expect = chai.expect;

import * as helper from './mongoose-helper';

before(helper.before);
after(helper.after);

describe("PUT /learners/:learner/progress", function() {
  var user;
  
  before(() => {
    user = new userModel({ name: 'Learner', email:'learner@name.com', password: 'abcde' });
    return user.save();
  });

  before(() => {
    let user = new userModel({ name: 'Another Learner', email:'learner2@name.com', password: 'abcde' });
    return user.save();
  });  
  
  let agent = chai.request.agent(app);
  
  before(() => {
    return agent
      .get("/users/learner@name.com/token")
      .auth('learner@name.com', 'abcde');
  });

  let anotherAgent = chai.request.agent(app);
  
  before(() => {
    return anotherAgent
      .get("/users/learner2@name.com/token")
      .auth('learner2@name.com', 'abcde');
  });
  
  it("saves progress", function() {
    return agent
      .put("/learners/me/progress")
      .send({score:0.17})
      .then(function (res) {
        expect(res.body.score).to.eql(0.17);
      });
  });

  it("still saves progress", function() {
    return agent
      .get("/learners/me/progress")
      .then(function (res) {
        expect(res.body.score).to.eql(0.17);
      });
  });

  it("does not let other people view progress", function() {
    return anotherAgent
      .get("/learners/" + user._id + "/progress")
      .then(function (res) {
        expect(res).to.have.status(403);        
      });
  });

  it("does not let random people view progress", function() {
    return chai
      .request(app)
      .get("/learners/" + user._id + "/progress")
      .then(function (res) {
        expect(res).to.have.status(401);
      });
  });
  
  it("saves progress", function() {
    return agent
      .put("/learners/" + user._id + "/progress")
      .send({score:0.57})
      .then(function (res) {
        expect(res.body.score).to.eql(0.57);
      });
  });

  it("still saves progress", function() {
    return agent
      .get("/learners/" + user._id + "/progress")    
      .then(function (res) {
        expect(res.body.score).to.eql(0.57);
      });
  });
  
  after( () => {
    return agent.close();
  });

  after( () => {
    return anotherAgent.close();
  });  

});


describe("PUT /learners/:learner/state", function() {
  var user;
  
  let agent = chai.request.agent(app);
  
  before(() => {
    user = new userModel({ name: 'Stateful Learner', email:'state@learner.com', password: '1234' });
    return user.save();
  });
  
  before(() => {
    return agent
      .get("/users/state@learner.com/token")
      .auth('state@learner.com', '1234');
  });

  before(() => {
    let user = new userModel({ name: 'Blackhat Learner',
                               email:'blackhat@learner.com', password: '12345' });
    return user.save();
  });

  let anotherAgent = chai.request.agent(app);
  
  before(() => {
    return anotherAgent
      .get("/users/blackhat@learner.com/token")
      .auth('blackhat@learner.com', '12345');
  });

  var sampleState = {hello: 'goodbye', number: 171717, nested: { objects: {too: 1717}}};
  
  it("saves state", function() {
    return agent
      .put("/learners/me/state")
      .send(sampleState)
      .then(function (res) {
        expect(res.body).to.eql(sampleState);
      });
  });

  it("still saves state", function() {
    return agent
      .get("/learners/me/state")
      .then(function (res) {
        expect(res.body).to.eql(sampleState);        
      });
  });

  it("does not let other people view my state", function() {
    return anotherAgent
      .get("/learners/" + user._id + "/state")
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  it("does not let guests view state", function() {
    return chai
      .request(app)
      .get("/learners/" + user._id + "/state")
      .then(function (res) {
        expect(res).to.have.status(401);
      });
  });

  var newState = { changed: 123, updated: true };
  
  it("updates state by id", function() {
    return agent
      .put("/learners/" + user._id + "/state")
      .send(newState)
      .then(function (res) {
        expect(res.body).to.eql(newState);
      });
  });

  it("still saves state", function() {
    return agent
      .get("/learners/" + user._id + "/state")    
      .then(function (res) {
        expect(res.body).to.eql(newState);        
      });
  });
  
  after( () => {
    return agent.close();
  });

  after( () => {
    return anotherAgent.close();
  });  

});
