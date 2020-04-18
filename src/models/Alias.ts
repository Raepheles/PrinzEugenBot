import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AliasSchema = new Schema({
  name: {
    type: String,
    required: 'Enter guild name'
  },
  alias: {
    type: String,
    required: 'Enter alias name'
  },
  guildId: {
    type: String
  },
  created_date: {
    type: Date,
    default: Date.now
  },
  last_update: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'shipAliases'
}).index({ alias: 1 }, { unique: true });

export { AliasSchema };