const Router = require('koa-router');
const fs = require('fs');

const { register, getUser, updateUserMessage } = require('./src/userFn');
const {
  createFolder,
  deleteFile,
  deleteFolder,
  uploadFile,
  fileRename,
  cpFile,
  compressFiles,
  uploadHead
} = require('./src/fileFn');
const {
  createProject,
  getProject,
  getProjects,
  updateProjectMessage,
  updateProjectMessage2,
  filterProjectsIcons,
  deleteProject
} = require('./src/projectFn');

const router = new Router();

// 注册
router.post('/register', async (ctx) => {
  const { username, password } = ctx.request.body;
  const queryUser = await getUser({ username });
  if (queryUser.state === 'error') {
    if (queryUser.result === null) {
      ctx.body = await register({
        username,
        password,
        avatar: '/icon/head/initHead.jpeg'
      });
    } else {
      ctx.body = queryUser;
    }
  } else {
    ctx.body = { state: 'error', result: 'repeat' };
  }
});

// 登录
router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body;
  const queryUser = await getUser({ username });
  if (queryUser.state === 'success') {
    const queryUser = await getUser({ username, password });
    if (queryUser.state === 'success') {
      ctx.cookies.set(
        '_id',
        queryUser.result._id,
        {
          domain: 'localhost',
          maxAge: 1000 * 60 * 60 * 48,
          httpOnly: false
        }
      )
      ctx.body = queryUser;
    } else {
      ctx.body = { state: 'error', result: 'passwordError' };
    }
  } else {
    ctx.body = queryUser;
  }
});

// 更新用户信息(用户名, 密码)
router.post('/updateUserMessage', async (ctx) => {
  const { username, password } = ctx.request.body;
  const userId = ctx.cookies.get('_id');
  if (userId) {
    const isHave = await getUser({ _id: userId });
    if (isHave.state === 'success') {
      ctx.body = await updateUserMessage(userId, { username, password });
    } else {
      ctx.body = isHave;
    }
    return;
  }
  ctx.body =  { state: 'error', result: 'not online' };
});

// 判断用户是否在线或存在
router.get('/isOnLine', async (ctx) => {
  const userId = ctx.cookies.get('_id');
  if (userId) {
    ctx.body = await getUser({ _id: userId });
    return;
  }
  ctx.body = { state: 'error', result: 'not online' };
})

// 更换用户头像
router.post('/replaceAvatar', async (ctx) => {
  const { imgData, imgName } = ctx.request.body;
  const userId = ctx.cookies.get('_id');
  if (userId) {
    const replaceAvatarResult = await uploadHead(imgData, imgName);
    if (replaceAvatarResult.state === 'error') {
      ctx.body = replaceAvatarResult;
      return;
    }
    ctx.body = await updateUserMessage(userId, { avatar: `/icon/head/${imgName}` });
    return;
  }
  ctx.body = { state: 'error', result: 'not online' };
});

// 登出
router.get('/logout', async (ctx) => {
  const userId = ctx.cookies.get('_id');
  if (userId) {
    ctx.cookies.set(
      '_id',
      '',
      {
        domain: 'localhost',
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: false
      }
    );
    ctx.body = { state: 'success', result: 'logout' };
    return;
  }
  ctx.body = { state: 'error', result: 'not online' };
})

// 创建项目
router.post('/createProject', async (ctx) => {
  const { name, type, iconType } = ctx.request.body;
  const userId = ctx.cookies.get('_id');
  if (!userId) {
    ctx.body = { state: 'error', result: 'not login' };
    return;
  }
  let queryProject = null;
  if (type === 'team') {
    queryProject = await getProject({ name, type });
  } else {
    queryProject = await getProject({ userId, name, type });
  }
  if (queryProject.state === 'success') {
    ctx.body = { state: 'error', result: 'repeat' };
    return;
  }
  if (queryProject.result === null) {
    const createProjectResult = await createProject({
      userId,
      name,
      type,
      iconType,
      url: `${type}/${userId}/${name}`
    });
    ctx.body = createProjectResult;
    if (createProjectResult.state === 'success') {
      // 创建文件夹
      createFolder(`${type}/${userId}/${name}`);
      // 如果是个人(团队)项目则更新用户的个人(团队)项目
      const userMessage = await getUser({ _id: userId });
      if (type === 'personal') {
        updateUserMessage(
          userId,
          { personalProjects: [name, ...userMessage.result.personalProjects] }
        );
      } else {
        updateUserMessage(
          userId,
          { teamProjects: [name, ...userMessage.result.teamProjects] }
        );
      }
    }
  } else {
    ctx.body = queryProject;
  }
});

