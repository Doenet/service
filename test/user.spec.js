import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app';

import userModel from '../src/models/users';

chai.use(chaiHttp);

const { expect } = chai;

describe('GET /users/fake@fake.com/token', function() {
  before(function() {
    const user = new userModel({ firstName: 'Fake Person', email: 'fake@fake.com', password: '1234' });
    return user.save();
  });

  it('provides a JWT token', () => {
    return chai
      .request(app)
      .get('/users/fake@fake.com/token')
      .auth('fake@fake.com', '1234')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.have.cookie('token');
      });
  });

  it('fails with the wrong password', () => {
    return chai
      .request(app)
      .get('/users/fake@fake.com/token')
      .auth('fake@fake.com', '12345')
      .then((res) => {
        expect(res).to.have.status(401);
      });
  });

  it('fails with mismatched username', () => {
    return chai
      .request(app)
      .get('/users/fake@fake.com/token')
      .auth('fake2@fake.com', '1234')
      .then((res) => {
        expect(res).to.have.status(500);
      });
  });

  it('fails with differently mismatched username', () => {
    return chai
      .request(app)
      .get('/users/mismatch@fake.com/token')
      .auth('fake@fake.com', '1234')
      .then((res) => {
        // because there is no user named fake2
        expect(res).to.have.status(404);
      });
  });
});

describe('GET /users/fake2@fake.com', function() {
  before(function() {
    const user = new userModel({
      firstName: 'Faker Person',
      email: 'fake2@fake.com',
      password: 'abcd',
    });
    return user.save();
  });

  const agent = chai.request.agent(app);

  before(function() {
    return agent
      .get('/users/fake2@fake.com/token')
      .auth('fake2@fake.com', 'abcd');
  });

  it("returns the user's name", () => {
    return agent
      .get('/users/fake2@fake.com')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.firstName).to.eql('Faker Person');
      });
  });

  after(() => { return agent.close(); });
});

describe('GET /users/missing@person.com', function() {
  before(function() {
    const user = new userModel({ firstName: 'Also Me', email: 'me2@me.com', password: 'abcd' });
    return user.save();
  });

  const agent = chai.request.agent(app);

  before(function() {
    return agent
      .get('/users/me2@me.com/token')
      .auth('me2@me.com', 'abcd');
  });

  it('responds with 404', () => {
    return agent
      .get('/users/missing@person.com')
      .then((res) => {
        expect(res).to.have.status(404);
      });
  });

  after(() => { return agent.close(); });
});

describe('GET /users/somebody@else.com', function() {
  before(function() {
    const user = new userModel({ firstName: 'Me', email: 'me@me.com', password: 'abcd' });
    return user.save();
  });

  before(function() {
    const user = new userModel({ firstName: 'Somebody Else', email: 'somebody@else.com', password: 'abcd' });
    return user.save();
  });

  const agent = chai.request.agent(app);

  it('returns 401 before authentication', () => {
    return agent
      .get('/users/somebody@else.com')
      .then((res) => {
        expect(res).to.have.status(401);
      });
  });

  it('provides a token', () => {
    return agent
      .get('/users/me@me.com/token')
      .auth('me@me.com', 'abcd')
      .then((res) => {
        expect(res).to.have.cookie('token');
      });
  });

  it('returns 403 after authentication', () => {
    return agent
      .get('/users/somebody@else.com')
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  after(() => { return agent.close(); });
});

describe('PUT /users/name@change.com', function() {
  before(function() {
    const user = new userModel({ firstName: 'Original Name', email: 'name@change.com', password: 'abcde' });
    return user.save();
  });

  before(function() {
    const otherUser = new userModel({ firstName: 'Original Name', email: 'othername@change.com', password: 'abcde' });
    return otherUser.save();
  });

  const agent = chai.request.agent(app);
  const otherAgent = chai.request.agent(app);

  before(function() {
    return agent
      .get('/users/name@change.com/token')
      .auth('name@change.com', 'abcde');
  });

  before(function() {
    return otherAgent
      .get('/users/othername@change.com/token')
      .auth('othername@change.com', 'abcde');
  });

  it('originally has name Original Name', () => {
    return agent
      .get('/users/name@change.com')
      .then((res) => {
        expect(res.body.firstName).to.eql('Original Name');
      });
  });

  it('name is changed to New Name', () => {
    return agent
      .put('/users/name@change.com')
      .send({ firstName: 'New Name' })
      .then((res) => {
        expect(res.body.firstName).to.eql('New Name');
      });
  });

  it('will not let other users change a user', () => {
    return otherAgent
      .put('/users/name@change.com')
      .send({ firstName: 'New Name' })
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('still has New Name', () => {
    return agent
      .get('/users/name@change.com')
      .then((res) => {
        expect(res.body.firstName).to.eql('New Name');
      });
  });

  it('responds to PATCH as well', () => {
    return agent
      .patch('/users/name@change.com')
      .send({ firstName: 'Newer Name' })
      .then((res) => {
        expect(res.body.firstName).to.eql('Newer Name');
      });
  });

  after(() => { return agent.close(); });
});
