import userModel from '../models/users';
import progressModel from '../models/progress';
import stateModel from '../models/state';
import statementModel from '../models/statements';

export function findWorksheet(req, res, next) {
  if (req.params.worksheet) {
    req.worksheet = { _id: req.params.worksheet };
  }

  next();
}

function getWorksheet(req) {
  // FIXME: this should be more robust, using Referer AND Origin and
  // probably another special header (X-Doenet: url) too.

  const worksheet = req.get('X-Doenet-Referer');

  console.log('worksheet=', worksheet);

  if (worksheet) return worksheet;

  return 'undefined';
}

function getThing(model, name, req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView(req.user)) {
        const query = { user: req.user._id, worksheet: req.worksheet._id };

        model.findOne(query).exec((err, thing) => {
          if (err) return res.status(500).send(`Error saving ${name}`);
          if (name == 'state') return res.json(thing.state);
          return res.json(thing.toJSON());
        });
      } else {
        res.status(403).send(`Not permitted to view ${name}`);
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function putThing(model, name, req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canPutProgress(req.user)) {
        const query = { user: req.user._id, worksheet: req.worksheet._id };

        let setter = { };

        if (name == 'state') setter = { state: req.body };

        if (name == 'progress') setter = { score: req.body.score };

        model.findOneAndUpdate(query, { $set: setter }, { upsert: true }, (err, progress) => {
          if (err) return res.status(500).send(`Error saving ${name}`);

          if (name == 'state') return res.json(setter.state);
          return res.json(progress.toJSON());
        });
      } else {
        res.status(403).send(`Not permitted to update ${name}`);
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function getProgress(req, res, next) {
  return getThing(progressModel, 'progress', req, res, next);
}

export function putProgress(req, res, next) {
  return putThing(progressModel, 'progress', req, res, next);
}

export function getState(req, res, next) {
  return getThing(stateModel, 'state', req, res, next);
}

export function putState(req, res, next) {
  return putThing(stateModel, 'state', req, res, next);
}
