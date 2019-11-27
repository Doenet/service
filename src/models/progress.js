import { model, Schema } from 'mongoose';

const ProgressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,    
    index: true,
  },

  name: {
    type: String,
    required: true,
    trim: true
  },
  
  worksheet: {
    type: String,
    required: true,
    index: true,
  },

  score: {
    type: Number,
    required: true
  }

}, { timestamps: true });

ProgressSchema.index( { "user": 1, "worksheet": 1 }, { unique: true } );

ProgressSchema.set('toJSON', {
     transform: function (doc, ret, options) {
       delete ret._id;       
       delete ret.__v;
     }
});


export default model('Progress', ProgressSchema);
