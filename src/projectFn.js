const ProjectModel = require('./mongo_model/ProjectModel');

// 新项目创建
exports.createProject = (message) => {
  const projectMessage = new ProjectModel(message);
  return new Promise((resolve, reject) => {
    projectMessage.save(async (err, data) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      resolve({ state: 'success', result: data });
    });
  });
}

// 单个项目查询
exports.getProject = (query) => {
  return new Promise((resolve, reject) => {
    ProjectModel.findOne(query, (err, data) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      data
        ? resolve({ state: 'success', result: data })
        : resolve({ state: 'error', result: null });
    });
  });
}

// 团队项目查询
exports.getProjects = (query, field) => {
  return new Promise((resolve, reject) => {
    ProjectModel.find({ ...query }, field, (err, data) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      resolve({ state: 'success', result: data});
    });
  });
}

// 更新项目信息
exports.updateProjectMessage = (_id, query) => {
  return new Promise((resolve, reject) => {
    ProjectModel.findOneAndUpdate(
      { _id },
      { $set: query },
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

// 更新项目信息
exports.updateProjectMessage2 = (projectName, type, query) => {
  return new Promise((resolve, reject) => {
    ProjectModel.findOneAndUpdate(
      { name: projectName, type },
      { $set: query },
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

const getProject = (query) => {
  return new Promise((resolve, reject) => {
    ProjectModel.findOne(query, (err, data) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      data
        ? resolve({ state: 'success', result: data })
        : resolve({ state: 'error', result: null });
    });
  });
}

// 循环查询项目中是否存在图片
exports.filterProjectsIcons = (userId, projects, type, icons) => {
  const responseResult = {};
  return new Promise((resolve, reject) => {
    if (projects.length <= 0) {
      resolve({ state: 'success', result: {} });
      return 
    }
    projects.forEach(async (project) => {
      responseResult[project] = {};
      const isUserProject = await getProject({
        userId,
        type,
        name: project
      });
      if (isUserProject.state === 'error') {
        reject(isUserProject);
      }
      icons.forEach((icon) => {
        if (isUserProject.result.icons.includes(icon)) {
          responseResult[project][icon] = false;
        } else {
          responseResult[project][icon] = true;
        }
      });
      if (Object.keys(responseResult).length === projects.length) {
        resolve({ state: 'success', result: responseResult });
      }
    });
  });
}

// 删除项目
exports.deleteProject = (query) => {
  return new Promise((resolve, reject) => {
    ProjectModel.deleteOne({ ...query }, (err) => {
      if (err) {
        reject({ state: 'error', result: err });
      }
      resolve({ state: 'success', result: 'isDelete' });
    });
  });
}