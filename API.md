# The Javascript API

## new doenet.Worksheet() 

By default, the worksheet id is `window.location.path`. 

## new doenet.Actor( { blah blah } )
## new doenet.Verb( { blah blah } )
## new doenet.Object( { blah blah } )
## new doenet.Statement( { blah blah } )

represents various xAPI nouns.  `new doenet.Actor()` on its own is the
learner `me`.

## worksheet.recordStatement( stmt ) 

performs a cross-origin POST /learners/:user/worksheets/:worksheet/statements

## worksheet.recordProgress( progress ) 

performs a cross-origin POST /learners/:user/worksheets/:worksheet/progress

## worksheet.saveState( db )

Save `db` to the remote server.

## worksheet.fetchState()

Return a `Promise` that resolves to the previously saved `db` object.

## worksheet.watchState()

Somehow provide real-time updates?

## Example

```
let worksheet = new doenet.Worksheet();
worksheet.recordProgress(0.75);
```

# The RESTful API

"Progress" is a pairing between worksheets and learners.

## GET /users/:user

get information about a user

## PUT /users/:user
## PATCH /users/:user

update a user.

## GET /users/:user/token ![Implemented](https://img.shields.io/badge/implemented-yes-green.svg)


Log in as the given user.  Password is sent in the `Authorization:
Basic` header.  Responds by setting a cookie containing a JWT.

## POST /worksheets

Create a new worksheet

Request: HEAD, examine response code: either 404 or 200. If you need
the body, use GET.  It not available, perform a PUT or POST, the
server should respond with 204 and the Location header with the URL of
the newly created resource.

## PUT /learners/:user/progress

Record progress on this worksheet, as defined by the Referer header.

(Test to ensure that Origin is consistent with Referer.)

## GET /learners/:user/progress

Record progress on this worksheet, as defined by the Referer header.

(Test to ensure that Origin is consistent with Referer.)

## PUT /learners/:user/worksheets/:worksheet/progress

record progress on this worksheet

## PUT /learners/:user/worksheets/:worksheet/state

Record the page state for the given worksheet.

## POST /learners/:user/worksheets/:worksheet/statements

Record a learner event (meaning an xAPI statement).

If no cookie is set, a set-cookie is sent for a guest user.

## POST /courses/:course/learners/:user

enroll a student in a course

## POST /courses/:course/instructors/:user

add an instructor in a course

## DELETE /courses/:course/learners/:user

disenroll a student from the course

## GET /courses/:course/learners

get a list of learners enrolled in a course

## GET /courses/:course/instructors

get a list of instructors in a course

## GET /courses/:course/progress

get a list of scores for all the learners and worksheets

## POST /courses
## DELETE /courses/:course

create or delete a course; the current user becomes an "instructor"

## GET /courses/:course/worksheets

view all the assignments for the course

## GET /courses/:course/worksheets/:worksheet
## PUT /courses/:course/worksheets/:worksheet
## POST /courses/:course/worksheets/:worksheet
## DELETE /courses/:course/worksheets/:worksheet

add or update or delete a worksheet to a course

worksheets have deadlines (and exceptions)

# What is a worksheet?

A worksheet id `window.location.href`

The "Origin" header is also used to determine the true worksheet id.

# What is a learner?

A learner is a user, and it could be `me` meaning the current user
(i.e., from the cookie), could be an email address (meaning a string
containing @) which must be globally unique, or a base64 (mongo) id.

# What about people who aren't logged in?

When POSTing to `/learners/me/worksheets/:worksheet/progress`, it is
possible that there is no JWT cookie.  In this case, we manufacture a
"guest" user (with no password...) and set the cookie.

A guest user has no ability to log in (e.g., a guest has no password!)
and depends on the JWT token as proof-of-identity.
