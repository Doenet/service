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
          res.status(500).send('Error creating course');
        else {
          return res.json(course.toJSON());
        }
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
          res.status(500).send('Error updating course');
        else
          res.json(req.course.toJSON());
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
      res.json(req.course.toJSON());
    } else {
      res.status(403).send('Not permitted to view course');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// POST /courses/:course/instructors/:user
// add an instructor in a course; only an instructor is permitted to add
// other instructors
export function addInstructor(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canAddInstructor( req.course )) {
      courseModel.findOneAndUpdate( { _id: req.course._id },
                                    { '$addToSet': { 'instructors': req.user._id } },
                                    { new: true },
                                    function( err, course ) {
        if (err)
          res.status(500).send('Could not update course');
        else {
          res.json(course.toJSON());
        }
      });
    } else {
      res.status(403).send('Not permitted to add instructor to course');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// POST /courses/:course/learners/:user
// enroll a student in a course; students can enroll themselves in a course 
export function addLearner(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canAddLearner( req.course, req.user )) {
      courseModel.findOneAndUpdate( { _id: req.course._id },      
                                    { '$addToSet': { 'learners': req.user._id } },
                                    { new: true },
                                    function( err, course ) {
        if (err)
          res.status(500).send('Could not update course');
        else
          res.json(course.toJSON());
      });
    } else {
      res.status(403).send('Not permitted to add learner to course');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// GET /courses/:course/instructors
// get a list of instructors in a course
export function getInstructors(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canViewInstructorList( req.course )) {
      courseModel.findOne( { _id: req.course._id },
                           function( err, course ) {
                             if (err)
                               res.status(500).send('Error finding course');
                             else {
                               if (course)
                                 res.json(course.instructors);
                               else
                                 res.status(500).send('Could not find course');
                             }
                           });
    } else {
      res.status(403).send('Not permitted to view learners in course');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// DELETE /courses/:course/instructors/:user
// remove an instructor from a course; only an instructor can remove an instructor
export function removeInstructor(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canRemoveInstructor( req.course, req.user )) {
      courseModel.findOneAndUpdate( { _id: req.course._id },
                                    { '$pull': { 'instructors': req.user._id } },
                                    { new: true },
                                    function( err, course ) {
        if (err)
          res.status(500).send('Could not update course');
        else {
          res.json(course.toJSON());
        }
      });
    } else {
      res.status(403).send('Not permitted to remove instructor from course');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// DELETE /courses/:course/learners/:user
// disenroll a student from the course; only an instructor or a student themselves can remove themselves
export function removeLearner(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canRemoveLearner( req.course, req.user )) {
      courseModel.findOneAndUpdate( { _id: req.course._id },
                                    { '$pull': { 'learners': req.user._id } },
                                    { new: true },
                                    function( err, course ) {
        if (err)
          res.status(500).send('Could not update course');
        else {
          res.json(course.toJSON());
        }
      });
    } else {
      res.status(403).send('Not permitted to remove learner from course');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// GET /courses/:course/learners
// get a list of the learners enrolled in a course
export function getLearners(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canViewLearnerList( req.course )) {
      courseModel.findOne( { _id: req.course._id },
                           function( err, course ) {
                             if (err)
                               res.status(500).send('Error finding course');
                             else {
                               if (course)
                                 res.json(course.learners);
                               else
                                 res.status(500).send('Could not find course');
                             }
                           });
    } else {
      res.status(403).send('Not permitted to view learners in course');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// GET /learners/:user/courses
// Get a list of all courses a learner is enrolled in
export function getLearnerCourses(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canViewLearnerCourseList( req.user )) {
      courseModel.find( { learners: req.user._id }, { },
                         function( err, courses ) {
                           if (err)
                             res.status(500).send('Error finding courses');
                           else {
                             if (courses)
                               res.json( courses.map( function(x) { return x._id; } ) );
                             else
                               res.status(500).send('Could not find courses');
                           }
                         });
    } else {
      res.status(403).send('Not permitted to view the courses for this user');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

// GET /instructors/:user/courses
// Get a list of all courses an instructor is teaching
export function getInstructorCourses(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.canViewInstructorCourseList( req.user )) {
      courseModel.find( { instructors: req.user._id }, { },
                         function( err, courses ) {
                           if (err)
                             res.status(500).send('Error finding courses');
                           else {
                             if (courses)
                               res.json( courses.map( function(x) { return x._id; } ) );
                             else
                               res.status(500).send('Could not find courses');
                           }
                         });
    } else {
      res.status(403).send('Not permitted to view the courses for this user');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}




// GET /courses/:course/progress
// get a list of scores for all the learners and worksheets
