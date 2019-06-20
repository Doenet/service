import express from 'express';
const router = express.Router();
import * as userController from './controllers/users';

// ## GET /users/:user
// 
// get information about a user
router.get('/users/:user', userController.get);

// ## PUT /users/:user
// ## PATCH /users/:user
//
// update a user.
router.put('/users/:user', userController.put);
router.patch('/users/:user', userController.put);

// ## GET /users/:user/authentication
//
// Log in as the given user.  Password is sent in the `Authorization:
// Basic` header.  Responds by setting a cookie containing a JWT.

router.get('/users/:user/authentication', userController.authenticate);

// ## POST /learners/:user/worksheets/:worksheet/statements
// ## POST /learners/:user/worksheets/:worksheet/progress

// Record a learner event (like an xAPI statement or progress).
// If no cookie is set, a set-cookie is sent for a guest user.

// ## PUT /learners/:user/worksheets/:worksheet/state
// Record the page state for the given worksheet.

// ## POST /courses/:course/learners/:user
// enroll a student in a course

// ## POST /courses/:course/instructors/:user
// add an instructor in a course

// ## DELETE /courses/:course/learners/:user
// disenroll a student from the course

// ## GET /courses/:course/learners
// get a list of learners enrolled in a course

// ## GET /courses/:course/instructors
// get a list of instructors in a course

// ## GET /courses/:course/progress
// get a list of scores for all the learners and worksheets

// ## POST /courses
// ## DELETE /courses/:course
// create or delete a course; the current user becomes an "instructor"

// ## GET /courses/:course/worksheets
// view all the assignments for the course

// ## GET /courses/:course/worksheets/:worksheet
// ## PUT /courses/:course/worksheets/:worksheet
// ## POST /courses/:course/worksheets/:worksheet
// ## DELETE /courses/:course/worksheets/:worksheet

export default router;
