exports.module = {
	name: "galaxydb",
	requires: ["mysqlhook"],
	libraries: [],
	failed: false
};
global.galaxydiscord = {
	use: "bot",
	name: "galaxy"
};

var fs = require("fs");
var exec = require('child_process').exec;
var time_now = function(){ return Math.floor(Date.now() / 1000); }
var bot;
exports.msg = {};
exports._g = {};
exports._u = {};
var _u = null;
var _g = null;
var _s = null;

var confirmations = {};
exports.module.preinit = function(){
	var jss = require(global.directory+"data/db.json");
};

exports.module.init = function(){
	global.galaxydiscord.check = global.discordbot.check;
	bot = global.modules["discordbot"].bots["bot"];

	_s = global.modules["galaxylib"];
	_g = _s._g;
	_u = _s._u;
};

