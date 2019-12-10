import jwt from 'jsonwebtoken';
import userModel from '../models/users';

function createGuest(req, res, next) {
  // We only need a guest if we aren't logged in
  if (req.jwt) {
    next();
    return;
  }

  console.log('Creating guest!');
  const guest = new userModel({ guest: true });

  guest.save((err) => {
    if (err) res.status(500).send('Error creating guest');
    else {
      req.jwt = { user: guest };
      const token = jwt.sign({ id: req.jwt.user._id }, req.app.get('secretKey'), { expiresIn: '1y' });
      res.cookie('token', token, { maxAge: 2630000, httpOnly: true });
    }

    next();
  });
}

export default createGuest;
