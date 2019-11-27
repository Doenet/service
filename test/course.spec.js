import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app';

import userModel from '../src/models/users';
import courseModel from '../src/models/courses';

chai.use(chaiHttp);

const { expect } = chai;

describe('POST /courses', function() {
  let user;

  before(function() {
    user = new userModel({
      name: 'Instructor',
      email: 'instructor@name.com',
      password: 'secret2',
    });
    return user.save();
  });

  const agent = chai.request.agent(app);

  before(function() {
    return agent
      .get('/users/instructor@name.com/token')
      .auth('instructor@name.com', 'secret2');
  });

  it('requires a logged-in user', () => {
    return chai
      .request(app)
      .post('/courses')
      .then((res) => {
        expect(res).to.have.status(401);
      });
  });

  it('creates courses', () => {
    return agent
      .post('/courses')
      .send({ name: 'The Title' })
      .then((res) => {
        expect(res.body.name).to.eql('The Title');
        expect(res.body.instructors).to.include(user.id);
      });
  });

  after(() => { return agent.close(); });
});

describe('PUT /courses/:course', function() {
  let user;
  let course;
  let learner;
  let otherUser;

  before(function() {
    user = new userModel({
      name: 'Another Instructor',
      email: 'ai@name.com',
      password: 'secret2',
    });
    return user.save();
  });

  before(function() {
    otherUser = new userModel({
      name: 'Random User',
      email: 'random@name.com',
      password: 'random123',
    });
    return otherUser.save();
  });

  before(function() {
    learner = new userModel({
      name: 'Random Learner',
      email: 'learner17@name.com',
      password: 'random123',
    });
    return learner.save();
  });

  before(function() {
    course = new courseModel({
      name: 'This Old Course',
      instructors: [user._id],
    });
    return course.save();
  });

  const agent = chai.request.agent(app);

  before(function() {
    return agent
      .get('/users/ai@name.com/token')
      .auth('ai@name.com', 'secret2');
  });

  const anotherAgent = chai.request.agent(app);

  before(function() {
    return anotherAgent
      .get('/users/random@name.com/token')
      .auth('random@name.com', 'random123');
  });

  const learnerAgent = chai.request.agent(app);

  before(function() {
    return learnerAgent
      .get('/users/learner17@name.com/token')
      .auth('learner17@name.com', 'random123');
  });

  it('updates courses', () => {
    return agent
      .put(`/courses/${course.id}`)
      .send({ name: 'The New Title' })
      .then((res) => {
        expect(res.body.name).to.eql('The New Title');
        expect(res.body.instructors).to.include(user.id);
      });
  });

  it('is still updated', () => {
    return agent
      .get(`/courses/${course.id}`)
      .then((res) => {
        expect(res.body.name).to.eql('The New Title');
        expect(res.body.instructors).to.include(user.id);
      });
  });


  it('does not let guests update courses', () => {
    return chai
      .request(app)
      .put(`/courses/${course.id}`)
      .send({ name: 'The New Title' })
      .then((res) => {
        expect(res).to.have.status(401);
      });
  });

  it('does not let other people update courses', () => {
    return anotherAgent
      .put(`/courses/${course.id}`)
      .send({ name: 'The New Title' })
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('does not random people become instructors', () => {
    return anotherAgent
      .post(`/courses/${course.id}/instructors/me`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('does not duplicate instructors', () => {
    return agent
      .post(`/courses/${course.id}/instructors/me`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.have.length(1);
        expect(res.body.instructors).to.be.an('array').that.includes(user.id);
      });
  });

  it('does not let non-instructors add more instructors', () => {
    return anotherAgent
      .post(`/courses/${course.id}/instructors/${otherUser.id}`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('lets instructors add more instructors', () => {
    return agent
      .post(`/courses/${course.id}/instructors/${otherUser.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.have.length(2);
        expect(res.body.instructors).to.be.an('array').that.includes(user.id);
        expect(res.body.instructors).to.be.an('array').that.includes(otherUser.id);
      });
  });

  it('does not let people add other people as learners', () => {
    return agent
      .post(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('does not let people add themselves as learners to courses by default', () => {
    return learnerAgent
      .post(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('lets instructors make courses open', () => {
    return agent
      .put(`/courses/${course.id}`)
      .send({ enrollable: true })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.enrollable).to.be.true;
      });
  });

  it('lets people add themselves as learners if the course is open', () => {
    return learnerAgent
      .post(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.has.length(1);
        expect(res.body.learners).to.be.an('array').that.includes(learner.id);
      });
  });

  it('lets instructors make courses closed', () => {
    return agent
      .put(`/courses/${course.id}`)
      .send({ enrollable: false })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.enrollable).to.be.false;
      });
  });

  it('lets instructors disenroll learners', () => {
    return agent
      .delete(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.has.length(0);
      });
  });

  it('does not let people add themselves as learners to courses which are closed', () => {
    return learnerAgent
      .post(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('does not let students make the course open', () => {
    return learnerAgent
      .put(`/courses/${course.id}`)
      .send({ enrollable: true })
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('lets instructors make courses open again', () => {
    return agent
      .put(`/courses/${course.id}`)
      .send({ enrollable: true })
      .then((res) => {
        expect(res).to.have.status(200);
      });
  });

  it('lets people add themselves as learners when the course is re-opened', () => {
    return learnerAgent
      .post(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.has.length(1);
        expect(res.body.learners).to.be.an('array').that.includes(learner.id);
      });
  });

  it('lets instructor see the list of learners', () => {
    return agent
      .get(`/courses/${course.id}/learners`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array').that.has.length(1);
        expect(res.body).to.be.an('array').that.includes(learner.id);
      });
  });

  it("doesn't let non-instructor see the list of learners", () => {
    return learnerAgent
      .get(`/courses/${course.id}/learners`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it("doesn't let guests see the list of learners", () => {
    return chai
      .request(app)
      .get(`/courses/${course.id}/learners`)
      .then((res) => {
        expect(res).to.have.status(401);
      });
  });

  it("doesn't let guests see the list of instructors", () => {
    return chai
      .request(app)
      .get(`/courses/${course.id}/learners`)
      .then((res) => {
        expect(res).to.have.status(401);
      });
  });

  it('lets the instructor see the list of instructors', () => {
    return agent
      .get(`/courses/${course.id}/instructors`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(2);
        expect(res.body).to.be.an('array').that.includes(user.id);
        expect(res.body).to.be.an('array').that.includes(otherUser.id);
      });
  });

  it('lets a learner see their list of coures', () => {
    return learnerAgent
      .get(`/learners/${learner.id}/courses`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(1);
        expect(res.body).to.be.an('array').that.includes(course.id);
      });
  });

  it("doesn't let an instructor see someone else's list of coures", () => {
    return agent
      .get(`/learners/${learner.id}/courses`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it("doesn't let an instructor see someone else's list of coures", () => {
    return agent
      .get(`/learners/${learner.id}/courses`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('lets an instructor see what they are teaching', () => {
    return agent
      .get(`/instructors/${user.id}/courses`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(1);
        expect(res.body).to.be.an('array').that.includes(course.id);
      });
  });

  it('lets other people see what an instructor is teaching', () => {
    return learnerAgent
      .get(`/instructors/${user.id}/courses`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(1);
        expect(res.body).to.be.an('array').that.includes(course.id);
      });
  });

  it('lets a learner see the list of instructors', () => {
    return learnerAgent
      .get(`/courses/${course.id}/instructors`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(2);
        expect(res.body).to.be.an('array').that.includes(user.id);
        expect(res.body).to.be.an('array').that.includes(otherUser.id);
      });
  });

  it('lets people remove themselves as learners', () => {
    return learnerAgent
      .delete(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.has.length(0);
        expect(res.body.learners).to.be.an('array').that.does.not.include(learner.id);
      });
  });

  it('lets people return as learners', () => {
    return learnerAgent
      .post(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.has.length(1);
        expect(res.body.learners).to.be.an('array').that.includes(learner.id);
      });
  });

  it('lets instructors also be learners', () => {
    return agent
      .post(`/courses/${course.id}/learners/me`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.includes(user.id);
      });
  });

  it('instructors remove themselves', () => {
    return agent
      .delete(`/courses/${course.id}/instructors/me`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.be.an('array').that.does.not.include(user.id);
        expect(res.body.instructors).to.be.an('array').that.includes(otherUser.id);
        expect(res.body.instructors).to.have.length(1);
      });
  });

  it("non-instructors can't become non-instructors", () => {
    return learnerAgent
      .delete(`/courses/${course.id}/instructors/me`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('instructors can not remove the only instructor', () => {
    return anotherAgent
      .delete(`/courses/${course.id}/instructors/me`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  it('lets instructors add previously removed instructors', () => {
    return anotherAgent
      .post(`/courses/${course.id}/instructors/${user.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.have.length(2);
        expect(res.body.instructors).to.be.an('array').that.includes(user.id);
        expect(res.body.instructors).to.be.an('array').that.includes(otherUser.id);
      });
  });

  it('lets instructors remove other instructors', () => {
    return agent
      .delete(`/courses/${course.id}/instructors/${otherUser.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.be.an('array').that.does.not.include(otherUser.id);
        expect(res.body.instructors).to.be.an('array').that.includes(user.id);
        expect(res.body.instructors).to.have.length(1);
      });
  });

  it('does not let non-instructors disenroll learners', () => {
    return anotherAgent
      .delete(`/courses/${course.id}/learners/${learner.id}`)
      .then((res) => {
        expect(res).to.have.status(403);
      });
  });

  after(() => { return agent.close(); });

  after(() => { return anotherAgent.close(); });

  after(() => { return learnerAgent.close(); });
});
