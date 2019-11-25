const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
// let Product = require('./database/product.js');

// 连接mongoDB 数据库
mongoose.connect('mongodb://localhost/shop',{useNewUrlParser: true,useUnifiedTopology: true});


// 监听端口
const apiPort = 3001;
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

let productSchema = new mongoose.Schema({
	product_name: String,
	product_price: Number,
	product_status: Number,
	product_description: String
});

let Product = mongoose.model('Product',productSchema);

// 获取产品列表
app.get('/productlist',(req,res)=>{
	Product.find({},function(err,docs){
		if(err) throw err;
		console.log('-----------------------');
		console.log(docs);
		res.send(docs);
	})
});

// 添加产品
app.post('/addproduct',(req,res)=>{
	console.log(req.body);
	let newProduct = new Product({
		product_name: req.body.pname,
		product_price: req.body.pprice,
		product_status: req.body.status,
		product_description: req.body.pdes
	});
	
	newProduct.save(function(err){
		if(err) throw err;
	});
		
	res.end();
});

// 获取订单列表
app.get('/orderlist',(req,res)=>{
	
});

// 监听端口
app.listen(apiPort,(err)=>{
	if(err) throw err;
	
	console.log(`api listening on port [  ${apiPort} ]`);
})