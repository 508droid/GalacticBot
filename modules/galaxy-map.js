exports.module = {
	name: "galaxy-map",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var fs = require("fs");
var dsettings = require("../data/discord.json").settings;
var exec = require('child_process').exec;
var time_now = function(){ return Math.floor(Date.now() / 1000); }
var bot;
var sql = null;
var _g = null;
var _u = null;
var gd = require('node-gd');
exports.module.preinit = function(){

};

exports.module.init = function(){
	bot = global.modules["discordbot"].bots["bot"];
	glib = modules.galaxylib;
	_g = glib._g;
	_u = glib._u;
};

function createMap(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}		
	
	generateMap();
}

function generateMap()
{
	var gd = require('node-gd');
	var img = gd.createSync(3000,3000);
	img.colorAllocate(0, 0, 0);
	var c1 = img.colorAllocate(255, 0, 0);
	for(var i in _u.colonies)
	{
		var pos = glib.Vector2(_u.colonies[i].coords);
		pos = [pos[0]+1500, pos[1]+1500];
		var pos1 = [pos[0]-1, pos[1]-1];
		var pos2 = [pos[0]+1, pos[1]+1];
		//img.setPixel(Math.floor(pos[0]), Math.floor(pos[1]), c1);
		console.log(pos, i);
		img.filledRectangle(
			parseInt(pos1[0]), 
			parseInt(pos1[1]), 
			parseInt(pos2[0]), 
			parseInt(pos2[1]), 
		c1);
	}
	
	var imgname = "map.png";
	img.savePng("/home/media/"+imgname, 1, function(err) {
	  if(err) {
		console.log(err.stack);
	  } else {

	  }
	});
	delete img;
}