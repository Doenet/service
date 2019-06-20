import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const saltRounds = 17; // the best number

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // this name is purely for decorative purposes, e.g., in a gradebook
  name: { type: String, trim: true },

  // the email is also a username
  email: {
    type: String,
    trim: true,
    required: true,
    index: true, // because we permit user look-ups based on email
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

export default mongoose.model('User', UserSchema);