// 得到项目的信息
router.get('/icon/:type/:name', async (ctx) => {
  const { type, name } = ctx.params;
  const userId = ctx.cookies.get('_id');
  if (type === 'personal') {
    if (!userId) {
      ctx.body = {state: 'error', result: 'not online'};
      return;
    }
    ctx.body = await getProject({ userId, type, name });
    return;
  }
  ctx.body = await getProject({ type, name });
});

// 获取所有的团队项目的名称
router.get('/teamProjects', async (ctx) => {
  ctx.body = await getProjects({ type: 'team' }, 'name');
});

const projectIconsCache = {};

// 删除项目
router.post('/deleteProject', async (ctx) => {
  const { projectId, name, link, type } = ctx.request.body;
  const userId = ctx.cookies.get('_id');
  if (userId) {
    const projectMessage = await getProject({ _id: projectId });
    if (projectMessage.result.userId === userId) {
      const deleteResult = await deleteProject({ _id: projectId });
      ctx.body = deleteResult;
      if (deleteResult.state === 'success') {
        delete projectIconsCache[projectId];
        // 删除整个图的文件夹
        deleteFolder(link);
        const userMessage = await getUser({ _id: userId });
        if (type === 'personal') {
          // 删除用户的个人项目记录
          const newPersonalProjects =
            userMessage.result.personalProjects.filter(item => item !== name);
          updateUserMessage(
            userId,
            { personalProjects: newPersonalProjects }
          );
        } else {
          // 删除用户的团队项目记录
          const newTeamProjects =
            userMessage.result.teamProjects.filter(item => item !== name);
          updateUserMessage(
            userId,
            { teamProjects: newTeamProjects }
          );
        }
      }
      return;
    }
    ctx.body = { state: 'error', result: 'unRoot' };
    return;
  }
  ctx.body = { state: 'error', result: 'not online' };
});

// 文件上传
router.post('/uploadFiles', async (ctx) => {
  const { projectId, path } = ctx.request.body;
  const file = ctx.request.files.file;
  const fileName = file.name;
  const userId = ctx.cookies.get('_id');

  const isUserProject = await getProject({ _id: projectId, userId });
  // 用户是否具有本项目权限
  if (isUserProject.state === 'error') {
    ctx.body = isUserProject;
    return;
  }
  // 查看项目中是否存在同名文件
  if (isUserProject.result.icons.includes(fileName)) {
    ctx.body = { state: 'error', result: 'repeat' };
    return;
  }

  const uploadFileResult = await uploadFile(file, fileName, path);
  if (uploadFileResult.state === 'error') {
    ctx.body = uploadFileResult;
    return;
  }
  projectIconsCache[projectId] = projectIconsCache[projectId]
    ? [...projectIconsCache[projectId], fileName]
    : [fileName];
  const newIcons = [...new Set([...projectIconsCache[projectId], ...isUserProject.result.icons])];
  // 上传文件成功后更新相应项目中的记录
  ctx.body = await updateProjectMessage(
    projectId,
    { icons: newIcons}
  );
});

// 更改图片名称
router.post('/iconRename', async (ctx) => {
  const { projectId, path, newName, oldName } = ctx.request.body;
  const userId = ctx.cookies.get('_id');
  const isUserProject = await getProject({ _id: projectId, userId });
  // 用户是否具有本项目权限
  if (isUserProject.state === 'error') {
    ctx.body = isUserProject;
    return;
  }
  if (isUserProject.result.icons.includes(newName)) {
    ctx.body = { state: 'error', result: 'repeat' };
    return;
  }
  const renameResult = await fileRename(path, newName, oldName);
  if (renameResult.state === 'error') {
    ctx.body = renameResult;
    return;
  }
  const newIcons = isUserProject.result.icons.map(icon => {
    if (icon === oldName) {
      return newName;
    }
    return icon;
  });
  ctx.body = await updateProjectMessage(projectId, { icons: newIcons });
});

