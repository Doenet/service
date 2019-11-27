import express from 'express';
const router = express.Router();
import * as userController from './controllers/users';
import * as learnerController from './controllers/learners';
import * as courseController from './controllers/courses';
import identity from './middleware/identity';
import createGuest from './middleware/guest';
import * as iframe from './controllers/iframe';

router.get('/iframe.html', iframe.html );
router.get('/iframe.js', iframe.js );

// ## GET /users/:user/authentication
//
// Log in as the given user.  Password is sent in the `Authorization:
// Basic` header.  Responds by setting a cookie containing a JWT.

router.get('/users/:user/token', userController.findUser, userController.token);

router.use( identity );
router.use( createGuest );

// ## GET /users/:user
// 
// get information about a user
router.get('/users/:user', userController.findUser, userController.get);

// ## PUT /users/:user
// ## PATCH /users/:user
//
// update a user.
router.put('/users/:user', userController.findUser, userController.put);
router.patch('/users/:user', userController.findUser, userController.put);

// ## PUT /learners/:user/progress
// 
// Record progress on this worksheet, as defined by the Referer header.
// 
// (Test to ensure that Origin is consistent with Referer.)

router.put('/learners/:user/progress', userController.findUser, learnerController.putProgress);
router.get('/learners/:user/progress', userController.findUser, learnerController.getProgress);

// ## POST /learners/:user/worksheets/:worksheet/statements
// ## POST /learners/:user/worksheets/:worksheet/progress

// ## POST /learners/:user/statements

router.post('/learners/:user/statements', userController.findUser, learnerController.postStatement);

// Record a learner event (like an xAPI statement or progress).
// If no cookie is set, a set-cookie is sent for a guest user.

// ## PUT /learners/:user/worksheets/:worksheet/state
// Record the page state for the given worksheet.

router.put('/learners/:user/state', userController.findUser, learnerController.putState);
router.get('/learners/:user/state', userController.findUser, learnerController.getState);

// ## POST /courses
router.post('/courses', courseController.createCourse);

// PUT /courses/:course
// PATCH /courses/:course
router.put('/courses/:course', courseController.findCourse, courseController.updateCourse);
router.patch('/courses/:course', courseController.findCourse, courseController.updateCourse);

// GET /courses/:course
router.get('/courses/:course', courseController.findCourse, courseController.getCourse);

// GET /courses/:course/learners
router.get('/courses/:course/learners',
           courseController.findCourse,
           courseController.getLearners);

// GET /courses/:course/learners
router.get('/courses/:course/instructors',
           courseController.findCourse,
           courseController.getInstructors);

// POST /courses/:course/instructors/:user
router.post('/courses/:course/instructors/:user',
            userController.findUser, courseController.findCourse,
            courseController.addInstructor);

router.delete('/courses/:course/instructors/:user',
              userController.findUser, courseController.findCourse,
              courseController.removeInstructor);

// POST /courses/:course/learners/:user
router.post('/courses/:course/learners/:user',
            userController.findUser, courseController.findCourse,
            courseController.addLearner);

router.delete('/courses/:course/learners/:user',
              userController.findUser, courseController.findCourse,
              courseController.removeLearner);

router.get('/learners/:user/courses',
            userController.findUser,
            courseController.getLearnerCourses);

router.get('/instructors/:user/courses',
            userController.findUser,
            courseController.getInstructorCourses);

export default router;
