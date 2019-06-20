import { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const saltRounds = 10;

const UserSchema = new Schema({
  // this name is purely for decorative purposes, e.g., in a gradebook
  name: { type: String, trim: true },

  // the email is also a username
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true    
  },

  guest: {
    type: Boolean,
    default: false
  },
  
  password: {
    type: String,
    trim: true,
    // not `required: true` because guest users don't have passwords.
  },
});

// because we permit user look-ups based on email
UserSchema.index({"email": 1});

// hash user password before database save
UserSchema.pre('save', function(next){
  if (!this.isModified('password')) {
    return next();
  }

  if (this.password) {
    this.password = bcrypt.hashSync(this.password, saltRounds);
  }

  return next();
});

export default model('User', UserSchema);
