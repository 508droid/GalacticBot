exports.module = {
	name: "galaxymarket",
	requires: [],
	libraries: [],
	failed: false
};

var _g = null;
var _u = null;
var glib = null;

exports.module.preinit = function(){
	
};

exports.module.init = function(){
	discord.hookcommand(galaxydiscord, "market", market, {version: 2});

	glib = modules.galaxylib;
	_g = glib._g;
	_u = glib._u;
}

function market(m, str)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, "This command is not enabled yet.");
		return;
	}

	var args = str.split(" ");
	if(args[0] == "find"){
		
	}
}