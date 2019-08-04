const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  password: String,
  avatar: {
    type: String,
    default: ''
  },
  teamProjects: {
    type: Array,
    default: []
  },
  personalProjects: {
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
const UserModel = mongoose.model('user', userSchema);

module.exports = UserModel;