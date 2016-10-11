exports.module = {
	name: "galaxy-mod",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var fs = require("fs");
var dsettings = require("../data/discord.json").settings;
var exec = require('child_process').exec;
var time_now = function(){ Math.floor(Date.now() / 1000); }
var bot;
var msg = {};
var sql = null;
var _g = null;
var _u = null;
var _s = null;
exports.module.preinit = function(){

};

exports.module.init = function(){
	global.modules["discordbot"].hookcommand(global.galaxydiscord, "example", examplefunc);
	
	bot = global.modules["discordbot"].bots["bot"];
	_s = global.modules["galaxylib"];
	msg = _s.msg;
	_g = _s._g;
	_u = _s._u;
};

function examplefunc(m)
{
	bot.reply(m, "lol ok, kid.");
}