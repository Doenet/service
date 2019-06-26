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
  before(() => {
    let user = new userModel({ name: 'Learner', email:'learner@name.com', password: 'abcde' });
    return user.save();
  });

  let agent = chai.request.agent(app);
  
  before(() => {
    return agent
      .get("/users/learner@name.com/token")
      .auth('learner@name.com', 'abcde');
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

  it("saves progress", function() {
    return agent
      .put("/learners/me/progress")
      .send({score:0.57})
      .then(function (res) {
        expect(res.body.score).to.eql(0.57);
      });
  });

  it("still saves progress", function() {
    return agent
      .get("/learners/me/progress")
      .then(function (res) {
        expect(res.body.score).to.eql(0.57);
      });
  });
  
  after( () => {
    return agent.close();
  });

});
