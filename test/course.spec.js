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
      });
  });

  after( () => {
    return agent.close();
  });
});

describe("PUT /courses/:course", function() {
  var user;
  var course;
  var learner;
  var otherUser;
  
  before(() => {
    user = new userModel({ name: 'Another Instructor',
                           email:'ai@name.com', password: 'secret2' });
    return user.save();
  });

  before(() => {
    otherUser = new userModel({ name: 'Random User',
                                email:'random@name.com', password: 'random123' });
    return otherUser.save();
  });

  before(() => {
    learner = new userModel({ name: 'Random Learner',
                                    email:'learner17@name.com', password: 'random123' });
    return learner.save();
  });
  
  before(() => {
    course = new courseModel({ name: 'This Old Course',
                               instructors: [user._id] });
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

  let learnerAgent = chai.request.agent(app);

  before(() => {
    return learnerAgent
      .get("/users/learner17@name.com/token")
      .auth('learner17@name.com', 'random123');
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

  it("does not random people become instructors", function() {
    return anotherAgent
      .post("/courses/" + course.id + "/instructors/me")
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  it("does not duplicate instructors", function() {
    return agent
      .post("/courses/" + course.id + "/instructors/me")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.have.length(1);
        expect(res.body.instructors).to.be.an('array').that.includes(user.id);
      });
  });  

  it("does not let non-instructors add more instructors", function() {
    return anotherAgent
      .post("/courses/" + course.id + "/instructors/" + otherUser.id)
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });
  
  it("lets instructors add more instructors", function() {
    return agent
      .post("/courses/" + course.id + "/instructors/" + otherUser.id)
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.have.length(2);
        expect(res.body.instructors).to.be.an('array').that.includes(user.id);
        expect(res.body.instructors).to.be.an('array').that.includes(otherUser.id);
      });
  });

  it("does not let people add other people as learners", function() {
    return agent
      .post("/courses/" + course.id + "/learners/" + learner.id)
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  it("does not let people add themselves as learners to courses by default", function() {
    return learnerAgent
      .post("/courses/" + course.id + "/learners/" + learner.id)
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  it("lets instructors make courses open", function() {
    return agent
      .put("/courses/" + course.id)
      .send({enrollable:true})
      .then(function (res) {
        expect(res).to.have.status(200);
      });
  });

  it("lets people add themselves as learners if the course is open", function() {
    return learnerAgent
      .post("/courses/" + course.id + "/learners/" + learner.id)
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.has.length(1);
        expect(res.body.learners).to.be.an('array').that.includes(learner.id);
      });
  });

  it("lets instructors make courses closed", function() {
    return agent
      .put("/courses/" + course.id)
      .send({enrollable:false})
      .then(function (res) {
        expect(res).to.have.status(200);
      });
  });

  it("does not let people add themselves as learners to courses which are closed", function() {
    return learnerAgent
      .post("/courses/" + course.id + "/learners/" + learner.id)
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  
  it("lets instructor see the list of learners", function() {
    return agent
      .get("/courses/" + course.id + "/learners")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array').that.has.length(1);
        expect(res.body).to.be.an('array').that.includes(learner.id);
      });
  });  

  it("doesn't let non-instructor see the list of learners", function() {
    return learnerAgent
      .get("/courses/" + course.id + "/learners")
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });  

  it("doesn't let guests see the list of learners", function() {
    return chai
      .request(app)
      .get("/courses/" + course.id + "/learners")
      .then(function (res) {
        expect(res).to.have.status(401);
      });
  });  

  it("doesn't let guests see the list of instructors", function() {
    return chai
      .request(app)
      .get("/courses/" + course.id + "/learners")
      .then(function (res) {
        expect(res).to.have.status(401);
      });
  });

  it("lets the instructor see the list of instructors", function() {
    return agent
      .get("/courses/" + course.id + "/instructors")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(2);
        expect(res.body).to.be.an('array').that.includes(user.id);
        expect(res.body).to.be.an('array').that.includes(otherUser.id);        
      });
  });    

  it("lets a learner see their list of coures", function() {
    return learnerAgent
      .get("/learners/" + learner.id + "/courses")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(1);
        expect(res.body).to.be.an('array').that.includes(course.id);
      });
  });    

  it("doesn't let an instructor see someone else's list of coures", function() {
    return agent
      .get("/learners/" + learner.id + "/courses")
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });      

  it("doesn't let an instructor see someone else's list of coures", function() {
    return agent
      .get("/learners/" + learner.id + "/courses")
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });      
  
  it("lets an instructor see what they are teaching", function() {
    return agent
      .get("/instructors/" + user.id + "/courses")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(1);
        expect(res.body).to.be.an('array').that.includes(course.id);
      });
  });    

  it("lets other people see what an instructor is teaching", function() {
    return learnerAgent
      .get("/instructors/" + user.id + "/courses")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(1);
        expect(res.body).to.be.an('array').that.includes(course.id);
      });
  });    
  
  it("lets a learner see the list of instructors", function() {
    return learnerAgent
      .get("/courses/" + course.id + "/instructors")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(2);
        expect(res.body).to.be.an('array').that.includes(user.id);
        expect(res.body).to.be.an('array').that.includes(otherUser.id);        
      });
  });     
  
  it("lets people remove themselves as learners", function() {
    return learnerAgent
      .delete("/courses/" + course.id + "/learners/" + learner.id)
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.has.length(0);
        expect(res.body.learners).to.be.an('array').that.does.not.include(learner.id);
      });
  });

  it("lets people return as learners", function() {
    return learnerAgent
      .post("/courses/" + course.id + "/learners/" + learner.id)
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.has.length(1);
        expect(res.body.learners).to.be.an('array').that.includes(learner.id);
      });
  });
  
  it("lets instructors also be learners", function() {
    return agent
      .post("/courses/" + course.id + "/learners/me")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.learners).to.be.an('array').that.includes(user.id);
      });
  });

  it("instructors remove themselves", function() {
    return agent
      .delete("/courses/" + course.id + "/instructors/me")
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.be.an('array').that.does.not.include(user.id);
        expect(res.body.instructors).to.be.an('array').that.includes(otherUser.id);
        expect(res.body.instructors).to.have.length(1);
      });
  });

  it("non-instructors can't become non-instructors", function() {
    return learnerAgent
      .delete("/courses/" + course.id + "/instructors/me")
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  it("instructors can not remove the only instructor", function() {
    return anotherAgent
      .delete("/courses/" + course.id + "/instructors/me")
      .then(function (res) {
        expect(res).to.have.status(403);
      });
  });

  it("lets instructors add previously removed instructors", function() {
    return anotherAgent
      .post("/courses/" + course.id + "/instructors/" + user.id)
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.have.length(2);
        expect(res.body.instructors).to.be.an('array').that.includes(user.id);
        expect(res.body.instructors).to.be.an('array').that.includes(otherUser.id);
      });
  });
  
  it("lets instructors remove other instructors", function() {
    return agent
      .delete("/courses/" + course.id + "/instructors/" + otherUser.id)
      .then(function (res) {
        expect(res).to.have.status(200);
        expect(res.body.instructors).to.be.an('array').that.does.not.include(otherUser.id);
        expect(res.body.instructors).to.be.an('array').that.includes(user.id);
        expect(res.body.instructors).to.have.length(1);
      });
  });
  
  after( () => {
    return agent.close();
  });

  after( () => {
    return anotherAgent.close();
  });

  after( () => {
    return learnerAgent.close();
  });

});

