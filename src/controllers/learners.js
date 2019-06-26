import userModel from '../models/users';
import progressModel from '../models/progress';

function getWorksheet( req ) {
  var worksheet = req.get('Referer');

  return worksheet;
}

export function getProgress(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView( req.user )) {
        var worksheet = getWorksheet( req );
        var query = { user: req.user._id, worksheet: worksheet };
                             
        progressModel.findOne(query).exec( function(err, progress) {
          if (err)
            return res.status(500).send('Error saving progress');
          else {
            return res.json(progress);
          }
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
      if (req.jwt.user.canPutProgress( req.user )) {
        var worksheet = getWorksheet( req );        

        var query = { user: req.user._id, worksheet: worksheet };
        var score = req.body.score;
                             
        progressModel.findOneAndUpdate(query, { $set: { score: score } }, { upsert: true }, function(err, progress) {
          if (err)
            return res.status(500).send('Error saving progress');
          else {
            return res.json({score: score});
          }
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
