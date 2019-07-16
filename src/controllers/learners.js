import userModel from '../models/users';
import progressModel from '../models/progress';
import stateModel from '../models/state';
import statementModel from '../models/statements';

function getWorksheet( req ) {
  // FIXME: this should be more robust, using Referer AND Origin and
  // probably a param too.
  var worksheet = req.get('Referer');

  if (worksheet)
    return worksheet;

  return 'undefined';
}

function getThing(model, name, req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView( req.user )) {
        var worksheet = getWorksheet( req );
        var query = { user: req.user._id, worksheet: worksheet };
                             
        model.findOne(query).exec( function(err, thing) {
          if (err)
            return res.status(500).send('Error saving ' + name);
          else {
            if (name == 'state')
              return res.json(thing.state);
            else
              return res.json(thing);
          }
        });

      } else {
        res.status(403).send('Not permitted to view ' + name);
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
      if (req.jwt.user.canPutProgress( req.user )) {
        var worksheet = getWorksheet( req );        

        var query = { user: req.user._id, worksheet: worksheet };
        
        var setter = { };
        
        if (name == 'state')
          setter = { state: req.body };

        if (name == 'progress')
          setter = { score: req.body.score };          

        model.findOneAndUpdate(query, { $set: setter }, { upsert: true }, function(err, progress) {
          if (err)
            return res.status(500).send('Error saving ' + name);
          else {
            if (name == 'state')
              return res.json(setter.state);
            else
              return res.json(setter);
          }
        });
      } else {
        res.status(403).send('Not permitted to update ' + name);
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function getProgress(req, res, next) {
  return getThing( progressModel, 'progress', req, res, next );
}

export function putProgress(req, res, next) {
  return putThing( progressModel, 'progress', req, res, next );
}

export function getState(req, res, next) {
  return getThing( stateModel, 'state', req, res, next );
}

export function putState(req, res, next) {
  return putThing( stateModel, 'state', req, res, next );
}

export function postStatement(req, res, next) {
  if (! req.user) {
    res.status(404).send('User not found');
    return;
  }
  
  if (! req.jwt || ! req.jwt.user) {
    res.status(401).send('Unauthenticated');
    return;
  }
  
  if (! req.jwt.user.canPostStatement( req.user )) {
    res.status(403).send('Not permitted to post an xAPI statement');
    return;
  }

  var worksheet = getWorksheet( req );        

  var params = { worksheet: worksheet };
  
  params.actor = req.user._id;

  if (req.body.object) {
    params.object = req.body.object;
  }

  if (req.body.verb) {
    params.verb = req.body.verb;
  }
  
  var statement = new statementModel(params);

  statement.save(function (err) {
    console.log(err);
    if (err) {
      return res.status(500).send('Error saving statement');
    } else {
      return res.json(statement.toJSON());
    }
  });
}
