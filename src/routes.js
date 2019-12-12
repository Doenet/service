import express from 'express';
import * as userController from './controllers/users';
import * as learnerController from './controllers/learners';
import * as xapiController from './controllers/xapi';
import * as courseController from './controllers/courses';
import identity from './middleware/identity';
import createGuest from './middleware/guest';
import * as iframe from './controllers/iframe';

const router = express.Router();

// ## GET /users/:user/authentication
//
// Log in as the given user.  Password is sent in the `Authorization:
// Basic` header.  Responds by returning a JWT.

router.get('/users/:user/token', userController.findUser, userController.token);

// ## GET /users/:user/authorize
//
// Log in as the given user.  Password is sent in the `Authorization:
// Basic` header.  Responds by setting a cookie containing a JWT.

router.get('/users/:user/authorize', userController.findUser, userController.authorize);

router.use(identity);
router.use(createGuest);

router.get('/iframe.html', iframe.html);
router.get('/iframe.js', iframe.js);

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

router.put('/learners/:user/worksheets/:worksheet/progress', userController.findUser, learnerController.findWorksheet, learnerController.putProgress);
router.get('/learners/:user/worksheets/:worksheet/progress', userController.findUser, learnerController.findWorksheet, learnerController.getProgress);
router.get('/learners/:user/progress', userController.findUser, learnerController.getRecentProgress);

// ## POST /learners/:user/worksheets/:worksheet/statements
// ## POST /learners/:user/worksheets/:worksheet/progress

// ## POST /learners/:user/statements
// Record a learner event (meaning an xAPI statement)

router.post('/learners/:user/worksheets/:worksheet/statements', userController.findUser, learnerController.findWorksheet, xapiController.postStatement);

// ## GET a handful of recent statements for a given learner
router.get('/learners/:user/statements', userController.findUser, xapiController.getRecentStatements);

// ## GET a single statement
router.get('/learners/:user/statements/:statement', userController.findUser, learnerController.findWorksheet, xapiController.getStatement);
router.get('/learners/:user/worksheets/:worksheet/statements/:statement', userController.findUser, learnerController.findWorksheet, xapiController.getStatement);
router.get('/statements/:statement', xapiController.getStatement);

// ## PATCH and GET /learners/:user/worksheets/:worksheet/state/:uuid
// Fetch or update the page state for the given worksheet.

router.patch('/learners/:user/worksheets/:worksheet/state/:uuid', userController.findUser, learnerController.findWorksheet, learnerController.patchState);
router.get('/learners/:user/worksheets/:worksheet/state/:uuid', userController.findUser, learnerController.findWorksheet, learnerController.getState);

// Fetch or update the page state for the given worksheet.

router.patch('/worksheets/:worksheet/state/:uuid', learnerController.findWorksheet, learnerController.patchState);
router.get('/worksheets/:worksheet/state/:uuid', learnerController.findWorksheet, learnerController.getState);

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
