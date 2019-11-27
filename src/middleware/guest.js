import jwt from 'jsonwebtoken';
import userModel from '../models/users';

function createGuest(req, res, next) {
  // We only need a guest if we aren't logged in
  if (req.jwt) {
    next();
    return;
  }

  var guest = new userModel({ guest: true });
  
  guest.save( function(err) {
    if (err)
      res.status(500).send('Error creating guest');
    else {
      req.jwt = { user: guest };
      const token = jwt.sign({id: req.jwt.user._id}, req.app.get('secretKey'), { expiresIn: '1h' });
      res.cookie('token', token);
    }

    next();
  });
}

export default createGuest;
