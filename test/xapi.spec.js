import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app';

import userModel from '../src/models/users';
import statementModel from '../src/models/statements';

chai.use(chaiHttp);

const { expect } = chai;

describe('POST /learners/:learner/worksheets/:worksheet/statements', function() {
  let user;

  before(function() {
    user = new userModel({ name: 'xAPI Learner', email: 'xapilearner17@name.com', password: 'abcde' });
    return user.save();
  });

  before(function() {
    const user2 = new userModel({ name: 'Yet Another Learner', email: 'xapilearner19@name.com', password: 'abcde' });
    return user2.save();
  });

  const agent = chai.request.agent(app);

  before(function() {
    return agent
      .get('/users/xapilearner17@name.com/token')
      .auth('xapilearner17@name.com', 'abcde');
  });

  const anotherAgent = chai.request.agent(app);

  before(function() {
    return anotherAgent
      .get('/users/xapilearner19@name.com/token')
      .auth('xapilearner19@name.com', 'abcde');
  });

  const statement = { verb: 'HELLO', object: 'blah' };

  it('accepts statements', () => {
    return agent
      .post('/learners/me/worksheets/fakeworksheet/statements')
      .send(statement)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.verb).to.eql(statement.verb);
        expect(res.body.object).to.eql(statement.object);
      });
  });

  it('shows recent statements', () => {
    return agent
      .get('/learners/me/statements')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(1);
        expect(res.body[0].verb).to.eql(statement.verb);
        expect(res.body[0].object).to.eql(statement.object);

        statement.id = res.body[0].id;
      });
  });

  it('gives a learner a statement by id', () => {
    return agent
      .get(`/learners/me/statements/${statement.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.verb).to.eql(statement.verb);
        expect(res.body.object).to.eql(statement.object);
        expect(res.body.id).to.eql(statement.id);
      });
  });

  const statement2 = { verb: 'HELLO2', object: 'blah2' };

  it('accepts more statements', () => {
    return agent
      .post('/learners/me/worksheets/fakeworksheet/statements')
      .send(statement2)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.verb).to.eql(statement2.verb);
        expect(res.body.object).to.eql(statement2.object);

        statement2.id = res.body.id;
      });
  });

  it('gives a statement by id', () => {
    return agent
      .get(`/statements/${statement2.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.verb).to.eql(statement2.verb);
        expect(res.body.object).to.eql(statement2.object);
        expect(res.body.id).to.eql(statement2.id);
      });
  });

  it('gives a statement by user and id', () => {
    return agent
      .get(`/learners/${user._id}/statements/${statement2.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.verb).to.eql(statement2.verb);
        expect(res.body.object).to.eql(statement2.object);
        expect(res.body.id).to.eql(statement2.id);
      });
  });

  it('does not gives a statement by id to another user', () => {
    return anotherAgent
      .get(`/statements/${statement2.id}`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('does not gives a statement by user and id to another user', () => {
    return anotherAgent
      .get(`/learners/${user._id}/statements/${statement2.id}`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('still shows recent statements', () => {
    return agent
      .get('/learners/me/statements')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(2);
      });
  });

  after(() => { return agent.close(); });

  after(() => { return anotherAgent.close(); });
});
