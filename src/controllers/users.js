import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import userModel from '../models/users';

export function findUser( req, res, next ) {
  function handleUser ( err, user ) {
    if (err) {
      next(err);
    } else {
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(404).send('User not found');
      }
    }
  }
  
  if (req.params.user) {
    if (req.params.user == 'me') {
      // BADBAD: deal with the jwt user
      if (req.jwt && req.jwt.user) {
        req.user = req.jwt.user;
      }
      next();
    } else {
      // if we are searching by email
      if (req.params.user.indexOf('@') >= 0) {
        userModel.findOne( {email:req.params.user}, handleUser );
      } else {
        // otherwise we are searching by user id
        userModel.findById(req.params.user, handleUser );
      }
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function get(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user && !req.jwt.user.guest) {
      if (req.jwt.user.canView( req.user )) {
        res.json(req.user.toJSON());
      } else {
        res.status(403).send('Not permitted to view');
      }
    } else {
      res.status(401).send('Unauthenticated');      
    }
  } else {
    res.status(404).send('User not found');
  }
}
  
export function put(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user && !req.jwt.user.guest) {
      if (req.jwt.user.canEdit( req.user )) {
        if (req.body.firstName) {
          req.user.firstName = req.body.firstName;
        }

        if (req.body.lastName) {
          req.user.lastName = req.body.lastName;
        }

        if (req.body.jpegPhotograph) {
          req.user.jpegPhotograph = req.body.jpegPhotograph;
        }        
        
        if ('isInstructor' in req.body) {
          req.user.isInstructor = req.body.isInstructor;
        }        

        if ('gpdrConsent' in req.body) {
          if (req.body.gpdrConsent && !(req.user.gpdrConsent)) {
            req.user.gpdrConsentDate = Date.now();
          }
          
          req.user.gpdrConsent = req.body.gpdrConsent;
        }                
        
        req.user.save()
          .then(function() {
            delete req.user.password;
            res.json(req.user);
          })
          .catch( function(err) {
            res.sendStatus(500);
          });
      } else {
        res.status(403).send('Not permitted to edit');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function token(req, res, next) {
  const auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = new Buffer(auth, 'base64').toString().split(':');

  if (login != req.params.user) {
    res.sendStatus(500);
  } else {
    if (req.user && req.user.password) {
      if (bcrypt.compareSync(password, req.user.password)) {
        const token = jwt.sign({id: req.user._id}, req.app.get('secretKey'), { expiresIn: '1d' });
        delete req.user.password;
        res.cookie('token', token);
        res.json({ token: token });
      } else {
        res.status(401).send("Invalid credentials");
      }
    }
  }
}




