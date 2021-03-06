const express = require('express');
const mongoose = require('mongoose');
let router = express.Router();
let Product = require('../database/product.js');
let Productimg = require('../database/productimg.js');
const BasicConfig = require('../basicconfig.js');
// 文件上传相关
const multer  = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads'); },
  filename: function (req, file, cb) { cb(null, file.originalname); }
});
var upload = multer({ storage: storage });
// 富文本编辑器上传图片
var upload_image = require("../toolfunctions/imageupload.js");
var upload_video = require("../toolfunctions/videoupload.js");

// 获取产品列表
router.post('/productlist',(req,res)=>{
	let queryp = {};
	if(req.body.searchkeywords) queryp['product_name'] = new RegExp(req.body.searchkeywords);	// 模糊查询,构建query
	new Promise((resolve,reject)=>{
		Product.countDocuments(queryp,(err,docs)=>{ // 1. 获取总数目
			if(err) reject(err);
			resolve(docs);
		});
	}).then(count => {
		let cpage = parseInt(req.body.currentpage),psize = parseInt(req.body.pagesize);
		Product.find(queryp).skip((cpage-1) * psize).limit(psize).exec((err,docs)=>{ // 2. 获取应渲染的那几个
			if(err) throw err;
			res.send({
				status: 1,
				msg: '已获取',
				allcount: count,
				products: docs
			});
		});
	}).catch( err => { throw err });
});

// 获取某一个产品详情
router.get('/product/:productid',(req,res)=>{
	let pid = req.params.productid;
	new Promise((resolve,reject)=>{
		Product.find({_id:pid},(err,docs)=>{
			if(err) reject(err);
			resolve(docs[0]);
		});
	}).then((doc)=>{
		Productimg.find({product_id:pid},(err,docs)=>{
			let a = {};
			a.product_images = docs;
			a._id = doc._id;
			a.product_price = doc.product_price;
			a.product_name = doc.product_name;
			a.product_status = doc.product_status;
			a.product_description = doc.product_description;
			res.send({
				status: 1,
				msg: "已获取",
				pdata: a
			});
		});
	}).catch((err)=>{ throw err; });
});

// 添加产品或修改产品
router.post('/addproduct', upload.array('product_images', 12), function (req, res, next) {
	// req.files 是 `product_images` 文件数组的信息; req.body 将具有文本域数据，如果存在的话
	let pdata = JSON.parse(JSON.stringify(req.body));
	delete pdata._id;
	new Promise((resolve,reject)=>{
		if(req.body._id !== 0 && req.body._id !== '0'){	// 修改
			Product.updateOne({_id: mongoose.Types.ObjectId(req.body._id)},pdata,(err,docs)=>{
				if(err){reject(err);}
				else{resolve({id:req.body._id,type:'change'});}
			});
		}else{	// 新增
			let newProduct = new Product(pdata);
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
		if(transobj.type === 'new'){ res.json({status:1,msg:'添加成功'}); }
		else if(transobj.type === 'change'){ res.json({status:1,msg:'修改成功'}); }
	}).catch((err)=>{ throw err; });
});

router.post('/uploadEditorImg',(req,res)=>{
	upload_image(req,(err,data)=>{
		if(err) return res.status(404).end(JSON.stringify(err));
		let m = getfilename(data.link);
		res.send({link:`${BasicConfig.sitehostname}/static/${m[2]}`,status:1,msg:"上传成功"});
	});
});

router.post('/uploadEditorVideo',(req,res)=>{
	upload_video(req,(err,data)=>{
		if(err) return res.status(404).end(JSON.stringify(err));
		let m = getfilename(data.link);
		res.send({link:`${BasicConfig.sitehostname}/static/${m[2]}`,status:1,msg:"上传成功"});
	});
});

function getfilename(link){
	let reg = /\/([\w]+)\/([0-9a-zA-Z\.]+)/g;
	return reg.exec(data.link);
}

function saveFiles(obj){
	if(obj.type==='change'){ // 修改
		new Promise((resolve,reject)=>{ // 先获取所有产品图片,进行一一比对
			Productimg.find({product_id:obj.pid},(err,docs)=>{
				if(err) { reject(err); }
				else if(docs.length > 0){ resolve(docs); }
				else{ reject(err); }
			});
		}).then((docs)=>{
			if(obj.fileUrl.length>0){
				if(typeof obj.fileUrl === 'string'){ //说明只有一个元素
					docs.map((item,i)=>{
						if(item._id.toString() !== obj.fileUrl.toString()){
							Productimg.deleteOne({_id:item._id},(err)=>{ if(err) throw err; });
						}
					});
				}else if(typeof obj.fileUrl === 'object'){	// 说明有多个元素,是一个数组
					docs.map((item)=>{
						let flag = true;
						obj.fileUrl.map((_item)=>{
							if(item._id.toString() === _item.toString()) flag = false;
						});
						if(flag){	// 没有匹配到,说明被删掉了,那就把这条数据删掉.
							Productimg.deleteOne({_id:item._id},(err)=>{ if(err) throw err; });
						}
					});
				}
			}else{ // 全部删光
				docs.map((item)=>{
					Productimg.deleteOne({_id:item._id},(err)=>{ if(err) throw err; });
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
			let newProductimg = new Productimg(pimgdata);
			newProductimg.save(function(err,docs){
				if(err) throw err;
			});
		});
	}
}

// 删除产品
router.post('/product/delete',(req,res)=>{
	let pids = req.body.pids;
	new Promise((resolve,reject)=>{	// 先删除产品,
		if(typeof pids === 'string'){
			Product.deleteOne({_id:pids},(err)=>{
				if(err) reject(err);
				resolve(pids);
			});
		}else if(typeof pids === 'object'){
			Product.deleteMany({_id:{$in:pids}},(err)=>{
				if(err) reject(err);
				resolve(pids);
			});
		}
	}).then((pids)=>{ // 再删除图片
		let condition;
		if(typeof pids === 'string') condition = {product_id:pids};
		else if(typeof pids === 'object') condition = {product_id:{$in:pids}};
		Productimg.deleteMany(condition,(err,docs)=>{
			if(err) throw err;
		});
	}).then((docs)=>{
		res.send({
			status: 1,
			msg: '删除成功!'
		});
	}).catch((err)=>{ throw err; });
});

module.exports = router;