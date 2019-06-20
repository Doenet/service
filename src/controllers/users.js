import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import userModel from '../models/users.js';

export function get(req, res, next) {
  userModel.findById(req.userId, function (err, user) {
    if (err) {
      res.sendStatus(500);
    } else {
      if (user) {
        delete user.password;
        res.json(user);
      } else {
        res.status(404);
      }
    }
  });    
}
  
export function put(req, res, next) {
  userModel.findById(req.userId).exec(function (err, user) {
    if (err) {
      res.status(500);
    } else {
      if (user) {
        if (req.body.name) {
          user.name = req.body.name;
        }
    
        user.save()
          .then(function() {
            res.json(user);
          })
          .catch( function(err) {
            res.status(500);
          });
      } else {
        res.status(404);
      }
    }
  });
}


export function authenticate(req, res, next) {
  /*
    userModel.findOne({email:req.body.email}, function(err, userInfo){
      if (err) {
        next(err);
      } else {
        if (bcrypt.compareSync(req.body.password, userInfo.password)) {
          const token = jwt.sign({id: userInfo._id}, req.app.get('secretKey'), { expiresIn: '1h' });
          userInfo['password'] = undefined;
          res.json({status:"success", message: "user found!!!", user: userInfo, token:token});
          console.log("found ",userInfo);
        } else {
          res.status(401).json({status:"error", msgs: "Invalid credentials"});
        }
      }
    });
  */
}




