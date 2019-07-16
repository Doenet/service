import { model, Schema } from 'mongoose';

const StatementSchema = new Schema({
  worksheet: {
    type: String,
    required: true,
    index: true,
  },
  
  // The specification would require us to use an "Inverse Functional
  // Identifier" for doenet; the only IFI we would be using would have
  // its "homePage" pointing to us anyway
  actor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  ////////////////////////////////////////////////////////////////
  // Below is the xAPI specification of a Statement, minus "actor"

  verb: { type: Object,
          required: true },

  object: { type: Object,
            required: true },
  
  result: { type: Object },
  context: { type: Object },

  // this is a client-reported timestamp; an LRS SHOULD* NOT reject a
  // timestamp for having a greater value than the current time, to
  // prevent issues due to clock errors.  So we'll accept whatever the
  // provider provides
  timestamp: { type: Date },

  // we're not storing authority
  //// authority: { type: Object },

  // we're not permitting attachments
  //// attachments: { type: [Object] },
  
}, { timestamps: { createdAt: 'stored', updatedAt: null } });

StatementSchema.index( { "worksheet": 1 } );

// the "id" is a UUID assigned by LRS if not set by the Learning
// Record Provider; doenet does not permit providers to provide an id
StatementSchema.set('toJSON', {
     transform: function (doc, ret, options) {
         ret.id = ret._id;
         delete ret._id;
         delete ret.__v;
     }
});

export default model('Statement', StatementSchema);
