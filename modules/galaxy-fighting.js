exports.module = {
	name: "galaxy-fighting",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var fs = require("fs");
var dsettings = require("../data/discord.json").settings;
var exec = require('child_process').exec;
var time_now = function(){ return Math.floor(Date.now() / 1000); }
var bot;
var msg = {};
var sql = null;
var _g = null;
var _u = null;
var _s = null;
var confirmations = {};
exports.module.preinit = function(){

};

exports.module.init = function(){
	global.modules["discordbot"].hookcommand(global.galaxydiscord, "notifications", notifications);
	global.modules["discordbot"].hookcommand(global.galaxydiscord, "declarewar", declareWar);

	bot = global.modules["discordbot"].bots["bot"];
	_s = global.modules["galaxylib"];
	msg = _s.msg;
	_g = _s._g;
	_u = _s._u;
};

function notifications(m)
{
	var d = _s.userdata(m);
	var c = m.content.split(" ");

	if(d.notifications == undefined){
		d.notifications = false;
	}
	if(c[1].toLowerCase() == "on"){
		bot.reply(m, "Notications have been turned on!");
		d.notifications = true;
	} else if(c[1].toLowerCase() == "off"){
		bot.reply(m, "Notifications have been turned off.");
		d.notifications = false;
	}
}

function declareWar(m)
{
	var d = _s.userdata(m);
	var c = m.content.split(" ");
	if(_u.fleets[c[1]] == undefined){
		bot.reply(m, "The fleet was not found!");
		return;
	} else {
		if(d.fleet == undefined || d.fleet == false || d.fleet == null){
			bot.reply(m, "You must be in a fleet in order to declare wars.");
			return;
		}
		var mf = _u.fleets[d.fleet];
		if(d.fleet == c[1]){
			bot.reply(m, "You can't declare war on yourself.");
			return;
		}
		if(mf.founder !== m.author.id){
			bot.reply(m, "You are not the founder of your fleet.");
			return;
		}
		if(confirmations[m.author.id] == undefined || confirmations[m.author.id][0] != m.content){
			confirmations[m.author.id] = [m.content, Math.floor(Date.now() / 1000)];
			bot.reply(m, "Are you sure you want to declare war on "+_u.fleets[c[1]].name+"? There will be a 6 hour timer before you can make a move.");
			return;
		}

		if(_u.fleets[c[1]].allies.indexOf(d.fleet) > -1 || mf.allies.indexOf(c[1]) > -1){
			bot.reply(m, "You can't delcare war on allies, you have to unally them to declare war.");
			return;
		}
		if(_u.fleets[c[1]].enemies.indexOf(d.fleet) > -1 || mf.enemies.indexOf(d.fleet) > -1){
			bot.reply(m, "You are already an enemy with that fleet.");
			return;
		}
		

		bot.reply(m, "You have declared war on "+_u.fleets[c[1]].name+"! You must wait 6 hours before you're allowed attacking.");
		for(var i in _u.fleets[c[1]].members){
			_s.notify(i, mf.name +" has declared war on your fleet!");
		}
		mf.enemies.push(c[1]);
		_u.fleets[c[1]].enemies.push(d.fleet);
		_u.wartimers[d.fleet] = {[c[1]]: time_now()};

	}
}