// 删除图片
router.post('/deleteIcon', async (ctx) => {
  const { iconNames, projectId, path } = ctx.request.body;
  const userId = ctx.cookies.get('_id');
  if (!userId) {
    ctx.body = { state: 'error', result: 'not online' };
    return;
  }
  const isUserProject = await getProject({ _id: projectId, userId });
  if (isUserProject.state === 'error') {
    ctx.body = isUserProject;
    return;
  }
  // 删除数据库中对应项目中的记录
  const getProjectResult = await getProject({ _id: projectId });
  if (getProjectResult.state !== 'success') {
    ctx.body = getProjectResult;
    return;
  }
  const newIcons = getProjectResult.result.icons.filter(icon => !iconNames.includes(icon));
  const updateProjectResult = await updateProjectMessage(
    projectId,
    { icons: newIcons }
  );
  ctx.body = updateProjectResult;
  // 更新成功后删除相应缓存和文件
  if (updateProjectResult.state === 'success') {
    if (Array.isArray(projectIconsCache[projectId])) {
      projectIconsCache[projectId] =
        projectIconsCache[projectId].filter(icon => !iconNames.includes(icon));
    }
    iconNames.forEach(icon => deleteFile(`${path}/${icon}`));
  }
});

// 移动图片到其它项目
router.post('/addTo', async (ctx) => {
  const { personalSelects, teamSelects, path, icons } = ctx.request.body;
  const userId = ctx.cookies.get('_id');
  if (!userId) {
    ctx.body = { state: 'error', result: 'not online' };
    return;
  }
  const responseResult = {
    personal: {},
    team: {}
  };
  // 查询个人项目中是否存在同名图片
  const personalResult = await filterProjectsIcons(
    userId,
    personalSelects,
    'personal',
    icons
  );
  // 查询团队项目中是否存在同名图片
  const teamResult = await filterProjectsIcons(
    userId,
    teamSelects,
    'team',
    icons
  );
  if (personalResult.state === 'error' || teamResult.state === 'error') {
    ctx.body = { state: 'error', result: 'server error' };
    return;
  }
  // 更新个人项目
  for (let projectName in personalResult.result) {
    const isUserProject = await getProject({
      userId,
      type: 'personal',
      name: projectName
    });
    const currentProjectResult = personalResult.result[projectName];
    const newIcons = [];
    for (let iconName in currentProjectResult) {
      if (currentProjectResult[iconName]) {
        newIcons.push(iconName);
        cpFile(iconName, path, `personal/${userId}/${projectName}`);
      }
    }
    updateProjectMessage2(
      projectName,
      'personal',
      { icons: [...newIcons, ...isUserProject.result.icons]}
    );
  }
  // 更新团队项目
  for (let projectName in teamResult.result) {
    const isUserProject = await getProject({
      userId,
      type: 'team',
      name: projectName
    });
    const currentProjectResult = teamResult.result[projectName];
    const newIcons = [];
    for (let iconName in currentProjectResult) {
      if (currentProjectResult[iconName]) {
        newIcons.push(iconName);
        cpFile(iconName, path, `team/${userId}/${projectName}`);
      }
    }
    updateProjectMessage2(
      projectName,
      'team',
      { icons: [...newIcons, ...isUserProject.result.icons]}
    );
  }
  responseResult.personal = personalResult.result;
  responseResult.team = teamResult.result;
  ctx.body = { state: 'success', result: responseResult };
});

// 下载文件
router.get('/download', async (ctx) => {
  const { path, filename } = ctx.query;
  if (path && filename) {
    const filePath = `public/icon/${path}/${filename}`;
    const file = fs.statSync(filePath);
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Disposition', `attachment;filename=${encodeURIComponent(filename)}`);
    ctx.set('Content-Length', file.size);
    ctx.body = fs.createReadStream(filePath);
    return;
  }
  ctx.body = { state: 'error', result: 'path error' };
});

// 下载整个文件夹
router.get('/batchDownload', async (ctx) => {
  const { path } = ctx.query;
  const compressFilesResult = await compressFiles(path);
  if (compressFilesResult.state === 'error') {
    ctx.body = compressFilesResult;
    return;
  }
  const filePath = compressFilesResult.result;
  const file = fs.statSync(filePath);
  ctx.set('Content-Type', 'application/octet-stream');
  ctx.set('Content-Disposition', `attachment;filename=icons.zip`);
  ctx.set('Content-Length', file.size);
  ctx.body = fs.createReadStream(filePath);
});

module.exports = router;
