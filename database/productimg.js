const mongoose = require('mongoose');

let productImgSchema = new mongoose.Schema({
	product_id: Object ID,
	product_imgurl: String
});

let Productimg = mongoose.model('Productimg',productImgSchema);

module.exports = {
	Productimg
}