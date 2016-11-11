exports.module = {
	name: "mysqlhook",
	requires: [],
	libraries: ["mysql"],
	failed: false
};

exports.connections = {};

exports.module.preinit = function(){
	exports.mysql = require("mysql");	
};

exports.module.init = function(){
	
};

exports.create = function(dbname, details){
	exports.connections[dbname] = exports.mysql.createPool(details); 
};