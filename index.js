const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
let Product = require('./database/product.js');

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

// 获取产品列表
app.get('/productlist',(req,res)=>{
	Product.Product.find({},function(err,docs){
		if(err) throw err;
		res.send(docs);
	})
});

// 获取某一个产品
app.get('/product/:productid',(req,res)=>{
	let pid = req.params.productid;
	Product.Product.find({_id:pid},(err,docs)=>{
		if(err) throw err;
		res.send(docs);
	})
})

// 添加产品
app.post('/addproduct',(req,res)=>{
	let pdata = {
			product_name: req.body.pname,
			product_price: req.body.pprice,
			product_status: req.body.status,
			product_description: req.body.pdes
		};
	if(req.body.pid !== 0){	// 修改
		Product.Product.updateOne({_id:req.body.pid},pdata,(err)=>{
			if(err) throw err;
			
			res.end();
		});
	}else{	// 新增
		let newProduct = new Product.Product(pdata);
		newProduct.save(function(err){
			if(err) throw err;
			
			res.end();
		});
	}
});

// 删除产品
app.get('/product/delete/:productid',(req,res)=>{
	let pid = req.params.productid;
	if(pid){
		Product.Product.deleteOne({_id:pid},(err)=>{
			if(err) throw err;
			
			res.send({
				status: 1,
				msg: '删除成功!'
			});
		});
	}
});

// 获取订单列表
app.get('/orderlist',(req,res)=>{
	
});

// 监听端口
app.listen(apiPort,(err)=>{
	if(err) throw err;
	
	console.log(`api listening on port [  ${apiPort} ]`);
})