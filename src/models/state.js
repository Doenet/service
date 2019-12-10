import { model, Schema } from 'mongoose';

const StateSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },

  worksheet: {
    type: String,
    required: true,
    index: true,
  },

  state: {
    type: String,
    // to avoid limitations on mongodb keys
    get(data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    },
    set(data) {
      return JSON.stringify(data);
    },
  },
}, { timestamps: true });

StateSchema.index({ user: 1, worksheet: 1 }, { unique: true });

export default model('State', StateSchema);
