import * as mongoose from 'mongoose';

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
});