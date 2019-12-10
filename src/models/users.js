import { model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

const UserSchema = new Schema({
  // this name is purely for decorative purposes, e.g., in a gradebook
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },

  // a base64-encoded jpeg image
  jpegPhotograph: {
    type: String,
    maxlength: 65536,
  },

  // the email is also the username, but not required because guests don't have an email
  email: {
    type: String,
    trim: true,
    // required: true,
    // unique: true
  },

  guest: {
    type: Boolean,
    default: false,
  },

  isInstructor: {
    type: Boolean,
    default: false,
  },

  gdprConsent: {
    type: Boolean,
    default: false,
  },

  gdprConsentDate: {
    type: Date,
  },

  /*
  instructorFor: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],

  learnerIn: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  */

  password: {
    type: String,
    trim: true,
    // not `required: true` because guest users don't have passwords.
  },
}, { timestamps: true });

// because we permit user look-ups based on email
UserSchema.index({ email: 1 });

// hash user password before database save
UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (this.password) {
    this.password = bcrypt.hashSync(this.password, saltRounds);
  }

  return next();
});


UserSchema.methods.canView = function (anotherUser) {
  if (this._id.equals(anotherUser._id)) return true;

  return false;
};

UserSchema.methods.canViewLearnerCourseList = UserSchema.methods.canView;
UserSchema.methods.canViewState = UserSchema.methods.canView;
UserSchema.methods.canPatchState = UserSchema.methods.canView;

UserSchema.methods.canEdit = function (anotherUser) {
  if (this._id.equals(anotherUser._id)) return true;

  return false;
};

function yes() { return true; }
UserSchema.methods.canCreateCourses = yes;
UserSchema.methods.canViewCourse = yes;
UserSchema.methods.canViewInstructorList = yes;
UserSchema.methods.canViewInstructorCourseList = yes;

UserSchema.methods.isInstructorFor = function (course) {
  return course.instructors.indexOf(this.id) >= 0;
};

UserSchema.methods.canUpdateCourse = UserSchema.methods.isInstructorFor;
UserSchema.methods.canAddInstructor = UserSchema.methods.isInstructorFor;
UserSchema.methods.canViewLearnerList = UserSchema.methods.isInstructorFor;

// people can add themselves to courses, but no one else
UserSchema.methods.canAddLearner = function (course, learner) {
  // A learner can add themself to a course if it is enrollable
  if (this._id.equals(learner._id) && course.enrollable) return true;

  return false;
};

UserSchema.methods.canRemoveInstructor = function (course, instructor) {
  // Only instructors can remove instructors
  if (this.isInstructorFor(course)) {
    // Do not permit an instructor to remove the last instructor
    if (course.instructors.length === 1) return false;

    return true;
  }

  return false;
};

UserSchema.methods.canRemoveLearner = function (course, learner) {
  if (this._id.equals(learner._id)) return true;

  if (this.isInstructorFor(course)) return true;

  return false;
};

UserSchema.methods.canViewStatement = function (statement) {
  if (this._id.equals(statement.actor)) return true;

  return false;
};

UserSchema.methods.canPutProgress = UserSchema.methods.canEdit;

UserSchema.methods.canPostStatement = UserSchema.methods.canEdit;

UserSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
  },
});

export default model('User', UserSchema);
