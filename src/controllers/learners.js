import shajs from 'sha.js';
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

export function getProgress(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView(req.user)) {
        const query = {
          user: req.user._id,
          worksheet: req.worksheet._id,
        };

        progressModel.findOne(query).exec((err, progress) => {
          if (err) return res.status(500).send('Error fetching progress');
          if (progress) return res.json(progress.toJSON());
          return res.json({ score: 0 });
        });
      } else {
        res.status(403).send('Not permitted to view progress');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function putProgress(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canPutProgress(req.user)) {
        const query = { user: req.user._id, worksheet: req.worksheet._id };

        if (shajs('sha256').update(req.body.url).digest('hex') !== req.worksheet._id) {
          return res.status(500).send('Mismatch between hash and URL');
        }

        const setter = {
          // grades should be monotone increasing
          $max: { score: req.body.score },
          $set: {
            title: req.body.title,
            url: req.body.url,
          },
        };

        progressModel.findOneAndUpdate(query, setter,
          { upsert: true, new: true }, (err, progress) => {
            if (err) return res.status(500).send('Error saving progress');
            return res.json(progress.toJSON());
          });
      } else {
        res.status(403).send('Not permitted to update progress');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

// export function getProgress(req, res, next) {
//  return getThing(progressModel, 'progress', req, res, next);
// }

// export function putProgress(req, res, next) {
//  return putThing(progressModel, 'progress', req, res, next);
// }

export function getState(req, res, next) {
  return getThing(stateModel, 'state', req, res, next);
}

export function putState(req, res, next) {
  return putThing(stateModel, 'state', req, res, next);
}
