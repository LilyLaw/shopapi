const mongoose = require('mongoose');

let productImgSchema = new mongoose.Schema({
	product_id: mongoose.Schema.Types.ObjectId,	// 定义一个object id 数据类型的数据
	product_imgurl: String
});

let Productimg = mongoose.model('Productimg',productImgSchema);

module.exports = Productimg;