const UserModel = require('./mongo_model/UserModel');

// 新用户注册
exports.register = (message) => {
  const userMessage = new UserModel(message);
  return new Promise((resolve, reject) => {
    userMessage.save((err, data) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      resolve({ state: 'success', result: data });
    });
  });
}

// 用户查寻
exports.getUser = (query) => {
  return new Promise((resolve, reject) => {
    UserModel.findOne({ ...query }, (err, data) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      data
        ? resolve({ state: 'success', result: data })
        : resolve({ state: 'error', result: null });
    });
  });
}

// 更新用户信息
exports.updateUserMessage = (_id, query) => {
  return new Promise((resolve, reject) => {
    UserModel.findOneAndUpdate(
      { _id },
      { $set: { ...query } },
      { new: true, useFindAndModify: false },
      (err, data) => {
        if (err) {
          reject({ state: 'error', result: 'server is error' });
        }
        resolve({ state: 'success', result: data });
      }
    );
  });
}