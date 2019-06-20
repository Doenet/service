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
## PUT /users/:user
## PATCH /users/:user

get a user or update a user

## POST /learners/:user/worksheets/:worksheet/statements
## POST /learners/:user/worksheets/:worksheet/progress

record a learner event (like an xAPI statement or progress).

If no cookie is set, a set-cookie is sent

## PUT /learners/:user/worksheets/:worksheet/state

Record the page state for the given worksheet.

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
