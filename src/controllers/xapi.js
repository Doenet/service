import userModel from '../models/users';
import statementModel from '../models/statements';

export function postStatement(req, res, next) {
  if (!req.user) {
    res.status(404).send('User not found');
    return;
  }

  if (!req.jwt || !req.jwt.user) {
    res.status(401).send('Unauthenticated');
    return;
  }

  if (!req.jwt.user.canPostStatement(req.user)) {
    res.status(403).send('Not permitted to post an xAPI statement');
    return;
  }

  const params = { worksheet: req.worksheet._id };

  params.actor = req.user._id;

  if (req.body.object) {
    params.object = req.body.object;
  }

  if (req.body.verb) {
    params.verb = req.body.verb;
  }

  if (req.body.result) {
    params.result = req.body.result;
  }

  if (req.body.context) {
    params.context = req.body.context;
  }

  if (req.body.timestamp) {
    params.timestamp = req.body.timestamp;
  }

  const statement = new statementModel(params);

  statement.save((err) => {
    if (err) {
      return res.status(500).send('Error saving xAPI statement');
    }
    return res.json(statement.toJSON());
  });
}

export function getStatement(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.params.statement) {
      statementModel.findById(req.params.statement, (err, statement) => {
        if (err) {
          res.status(500).send('Error searching for statement');
        } else if (statement) {
          if (req.jwt.user.canViewStatement(statement)) {
            res.json(statement.toJSON());
          } else {
            res.status(403).send('Not permitted to view statement');
          }
        } else {
          res.status(404).send('Statement not found');
        }
      });
    } else {
      res.status(500).send('Missing statement id');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

export function getRecentStatements(req, res, next) {
  if (req.jwt && req.jwt.user) {
    const query = { actor: req.user._id };

    statementModel.find(query).sort({ _id: -1 }).limit(10).exec((err, statements) => {
      if (err) {
        res.status(500).send('Error searching for recent statements');
      } else if (statements.every((statement) => req.jwt.user.canViewStatement(statement))) {
        res.json(statements.map((statement) => statement.toJSON()));
      } else {
        res.status(403).send('Not permitted to view recent statements');
      }
    });
  } else {
    res.status(401).send('Unauthenticated');
  }
}
