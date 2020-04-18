import * as mongoose from 'mongoose';
import * as config from '../../config.json';

const Schema = mongoose.Schema;

export const GuildSchema = new Schema({
  _id: {
    type: String
  },
  name: {
    type: String,
    required: 'Enter guild name'
  },
  ownerId: {
    type: String,
    required: 'Enter owner id'
  },
  prefix: {
    type: String,
    default: config.prefix
  },
  language: {
    type: String,
    default: 'en-US'
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
  collection: 'guilds'
});