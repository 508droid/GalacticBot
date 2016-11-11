exports.module = {
	name: "galaxy-fleets",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var fs = require("fs");
var _g = null;
var _u = null;
var shiplimit = 500;
var glib = null;

exports.module.preinit = function(){

};

exports.module.init = function(){
	modules["discordbot"].hookcommand(galaxydiscord, "fleetkick", fleetkick, {version: 2});
	modules["discordbot"].hookcommand(galaxydiscord, "fundfleet", fundfleet, {version: 2});

	glib = modules.galaxylib;
	_g = glib._g;
	_u = glib._u;
};

function fleetkick(m)
{
	var d = _s.userdata(m);
	var c = m.content.split(" ");
	if(c[1] == undefined || c.length > 2){
		bot.reply(m, "Usage: $fleetinvite @user");
		return;
	}
	
	if(d.fleet == false){
		bot.reply(m, "You are not in a fleet!");
		return;
	} else if(_u.fleets[d.fleet].founder !== m.author.id){
		bot.reply(m, "You must be the fleet founder to kick someone.");
		return;
	}
	
	if(m.mentions.length == 0){
		bot.reply(m, "User not found.");
		return;
	}
	var ufleet = _u.users[m.mentions[0].id].fleet;
	if(ufleet !== d.fleet){
		bot.reply(m, "That user is not in the fleet.");
		return;
	}
	if(_u.users[m.mentions[0].id] == undefined){
		bot.reply(m, "That user has not played the game yet! Get them to do any galaxy command to get started.");
		return;
	} else {
		if(_u.users[m.mentions[0].id].fleet === d.fleet && m.mentions[0].id !== m.author.id){
			// can kick
			_u.users[m.mentions[0].id].fleet = false;
			delete _u.fleets[d.fleet].members[m.mentions[0].id];
			_s.notify(m.mentions[0].id, "You have been kicked from the **"+_u.fleets[d.fleet].name+"**");
			bot.reply(m, "Kicked user from fleet");
		} else {
			bot.reply(m, "Unable to kick user, the user is not in the fleet.");
		}
		return;
	}
}

function fundfleet(m, str)
{
	var d = _s.userdata(m);
	if(d.fleet === undefined){
		bot.reply(m, "Sorry, you are not in a fleet.");
		return;
	}
}


function allyrequest(m, str)
{
	var d = _s.userdata(m);
	if(d.fleet === undefined){
		bot.reply(m, "Sorry, you are not in a fleet.");
		return;
	}
}

function createdivision(m, str)
{
	
}

function listdivisions(m, str)
{
	
}

function removedivision(m, str)
{
	
}

function addtodivision(m, str)
{
	
}

function removefromdivision(m, str)
{
	
}