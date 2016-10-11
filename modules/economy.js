exports.module = {
	name: "economy-module",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};
exports.discord = {
	use: "bot"
};

var aliases = {};
var admins = ["80031146431225856"];
var processes = [];
var exec = require('child_process').exec;
var bot;
var fs = require("fs");
exports.module.preinit = function(){
	
};

exports.module.init = function(){
	global.discord.hookprefix(exports.discord, "-");
	global.discord.hookcommand(exports.discord, "clean", clean);
	bot = global.modules["discordbot"].bots["bot"];
};

function clean(m)
{
	if(m.content.length <= 6){
		bot.reply(m, "Nothing to clean!");
		return;
	}
	var msg = m.content.substring(6);
	msg=msg.split(",").join("");
	bot.reply(m, "Cleaned: \n```"+msg+"```");
}

