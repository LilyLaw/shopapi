const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
let session = require('express-session')
let productrouter = require('./routers/product.js');
let orderrouter = require('./routers/order.js');
let User = require('./database/user.js');
let md5 = require('md5');

mongoose.connect('mongodb://localhost/shop',{useNewUrlParser: true,useUnifiedTopology: true}); // 连接mongoDB 数据库
const apiPort = 3001; // 监听端口
let app = new express(); // 实例化一个服务
app.all('*', function(req, res, next) { // 允许跨域
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "X-Requested-With");
   res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
   res.header("X-Powered-By",' 3.2.1');
   // res.header("Content-Type", "application/json;charset=utf-8");
   next();
});
app.use(bodyParser.urlencoded({ extended: false })); // 处理http解析
app.use('/static',express.static(path.join(__dirname,'uploads'))); // 访问静态资源
app.use(session({ // 使用 session 中间件
    secret : 'secret', // 对session id 相关的cookie 进行签名
    resave : true,
    saveUninitialized: false, // 是否保存未初始化的会话
    cookie : {
        maxAge : 1000 * 60 * 3, // 设置 session 的有效时间，单位毫秒
    },
}));

app.use(function(req,res,next){	// 检测登录,并对所有请求进行拦截
	console.log(req.url==='/login');
	if(req.url === '/login'){
		next();
	}else{
		console.log(req.session);
		if(req.session.username) next();
		else res.send({status:0,msg:'您尚未登录'});
	}
});

// 登录
app.post('/login',(req,res)=>{
	User.find({username:req.body.username},(err,data)=>{
		if(err) res.send({status:0,msg:'该用户不存在'});
		if(data.length===1){
			if(md5(req.body.password).toString() === data[0].password.toString()){ 	// 判断数据库中用户名密码是否正确
				req.session.username = req.body.username;
				res.send({status:1,msg:'登录成功!'});
			}else{
				res.send({status:2,msg:'密码错误!'});
			}
		}else{ res.send({status:0,msg:'该用户不存在'}); }
	});
});

// 退出
app.get('/logout',(req,res)=>{
	 req.session.username = null; // 删除session
	 res.send({status:1,msg:'已退出登录'});
});

app.use(productrouter); // 产品相关接口
app.use(orderrouter); // 订单相关接口

app.listen(apiPort,(err)=>{ // 监听端口
	if(err) throw err;
	console.log(`api listening on port [  ${apiPort} ]`);
});