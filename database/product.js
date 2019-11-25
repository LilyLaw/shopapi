const mongoose = require('mongoose');

let productSchema = new mongoose.Schema({
	product_name: String,
	product_price: Number,
	product_status: Number,
	product_description: String
});

let Product = mongoose.model('Product',productSchema);

module.exports = {
	Product
}