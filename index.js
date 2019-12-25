const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
let Product = require('./database/product.js');
let Productimg = require('./database/productimg.js');

// 文件上传相关
const multer  = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads'); },
  filename: function (req, file, cb) { cb(null, file.originalname); }
});
var upload = multer({ storage: storage });

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
	new Promise((resolve,reject)=>{
		Product.Product.find({_id:pid},(err,docs)=>{
			if(err) reject(err);
			resolve(docs[0]);
		});
	}).then((doc)=>{
		Productimg.Productimg.find({product_id:pid},(err,docs)=>{
			let a = {};
			a.product_images = docs;
			a._id = doc._id;
			a.product_price = doc.product_price;
			a.product_name = doc.product_name;
			a.product_status = doc.product_status;
			a.product_description = doc.product_description;
			res.send(a);
		});
	}).catch((err)=>{
		throw err;
	})
});

// 添加产品或修改产品
app.post('/addproduct', upload.array('product_images', 12), function (req, res, next) {
	// req.files 是 `product_images` 文件数组的信息; req.body 将具有文本域数据，如果存在的话
	// console.log(req.files,req.body);
	let pdata = {
		product_name: req.body.product_name,
		product_price: req.body.product_price,
		product_status: req.body.product_status,
		product_description: req.body.product_description
	};
	
	new Promise((resolve,reject)=>{
		if(req.body._id !== 0 && req.body._id !== '0'){	// 修改
			let tmpid = mongoose.Types.ObjectId(req.body._id);
			Product.Product.updateOne({_id:tmpid},pdata,(err,docs)=>{
				if(err){reject(err);}
				else{resolve({id:tmpid,type:'change'});}
			});
		}else{	// 新增
			let newProduct = new Product.Product(pdata);
			newProduct.save(function(err,docs){
				if(err){reject(err);}
				else{resolve({id:docs._id,type:'new'});}
			});
		}
	}).then((transobj)=>{
		saveFiles({
			pid: transobj.id,
			type: transobj.type,
			filesUpload: req.files,
			fileUrl: req.body.product_images || []
		})
		if(transobj.type === 'new'){
			res.json({status:1,msg:'添加成功'});
		}else if(transobj.type === 'change'){
			res.json({status:1,msg:'修改成功'});
		}
	}).catch((err)=>{
		throw err;
	});
});

function saveFiles(obj){
	if(obj.type==='change'){ // 修改
		new Promise((resolve,reject)=>{ // 先获取所有产品图片,进行一一比对
			Productimg.Productimg.find({product_id:obj.pid},(err,docs)=>{
				if(err) { reject(err); }
				else if(docs.length > 0){ resolve(docs); }
				else{ reject(err); }
			});
		}).then((docs)=>{
			if(obj.fileUrl.length>0){
				if(typeof obj.fileUrl === 'string'){ //说明只有一个元素
					docs.map((item,i)=>{
						if(item._id.toString() !== obj.fileUrl.toString()){
							Productimg.Productimg.deleteOne({_id:item._id},(err)=>{ if(err) throw err; });
						}
					});
				}else if(typeof obj.fileUrl === 'object'){	// 说明有多个元素,是一个数组
					docs.map((item)=>{
						let flag = true;
						obj.fileUrl.map((_item)=>{
							if(item._id.toString() === _item.toString()){
								flag = false;
							}
						});
						if(flag){	// 没有匹配到,说明被删掉了,那就把这条数据删掉.
							Productimg.Productimg.deleteOne({_id:item._id},(err)=>{ if(err) throw err; });
						}
					});
				}
			}else{ // 全部删光
				docs.map((item)=>{
					Productimg.Productimg.deleteOne({_id:item._id},(err)=>{ if(err) throw err; });
				});
			}
		}).catch((err)=>{ if(err){console.log(err);}console.log('该产品原先没有图片'); });
	}
	if(obj.filesUpload.length>0){
		obj.filesUpload.map((item)=>{
			let pimgdata = {
				product_id: obj.pid,
				product_imgurl: `static/${item.originalname}`
			}
			let newProductimg = new Productimg.Productimg(pimgdata);
			newProductimg.save(function(err,docs){
				if(err) throw err;
			});
		});
	}
}

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

// 搜索产品: 产品名称
app.post('/product/search',(req,res)=>{
	let query = {};
	query['product_name'] = new RegExp(req.body.searchkeywords);	// 模糊查询,构建query
	
	Product.Product.find(query,(err,docs)=>{
		if(err) throw err;
		res.json(docs);
	})
});

// 获取订单列表
app.get('/orderlist',(req,res)=>{
	
});

// 监听端口
app.listen(apiPort,(err)=>{
	if(err) throw err;
	console.log(`api listening on port [  ${apiPort} ]`);
});