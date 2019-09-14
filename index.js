const Koa = require('koa');
const server = require('koa-static');
const koaBody = require('koa-body');
const router = require('./router');
const { catchError } = require('./src/middlewares/index');
const app = new Koa();

app.use(catchError);

app.use(server(__dirname + '/public'));

app.use(koaBody({
  multipart: true,
  formidable: {
    maxFieldsSize: 100 * 1024 * 1024,
    maxFileSize: 100 * 1024 * 1024
  }
}));
app.use(router.routes());
app.use(router.allowedMethods());

// 连接数据库
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/icon', { useNewUrlParser: true }, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('连接数据库成功');
  }
});

app.listen(8000, () => {
  console.log('服务开启');
});