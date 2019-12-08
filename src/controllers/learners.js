import shajs from 'sha.js';
import hash from 'object-hash';
import { diff, clone, patch } from 'jsondiffpatch';
import userModel from '../models/users';
import progressModel from '../models/progress';
import stateModel from '../models/state';
import statementModel from '../models/statements';
import client from '../config/redis';

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

export function getState(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canViewState(req.user)) {
        const query = {
          user: req.user._id,
          worksheet: req.worksheet._id,
        };

        const { uuid } = req.params;
        const key = `shadow:${req.user._id}:${req.worksheet._id}:${uuid}`;

        // FIXME: the state itself could be cached in mongo
        stateModel.findOne(query).exec((err, state) => {
          if (err) return res.status(500).send('Error fetching state');
          if (state) {
            client.set(key, JSON.stringify(state.state), 'EX', 3600);
            return res.status(200).json(state.state);
          }

          client.set(key, '{}', 'EX', 3600);
          return res.status(200).json({});
        });
      } else {
        res.status(403).send('Not permitted to view state');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function patchState(req, res, next) {
  let thePatch = req.body;
  if (req.header('Content-Type') !== 'application/json') thePatch = undefined;

  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canPatchState(req.user)) {
        const query = {
          user: req.user._id,
          worksheet: req.worksheet._id,
        };
        stateModel.findOne(query).exec((err, stateObject) => {
          if (err) return res.status(500).send('Error fetching server state');

          let state;

          // State is initialized to {}
          if (stateObject === null) {
            state = {};
          } else {
            state = stateObject.state;
          }

          const { uuid } = req.params;
          const key = `shadow:${req.user._id}:${req.worksheet._id}:${uuid}`;

          client.get(key, (err, shadowJSON) => {
            if (err) return res.status(500).send('Error fetching shadow');

            if (shadowJSON) {
              const shadow = JSON.parse(shadowJSON);

              const checksum = req.header('Doenet-Shadow-Checksum');
              if (hash(shadow) !== checksum) {
                return res.status(422).send('Shadow inconsistent with provided checksum');
              }

              // Only patch if we have a patch
              if (thePatch !== undefined) {
                // update the shadow, which should not fail since we
                // verified a checksum
                try {
	          patch(shadow, thePatch);
                } catch (e) {
                  return res.status(500).send('Could not patch the server shadow');
                }
                client.set(key, JSON.stringify(shadow), 'EX', 3600);

	        // fuzzypatch the true state, which can fail
	        try {
	          patch(state, thePatch);
	        } catch (e) {
	        }

                stateObject.state = state;
                stateObject.save(() => {});
              }

              // Send the client any updates, in the form of a patch
              const delta = diff(shadow, state);

              if (delta !== undefined) {
                client.set(key, JSON.stringify(state), 'EX', 3600);
                res.set('Doenet-Shadow-Checksum', hash(shadow));
                return res.status(200).json(delta);
	      }

              // we're in sync, so send "no content"
              return res.status(204).send();
            }
            // Shadow is missing -- there isn't much we can do.
            return res.status(422).send('Missing shadow');
          });
        });
      } else {
        res.status(403).send('Not permitted to patch state');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}
