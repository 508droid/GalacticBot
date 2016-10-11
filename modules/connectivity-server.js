exports.module = {
	name: "connectivity-js",
	requires: ["remotes"],
	libraries: [],
	failed: false
};
global.galacticvoicediscord = {
	use: "bot"
};

var time_now = function(){ return Math.floor(Date.now() / 1000); }
var dsettings = require("../data/discord.json").settings;
var exec = require('child_process').exec;
var bot;
var serverstatus = {};
var statuschannel = null;
var ws = null;
var remote;
var server = null;
var admin = "80031146431225856";
var voicestats = {};

exports.module.preinit = function(){
	errmsg = require("../data/texts.json");
};

exports.module.init = function(){
	global.modules["discordbot"].hookprefix(global.galacticvoicediscord, "\\");
	global.modules["discordbot"].hookcommand(global.galacticvoicediscord, "setchannel", setChannel);
	global.modules["discordbot"].hookcommand(global.galacticvoicediscord, "status", status);
	global.modules["discordbot"].hookcommand(global.galacticvoicediscord, "test", doTest);
	global.modules["discordbot"].hookcommand(global.galacticvoicediscord, "npm", npmInstall);
	global.modules["discordbot"].hookcommand(global.galacticvoicediscord, "e", evaluate);

	bot = global.modules["discordbot"].bots["bot"];
	ws = global.modules["remotes"];
	//initServer();
};

exports.module.close = function()
{

}

function evaluate(m)
{
	if(dsettings.admins.indexOf(m.author.id) == -1){
		bot.reply(m, errmsg.admin_only);
		return;
	}		
	try {
		var ue = m.content.substring(3);
		var ev = eval(ue);
		if(ev !== undefined){
			bot.reply(m, "Result: "+ev);
		}
		
	} catch(err){
		if(err){
			bot.reply(m, err);
		}
	}
}

function initServer()
{
	server = ws.Server("bots", 6660, {Auth: dsettings.Auth});
	server.CreateEvent("test", function(client, data, flags){
		console.log("Event [test]: ",data)
	});

	server.CreateEvent("installnpm", function(client, data, flags){
		console.log("Event [npmi]: ", data)
	});

	server.CreateEvent("stats", function(client, data, flags){
		if(data.shard === undefined){
			return;
		}
		if(data.shard === false){
			voicestats["0"] = data;
		} else {
			voicestats[data.shard[0]] = data;
		}
	});

	server.CreateEvent("server-replication", function(client, data, flags){
		if(data.server_id == undefined){
			return;
		} else {
			if(global.s[data.server_id] !== undefined){
				var dt = {
					server_id: data.server_id,
					serverdata: global.s[data.server_id]
				}
				server.Events["server-replication"].Fire(client, dt);
			}
		}
	});

	global.setupStatisticCallback(function(){
		var stats = {
			memory: 0,
			servers: 0,
			voice: {
				connections: 0,
				queued: 0
			}
		}
		for(var i in voicestats){
			stats.memory += voicestats[i].memory;
			stats.servers += voicestats[i].servers;
			stats.voice.connections += voicestats[i].voice.connections;
			stats.voice.queued += voicestats[i].voice.queued;

		}
		
		var str = "\n\n**GalacticVoice Stats**\n"
			+"Memory usage: "+stats.memory+" MB \n"
			+"Servers: "+stats.servers+"\n"
			+"Voice Connections: "+ stats.voice.connections+"\n"
			+"Songs Queued: "+stats.voice.queued+"\n";

		return str;
	})
}

function setChannel(m)
{
	statuschannel = m.channel;
	bot.reply(m, "Set channel for status of the bot.");
}

function status(m)
{
	var c = m.content.split(" ");
	if(serverstatus[c[1]] == undefined){
		bot.reply(m, "The server was not found.");
	} else {
		var srv = serverstatus[c[1]];
		console.log(srv);
		bot.reply(m, JSON.stringify(srv));
	}
}

function npmInstall(m)
{
	if(m.author.id != admin){
		return;
	}

	var c = m.content.split(" ");
	var reg = new RegExp(/^([a-zA-Z0-9\-]*)+$/);
	if(reg.test(c[1]) == false){
		bot.reply(m, "Invalid name.");
	} else {
		server.Events["installnpm"].FireAllClients({name: c[1]});
	}
}

function doTest(m)
{
	server.Events["test"].FireAllClients("AYY LMAO", {});
}