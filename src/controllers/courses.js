import userModel from '../models/users';
import courseModel from '../models/courses';

export function findCourse(req, res, next) {
  if (req.params.course) {
    courseModel.findById( req.params.course, function(err, course) {
      if (err) {
        next(err);
      } else {
        if (course) {
          req.course = course;
          next();
        } else {
          res.status(404).send('Course not found');
        }
      }
    });
  } else {
    res.status(404).send('Course not found');
  }
}

// POST /courses
export function createCourse(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canCreateCourses()) {
      var params = {};
      params.instructors = [req.jwt.user._id];
      
      if (req.body.name && typeof req.body.name === 'string')
        params.name = req.body.name;
      
      courseModel.create( params, function(err, course) {
        if (err)
          return res.status(500).send('Error creating course');
        else
          return res.json(course.toJSON());
      });
    } else {
      res.status(403).send('Not permitted to create courses');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// PUT /courses/:course
// PATCH /courses/:course
export function updateCourse(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canUpdateCourse( req.course )) {
      if (req.body.name && typeof req.body.name === 'string')
        req.course.name = req.body.name;
      
      req.course.save( function(err) {
        if (err)
          return res.status(500).send('Error updating course');
        else
          return res.json(req.course.toJSON());
      });
    } else {
      res.status(403).send('Not permitted to update this course');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// DELETE /courses/:course

// GET /courses/:course
export function getCourse(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canViewCourse( req.course )) {
      return res.json(req.course.toJSON());
    } else {
      return res.status(403).send('Not permitted to view course');
    }
  } else {
    return res.status(401).send('Unauthenticated');
  }
}

// GET /courses/:course/instructors
// get a list of instructors in a course

// POST /courses/:course/instructors/:user
// add an instructor in a course; only an instructor is permitted to add
// other instructors

// DELETE /courses/:course/instructors/:user
// remove an instructor from a course

// GET /courses/:course/learners
// get a list of learners enrolled in a course

// GET /learners/:user/courses
// Get a list of all courses a learner is enrolled in

// GET /instructors/:user/courses
// Get a list of all courses an instructor is teaching

// DELETE /courses/:course/learners/:user
// disenroll a student from the course

// POST /courses/:course/learners/:user
// enroll a student in a course; students can enroll themselves in a course 

// GET /courses/:course/progress
// get a list of scores for all the learners and worksheets


