import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../src/app';

import userModel from '../src/models/users';
import courseModel from '../src/models/courses';

chai.use(chaiHttp);

const expect = chai.expect;

describe("POST /courses", function() {
  var user;
  
  before(() => {
    user = new userModel({ name: 'Instructor',
                           email:'instructor@name.com', password: 'secret2' });
    return user.save();
  });
  
  let agent = chai.request.agent(app);
  
  before(() => {
    return agent
      .get("/users/instructor@name.com/token")
      .auth('instructor@name.com', 'secret2');
  });

  it("requires a logged-in user", function() {
    return chai
      .request(app)
      .post("/courses")
      .then(function (res) {
        expect(res).to.have.status(401);
      });
  });

  it("creates courses", function() {
    return agent
      .post("/courses")
      .send({name:"The Title"})
      .then(function (res) {
        expect(res.body.name).to.eql("The Title");
        expect(res.body.instructors).to.include(user.id);
        console.log(res.body);
      });
  });
  
  after( () => {
    return agent.close();
  });
});


describe("PUT /courses/:course", function() {
  var user;
  var course;
  
  before(() => {
    user = new userModel({ name: 'Another Instructor',
                           email:'ai@name.com', password: 'secret2' });
    return user.save();
  });

  before(() => {
    let otherUser = new userModel({ name: 'Random User',
                                    email:'random@name.com', password: 'random123' });
    return otherUser.save();
  });

  before(() => {
    course = new courseModel({ name: 'This Old Course',
                               instructors: [ user._id] });
    return course.save();
  });
  
  let agent = chai.request.agent(app);

  before(() => {
    return agent
      .get("/users/ai@name.com/token")
      .auth('ai@name.com', 'secret2');
  });

  let anotherAgent = chai.request.agent(app);

  before(() => {
    return anotherAgent
      .get("/users/random@name.com/token")
      .auth('random@name.com', 'random123');
  });
  
  it("updates courses", function() {
    return agent
      .put("/courses/" + course.id)
      .send({name:"The New Title"})
      .then(function (res) {
        expect(res.body.name).to.eql("The New Title");
        expect(res.body.instructors).to.include(user.id);
      });
  });

  it("is still updated", function() {
    return agent
      .get("/courses/" + course.id)
      .then(function (res) {
        expect(res.body.name).to.eql("The New Title");
        expect(res.body.instructors).to.include(user.id);
      });
  });

  
  it("does not let guests update courses", function() {
    return chai
      .request(app)
      .put("/courses/" + course.id)
      .send({name:"The New Title"})    
      .then(function (res) {
        expect(res).to.have.status(401);
      });
  });

  it("does not let other people update courses", function() {
    return anotherAgent
      .put("/courses/" + course.id)
      .send({name:"The New Title"})
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  after( () => {
    return agent.close();
  });

  after( () => {
    return anotherAgent.close();
  });

});

