import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app';

import userModel from '../src/models/users';
import progressModel from '../src/models/progress';

chai.use(chaiHttp);

const { expect } = chai;

describe('PUT /learners/:learner/progress', function() {
  let user;

  before(function() {
    user = new userModel({ name: 'Learner', email: 'learner@name.com', password: 'abcde' });
    return user.save();
  });

  before(function() {
    const user = new userModel({ name: 'Another Learner', email: 'learner2@name.com', password: 'abcde' });
    return user.save();
  });

  const agent = chai.request.agent(app);

  before(function() {
    return agent
      .get('/users/learner@name.com/token')
      .auth('learner@name.com', 'abcde');
  });

  const anotherAgent = chai.request.agent(app);

  before(function() {
    return anotherAgent
      .get('/users/learner2@name.com/token')
      .auth('learner2@name.com', 'abcde');
  });

  it('saves progress', () => {
    return agent
      .put('/learners/me/progress')
      .send({ score: 0.17 })
      .then((res) => {
        expect(res.body.score).to.eql(0.17);
      });
  });

  it('still saves progress', () => {
    return agent
      .get('/learners/me/progress')
      .then((res) => {
        expect(res.body.score).to.eql(0.17);
      });
  });

  it('does not let other people view progress', () => {
    return anotherAgent
      .get(`/learners/${  user._id  }/progress`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('does not let random people view progress', () => {
    return chai
      .request(app)
      .get(`/learners/${  user._id  }/progress`)
      .then((res) => {
        expect(res).to.have.status(401);
      });
  });

  it('saves progress', () => {
    return agent
      .put(`/learners/${  user._id  }/progress`)
      .send({ score: 0.57 })
      .then((res) => {
        expect(res.body.score).to.eql(0.57);
      });
  });

  it('still saves progress', () => {
    return agent
      .get(`/learners/${  user._id  }/progress`)
      .then((res) => {
        expect(res.body.score).to.eql(0.57);
      });
  });

  after(() => { return agent.close(); });

  after(() => { return anotherAgent.close(); });
});

describe('PUT /learners/:learner/state', function() {
  let user;

  const agent = chai.request.agent(app);

  before(function() {
    user = new userModel({ name: 'Stateful Learner', email: 'state@learner.com', password: '1234' });
    return user.save();
  });

  before(function() {
    return agent
      .get('/users/state@learner.com/token')
      .auth('state@learner.com', '1234');
  });

  before(function() {
    const user = new userModel({
      name: 'Blackhat Learner',
      email: 'blackhat@learner.com',
      password: '12345',
    });
    return user.save();
  });

  const anotherAgent = chai.request.agent(app);

  before(function() {
    return anotherAgent
      .get('/users/blackhat@learner.com/token')
      .auth('blackhat@learner.com', '12345');
  });

  const sampleState = { hello: 'goodbye', number: 171717, nested: { objects: { too: 1717 } } };

  it('saves state', () => {
    return agent
      .put('/learners/me/state')
      .send(sampleState)
      .then((res) => {
        expect(res.body).to.eql(sampleState);
      });
  });

  it('still saves state', () => {
    return agent
      .get('/learners/me/state')
      .then((res) => {
        expect(res.body).to.eql(sampleState);
      });
  });

  it('does not let other people view my state', () => {
    return anotherAgent
      .get(`/learners/${  user._id  }/state`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('does not let guests view state', () => {
    return chai
      .request(app)
      .get(`/learners/${  user._id  }/state`)
      .then((res) => {
        expect(res).to.have.status(401);
      });
  });

  const newState = { changed: 123, updated: true };

  it('updates state by id', () => {
    return agent
      .put(`/learners/${  user._id  }/state`)
      .send(newState)
      .then((res) => {
        expect(res.body).to.eql(newState);
      });
  });

  it('still saves state', () => {
    return agent
      .get(`/learners/${  user._id  }/state`)
      .then((res) => {
        expect(res.body).to.eql(newState);
      });
  });

  after(() => { return agent.close(); });

  after(() => { return anotherAgent.close(); });
});
