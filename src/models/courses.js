import { model, Schema } from 'mongoose';

const AssignmentSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  url: {
    type: String,
    required: true,
    trim: true,
    // unique: true, this causes trouble for the mocha tests
  },

  due: { type: Date },

  showAfter: { type: Date },

  weight: { type: Number },
});

const CourseSchema = new Schema({
  learners: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],

  instructors: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],

  assignments: [AssignmentSchema],

  // whether or not the public can enroll in the course
  enrollable: {
    type: Boolean,
    default: false,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },

}, { timestamps: true });

CourseSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;

    for (const assignment of ret.assignments) {
      assignment.id = assignment._id;
      delete assignment._id;
    }

    delete ret._id;
    delete ret.__v;
  },
});

// because we search for all instructors or learners in a course
CourseSchema.index({ instructors: 1 });
CourseSchema.index({ learners: 1 });

export default model('Course', CourseSchema);
