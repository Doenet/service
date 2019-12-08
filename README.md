# Doenet web services

## What is this?

Doenet web services powers the Doenet JavaScript library, which provides
- identity in a FERPA-protected manner
- progress reporting, i.e., scores for a gradebook or LMS
- xAPI event logging, i.e., statements stored in an LRS
- page state synchronization

This is embedded in a broader RESTful API which understands learners,
instructors, courses, assignments, etc., which is what powers the
Doenet Atlas.

## Dependencies

Besides `node` and the like, this service depends on `redis` and `mongodb`.

## Running the server

To test this in a development environment, you should create a `.env`
file for [dotenv](https://www.npmjs.com/package/dotenv).  This might
look as follows for development.

```
PORT=4000
NODE_ENV=development
        
MONGODB_DATABASE=lrs
MONGODB_PASS=thepassword
MONGODB_USER=theuser
MONGODB_HOST=localhost
MONGODB_PORT=27017

REDIS_HOST=localhost
REDIS_PORT=27017
REDIS_PASS=thepassword
SECRET=some.shared.secret
```

Look at @doenet's [devops](https://github.com/doenet/devops) repo to
see how this is deployed in a production setting with multiple VMs.

In production, the backend is built via a [https://nixos.org/](nix
expression) called [default.nix](./default.nix) which uses the pinned
packages in [yarn.nix](./yarn.nix); this relies on
[yarn2nix](https://github.com/moretea/yarn2nix).
