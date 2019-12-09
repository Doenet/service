# Doenet web services

View a live demo at https://doenet.github.io/library-demo/

## What is this?

Doenet web services powers the Doenet JavaScript library, which provides
- identity in a [FERPA](https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html)-protected manner
- progress reporting, i.e., scores for a gradebook or LMS
- [xAPI](https://xapi.com/overview/) event logging, i.e., statements stored in an LRS
- page state synchronization

This is embedded in a broader RESTful API which understands learners,
instructors, courses, assignments, etc., and which is what powers the
[Doenet Atlas](https://github.com/Doenet/atlas).

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

In production, the backend is built via a [nix
expression](https://nixos.org/) called [default.nix](./default.nix)
which uses the pinned packages in [yarn.nix](./yarn.nix); this relies
on running [yarn2nix](https://github.com/moretea/yarn2nix), specifically

```
yarn2nix > yarn.nix
```

to capture the contents of `yarn.lock` in a format suitable for Nix.
