exports.module = {
	name: "gbotlib",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

global.time_now = function(){ return Math.floor(Date.now() / 1000); }
global.discordsettings = require("../data/discord.json");
global.dsettings = discordsettings.settings;
global.fs = require("fs");
global.developers = ["80031146431225856"];
global.libtext = require("../data/texts.json");
global.discordbot = {
	use: "bot",
	name: "dbot"
};
global.s = {};
global.bot = null;
global.sql = null;
global.peSettings = {waitTime: 2000, args: {execArgv: ["--max-old-space-size=6"], silent: true}};
global._s = {};
global.exec = require('child_process').exec;
global.usercache = require("../data/usercache.json");
global.ModerationMessageCache = require("../data/modmsgcache.json");
global.GuildRecentActions = {};
global.Timestamp = require('timestring');
global.ActionQueue = require("../data/actionqueue.json");
global.ActionCallbacks = {};
global.Enum = {};
Enum.Actions =  {
	nothing: 0,
	warn: 1,
	mute: 2,
	kick: 3,
	ban: 4,
	delete: 5,
	reply: 6,
	deletereply: 7
}

// Function callback, Time To Call Back, Object data
global.QueueAction = (callback, ttcb, data)=>{
	ActionQueue.push({
		name: callback,
		data: data,
		when: ttcb + time_now(),
		completed: false
	});
}

global.libfunc = {};

exports.module.preinit = ()=>{
	global.commandVerify = commandPreCheck;
}

exports.module.init = ()=>{
	bot = modules["discordbot"].bots["bot"];
	sql = modules["sqldb"];

	discordbot.check = commandVerify;

	setInterval(()=>{
		for(var i in ActionQueue)
		{
			if(time_now() < ActionQueue[i].when){
				continue;
			}
			var a = ActionQueue[i];
			if(ActionCallbacks[a.name] !== undefined){
				var data = a.data;
				ActionCallbacks[a.name](data);
			}
			ActionQueue.splice(i, 1);
		}
	}, 250);
}

// Saving loop
setInterval(()=>{
	fs.writeFileSync("./data/modmsgcache.json", JSON.stringify(ModerationMessageCache));
	fs.writeFileSync("./data/usercache.json", JSON.stringify(usercache));
	fs.writeFileSync("./data/actionqueue.json", JSON.stringify(ActionQueue));
}, 120000);

process.on("exit", ()=>{
	fs.writeFileSync("./data/modmsgcache.json", JSON.stringify(ModerationMessageCache));
	fs.writeFileSync("./data/usercache.json", JSON.stringify(usercache));
	fs.writeFileSync("./data/actionqueue.json", JSON.stringify(ActionQueue));
});

/*
	Spam checks + Command Disabling
*/
var usercmds = {};
var timeout = {};
function commandPreCheck(m,c,dUse)
{
	if(developers.indexOf(m.author.id) > -1){
		return true;
	}
	var guild = m.channel.guild;
	if(m.channel.guild != undefined)
	{
		var settings = undefined;
		if(_s[m.channel.guild.id] !== undefined)
		{
			settings = _s[m.channel.guild.id].settings || false;
		}
		var user = m.author;
		if(settings !== false && settings !== undefined){ 
			if(settings.c != undefined){
				if(settings.c.indexOf(m.channel.id) > -1 && (user.id !== guild.ownerID && hasDiscordPerm(m.member, "manageMessages") === false)){
					return false;
				}
			}
			if(settings.commands !== undefined){
				if(settings.commands[c] === false){
					return false;
				}
			}
		}
	}
	if(timeout[m.author.id] != undefined && time_now() <= timeout[m.author.id]){
		return false;
	}
	if(usercmds[m.author.id] == undefined){
		usercmds[m.author.id] = 0;
	}
	
	if(usercmds[m.author.id] > 3){
		timeout[m.author.id] = time_now()+15;
		bot.reply(m, "You need to calm down. Don't spam the bot. **Wait 15 seconds**");
		return false;
	}
	


	usercmds[m.author.id]++;
	setTimeout(function(){
		usercmds[m.author.id]--;
	}, 10000);
	
	return true;
}

global.dPerm = (user, perm)=>
{
	if(user == undefined){
		return false;
	}
	var p = user.permission.json;
	if(p[perm] !== undefined && p[perm] === true){
		return true;
	} 
	return false;
}
global.hasDiscordPerm = dPerm;

global.randint=(a)=>
{
	return Math.floor((Math.random() * a) + 1);
}

/* get formatted user */
global.userFormatted = function(uid)
{
	var userm = bot.users.find(g=>g.id == uid);
	if(userm == null){
		if(usercache[uid] !== undefined){
			return usercache[uid];
		}
		return "Missing user";
	} else {
		return userm.username.replace(/`/g, "\`") +"#"+userm.discriminator;
	}
	return "Missing";
}

process.on('uncaughtException', function (err) {
	if(sql == null){
		throw err;
		return;
	}
	sql.logErrorRaw(err);
})

// Gets list of channel IDs from string.
libfunc.parseChannel = (str)=>{
	var reg = new RegExp(/([0-9]{19,21})/);
}