const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
  userId: String,
  name: String,
  type: String,
  iconType: String,
  url: String,
  icons: {
    type: Array,
    default: []
  }
}, {
  versionKey: false,
  timestamps: {
    createdAt: 'created',
    updatedAt: 'updated'
  }
});
const ProjectSchema = mongoose.model('icon', projectSchema);

module.exports = ProjectSchema;