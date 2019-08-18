const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const basePath = 'public/icon';

// 创建文件夹
exports.createFolder = (path) => {
  fs.mkdir(`./${basePath}/${path}`, { recursive: true }, (err) => {
    if (err) {
      console.log(`创建文件夹失败${err}`);
    }
  });
}

// 删除单个文件
exports.deleteFile = (path) => {
  fs.unlinkSync(`${basePath}/${path}`);
}

// 删除文件夹及所有子内容
exports.deleteFolder = (path) => {
  if (fs.existsSync(`${basePath}/${path}`)) {
    const files = fs.readdirSync(`${basePath}/${path}`);
    files.forEach((file) => {
      fs.unlinkSync(`${basePath}/${path}/${file}`);
    });
    fs.rmdir(`${basePath}/${path}`, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
}

// 上传 base64 图片
exports.uploadHead = (imgData, imgName) => {
  return new Promise((resolve, reject) => {
    const base64Data = imgData.replace(/^data:image\/\w+;base64,/, '');
    const dataBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFile(`${basePath}/head/${imgName}`, dataBuffer, (err) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      resolve({ state: 'success', result: imgName });
    });
  });
}

// 上传文件
exports.uploadFile = (file, fileName, iconPath) => {
  return new Promise((resolve, reject) => {
    const readFileStream = fs.createReadStream(file.path);
    const filePath = path.join(__dirname, `../${basePath}/${iconPath}/${fileName}`);
    const writeFileStream = fs.createWriteStream(filePath);
    readFileStream.pipe(writeFileStream);
    readFileStream.on('end', (err) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      resolve({ state: 'success', result: 'uploadSuccess'});
    });
  });
}

// 修改文件名称
exports.fileRename = (path, newName, oldName) => {
  const oldPath = `${basePath}/${path}/${oldName}`;
  const newPath = `${basePath}/${path}/${newName}`;
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        reject({ state: 'error', result: err });
      }
      resolve({ state: 'success', result: 'ok' });
    });
  });
}

// 移动文件到文件夹
exports.cpFile = (fileName, oldPath, newPath) => {
  return new Promise((resolve, reject) => {
    const sourceFile = path.join(__dirname, `../${basePath}/${oldPath}/${fileName}`);
    const targetPath = path.join(__dirname, `../${basePath}/${newPath}/${fileName}`);
    const readStream = fs.createReadStream(sourceFile);
    const writeStream = fs.createWriteStream(targetPath);
    readStream.pipe(writeStream);
    readStream.on('end', (err) => {
      if (err) {
        reject({ state: 'error', result: 'server is error' });
      }
      resolve({ state: 'success', result: 'copySuccess'});
    });
  });
}

// 压缩文件夹
exports.compressFiles = (path) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(__dirname + '/icons.zip');
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    output.on('close', () => {
      resolve({ state: 'success', result: 'src/icons.zip' });
    });
    archive.on('error', (err) => {
      reject({ state: 'error', result: err });
    });
    archive.pipe(output);
    archive.directory(`${basePath}/${path}`, false);
    archive.finalize();
  });
}
