import { model, Schema } from 'mongoose';

const CourseSchema = new Schema({
  learners: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  instructors: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  name: {
    type: String,
    required: true,
    trim: true
  }
  
}, { timestamps: true });

CourseSchema.set('toJSON', {
     transform: function (doc, ret, options) {
         ret.id = ret._id;
         delete ret._id;
         delete ret.__v;
     }
});

export default model('Course', CourseSchema);
