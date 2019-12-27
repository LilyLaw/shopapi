const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
let productrouter = require('./routers/product.js');
let orderrouter = require('./routers/order.js');

// 连接mongoDB 数据库
mongoose.connect('mongodb://localhost/shop',{useNewUrlParser: true,useUnifiedTopology: true});
// 监听端口
const apiPort = 3001;
// 实例化一个服务
let app = new express();
// 允许跨域
app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "X-Requested-With");
   res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
   res.header("X-Powered-By",' 3.2.1');
   res.header("Content-Type", "application/json;charset=utf-8");
   next();
});
// 处理http解析
app.use(bodyParser.urlencoded({ extended: false }));
// 访问静态资源
app.use('/static',express.static(path.join(__dirname,'uploads')));
// 产品相关接口
app.use(productrouter);
// 订单相关接口
app.use(orderrouter);

// 监听端口
app.listen(apiPort,(err)=>{
	if(err) throw err;
	console.log(`api listening on port [  ${apiPort} ]`);
});