# The RESTful API

"Progress" is a pairing between worksheets and learners.

## Users

### GET /users/:user

Get information about a user.

### PUT /users/:user
### PATCH /users/:user

update a user

### GET /users/:user/token

Log in as the given user.  Password is sent in the `Authorization:
Basic` header.  Responds by setting a cookie containing a JWT.

## Learners, progress, page state, statements

### PUT /learners/:user/worksheets/:worksheet/progress
### GET /learners/:user/worksheets/:worksheet/progress

Retrieve or record progress on this worksheet.

### GET /learners/:user/worksheets/:worksheet/state/:uuid

Fetch page state for the given worksheet; this establishes a diffsync
shadow, tied to the given uuid.

(The storage event fires when other tabs makes changes to
localStorage. This is quite handy for communication purposes.)

The server stores page state in mongo, but the shadows are stored in
redis.

### PATCH /learners/:user/worksheets/:worksheet/state/:uuid

Submit a jsondiffpatch, and receive a jsondiffpatch to apply.

The request body consists of the output of `jsondiffpatch.diff`, with
a header `Doenet-Shadow-Checksum` which is the shadow's `object-hash`.

By sending empty PATCHes, a client can poll the server for changes to
page state.  (These also serve as heartbeats.)

### POST /learners/:user/worksheets/:worksheet/statements

Record a learner event (meaning an xAPI statement) for the given
worksheet.

### GET /learners/:user/worksheets/:worksheet/statements
### GET /learners/:user/statements
### GET /statements/:id

Get a specific learner event.

### GET /learners/:user/statements/recent

Get (an unspecified number of) recent events for the given learner.

## Courses

### POST /courses
### DELETE /courses/:course
### PUT /courses/:course
### PATCH /courses/:course
### GET /courses/:course

Create or delete a course; the current user becomes an "instructor"
when creating a course.

### GET /courses/:course/instructors

Get a list of instructors in a course.

### POST /courses/:course/instructors/:user

Add an instructor in a course; only an instructor is permitted to add
other instructors.

### DELETE /courses/:course/instructors/:user

Remove an instructor from a course.

### GET /courses/:course/learners

Get a list of learners enrolled in a course.

### GET /learners/:user/courses

Get a list of all courses a learner is enrolled in.

### GET /instructors/:user/courses

Get a list of all courses an instructor is teaching.

### DELETE /courses/:course/learners/:user

Disenroll a student from the course.

### POST /courses/:course/learners/:user

Enroll a student in a course; students can enroll themselves in a course.

### GET /courses/:course/progress

Get a list of scores for all the learners and worksheets.

## Worksheets and the "gradebook"

### POST /worksheets

Create a new worksheet

### GET /courses/:course/assignments

view all the assignments for the course

### GET /courses/:course/assignments/:assignment
### PUT /courses/:course/assignments/:assignment
### POST /courses/:course/assignments/:assignment
### DELETE /courses/:course/assignments/:assignment

add or update or delete a worksheet to a course

assignments have deadlines (and exceptions)

# What is a worksheet?

A "worksheet" is identified by the base64-encoded sha-256 hash of
`window.location.href` encoded as a utf-8 string.  (Why use hashes?
Eventually, a worksheet would be the hash of the content itself -- as
loaded from say IPFS.)

# What is a learner?

A learner is a user, and it could be `me` meaning the current user
(i.e., from the cookie), could be an email address (meaning a string
containing @) which must be globally unique, or a base64 (mongo) id.

# What about people who aren't logged in?

When POSTing to `/learners/me/worksheets/:worksheet/progress`, it is
possible that there is no JWT cookie.  In this case, we manufacture a
"guest" user (with no password...) and set the cookie.

A guest user has no ability to log in (e.g., a guest has no password!)
and depends entirely on the JWT token as proof-of-identity.
