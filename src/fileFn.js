const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const SVGO = require('svgo');

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

const svgo = new SVGO({
  plugins: [
    { cleanupAttrs: false },        // 清除换行, 结束符以及重复空格
    { removeDoctype: true },        // 删除文档声明
    { removeXMLProcInst: true },   // 删除XML处理指令
    { removeComments: true },       // 删除注释
    { removeMetadata: true },       // 删除 <metadata> 源信息
    { removeTitle: true },         // 删除<title>标题(默认禁用)
    { removeDesc: true },           // 删除<desc>描述 (默认只有desc元素无意义的时候)
    { removeUselessDefs: false },           // 删除<defs>元素如果没有id
    { removeEditorsNSData: true },         // 删除编辑器的命名空间，元素和属性
    { removeEmptyAttrs: true },            // 删除空属性
    { removeHiddenElems: true },           // 删除隐藏元素
    { removeEmptyText: true },             // 删除隐藏文本元素
    { removeEmptyContainers: true },       // 删除空的容器元素
    { removeViewBox: false },               // 如果可以，删除viewBox属性(默认进行)
    { cleanUpEnableBackground: true },     // 如果可以，删除enable-background属性
    { minifyStyles: true },                // 使用CSSO最小化元素的<style>内容
    { convertStyleToAttrs: true },         // 转换样式为属性值
    { convertColors: true },               // 转换颜色(从rgb()到#rrggbb, 从 #rrggbb到#rgb)
    { convertPathData: true },             // 将路径数据转换为的相对路径和绝对路径中简短的那一个，过滤无用的分隔符，智能四舍五入以及其他很多处理
    { convertTransform: true },            // 合并多个transforms为一个, 转换矩阵为短命名，以及其他很多处理
    { removeUnknownsAndDefaults: true },   // 删除未知的元素内容和属性，删除值为默认值的属性/li>
    { removeNonInheritableGroupAttrs: true },  // 删除不可基础组的”presentation”属性
    { removeUselessStrokeAndFill: true },      // 删除无用的stroke和fill属性
    { removeUnusedNS: true },                  // 删除没有使用的命名空间声明
    { cleanupIDs: true },                      // 删除没有使用或者压缩使用的IDs
    { cleanupNumericValues: true },            // 数值四舍五入提高精度, 删除默认的’px’单位
    { moveElemsAttrsToGroup: true },           // 移动元素属性们到外面包裹的组元素上
    { moveGroupAttrsToElems: true },           // 移动一些组属性到内容元素上
    { collapseGroups: true },                  // 合并无用的组
    { mergePaths: true },                      // 合并多个路径为一个
    { convertShapeToPath: true }               // 转换一些基本图形为路径
    // { removeRasterImages: true },              // 删除点阵图像(默认禁用)
    // { sortAttrs: true },                       // 元素属性排序使其像诗歌一样易读(默认禁用)
    // { transformsWithOnePath: true },           // 通过里面一条路径实现transforms, 真实宽度剪裁, 垂直居中对齐以及SVG缩放拉伸(默认禁用)
    // { removeDimensions: true },                // 如果viewBox就是当下尺寸限定，删除width/height属性(默认禁用)
    // { removeAttrs: true },                     // 通过正则删除属性 (默认禁用)
    // { addClassesToSVGElement: true },          // 添加类名给外面的<svg>元素 (默认禁用)
    // { removeStyleElement: true }              // 删除元素的<style> (默认禁用)
  ]
})

// 读取 svg 的内容并用 svgo 进行优化代码
function readSvg(filePath, fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, file) => {
      if (err) {
        reject({ state: 'error', result: err });
      }
      svgo.optimize(file, { path: filePath }).then((result) => {
        const r = result.data.match(/viewBox="[\s\w]+"/i);
        const n = r && r[0];
        const filterResult =
          result.data
            .replace(/<\/svg>/i, "</symbol>")
            .replace(/<svg([\w\W]*?)>/, '<symbol id="' + fileName.split('.svg')[0] + '" ' + n + ">");
        resolve(filterResult);
      });
    });
  });
}

// 整合svg图片
exports.svgoPack = (folderPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(`${basePath}/${folderPath}`, async (err, fileNameList) => {
      if (err) {
        reject({ state: 'error', result: err });
      }
      const initTemplate = `const svgMap = '<svg style="position:absolute;width:0;height:0;overflow:hidden;">{{symbols}}</svg>';document.body.insertAdjacentHTML("afterbegin", svgMap);`;
      let i = 0;
      let symbols = '';
      while (i < fileNameList.length) {
        const fileName = fileNameList[i];
        if (path.extname(fileName) === '.svg') {
          symbols += await readSvg(`${basePath}/${folderPath}/${fileName}`, fileName);
        }
        i++;
      }
      const finalFile = initTemplate.replace('{{symbols}}', symbols);
      const writeToFileResult = await writeToFile(`${basePath}/${folderPath}/iconfont.js`, finalFile);
      resolve(writeToFileResult);
    });
  });
}

// 将内容写入目标文件
function writeToFile(targetFile, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(targetFile, content, (err) => {
      if (err) {
        reject({ state: 'error', result: err });
      }
      resolve({ state: 'success', result: null });
    });
  });
}