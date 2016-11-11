var fs = require("fs");
exports.module = {
	name: "discordbot",
	requires: [],
	libraries: ["eris"],
	failed: false
};

global.shard = false;
exports.bots = {};
exports.hooks = [];
exports.prefixes = [];

exports.mainbot = null;
function out(c,m){
	if(exports.mainbot == null || exports.bots[exports.mainbot] == undefined){
		console.log(m);	
	} else {
		exports.msg(exports.mainbot, c, m);
	}
}

// Handles new messages.
// Bot Name, Username, User ID, Channel ID, Message, Raw Event.
exports.handleMessage = function(b, m){
	for(var bot in exports.bots){
		if(exports.bots[bot].user.id == m.author.id){
			return;
		}
	}
	
	var is_command = false;
	var ran = false;
	try {
		if(m.author.bot === false){
			for(var i in exports.prefixes){
				if(exports.prefixes[i].discord.use == b){
					var p = m.content.substring(0, exports.prefixes[i].prefix.length);
					if(p === exports.prefixes[i].prefix){
						var cmds = m.content.substring(p.length).split(" ");
						var excmd = cmds[0];
						for(var h in exports.hooks){
							if(ran){ break; }
							if(exports.prefixes[i].discord.name == exports.hooks[h].discord.name && exports.hooks[h].command.toLowerCase() == excmd.toLowerCase()){
								if(exports.prefixes[i].discord.check != undefined){
									if(exports.prefixes[i].discord.check(m, excmd, exports.prefixes[i].discord) !== true){
										return;
									}
								}
								if(exports.hooks[h].v === 1){
									is_command = true;
									ran = true;
									exports.hooks[h].callback(m, exports.hooks[h].command);
									break;
								} else if(exports.hooks[h].v === 2){
									is_command = true;
									ran = true;
									exports.hooks[h].callback(m, m.content.substring(p.length+excmd.length+1));
									break;
								}
							}
						}
					}
				}
			}
		}
		sql.logchat(m, function(success){
			if(!success){
				console.log("Error with SQL");	
			}
		}, 0, is_command);	
	} catch(err){
		if(m.channel.guild !== undefined){
			sql.logError(err, m, false);
		} else {
			sql.logError(err, 0, true);
		}
		
		sql.logchat(m, function(success){
			if(!success){
				console.log("Error with SQL");	
			}
		}, 1, is_command);		
	}
};

// Checks if the given m (message) has the p (prefix)
exports.checkPrefix = function(m,p){
	
};

exports.module.preinit = function(){
	sql = global.modules["sqldb"];
	
	global.discord = exports;
	// Initaite all the bots.
	var settings = require(global.directory+"data/discord.json");
	global.logging = settings.logging || false;
	exports.mainbot = settings.settings["mainbot"];
	for(var b in settings.bots){
		if(settings.bots[b].token != undefined){
			exports.initiatebot(b, settings.bots[b]);
		}
	}
};

// Hooks the specific discordhook to handle the prefix.
exports.hookprefix = function(discordhook, prefix){
	exports.prefixes.push({
		prefix: prefix,
		discord: discordhook
	})
};

// Hooks the command to the specific discordhook, requires the prefix to be called.
exports.hookcommand = function(discordhook, command, callback, settings){
	var hook = {
		discord: discordhook,
		command: command,
		callback: callback,
		v: 1 // Version of callback
	}
	if(settings !== undefined){
		if(settings.version !== undefined){
			hook.v = settings.version;
		}
	}
	exports.hooks.push(hook);
};

exports.initiatebot = function(name, settings){
	var Eris = require("eris");
	var ready = false;
	exports.bots[name] = new Eris(settings.token, {}, {
		description: "GalacticBot created by Toothless The Dragon#9997",
		owner: "Toothless The Dragon#9997",
		prefix: "-"
	});
	exports.bots[name].on("messageCreate", function(message) {
		if(!ready){return;}
		exports.handleMessage(name, message);
	});

	exports.bots[name].on("disconnect", function(message) {
		console.log("Disconnected");
	});

	exports.bots[name].on("ready", function(message) {
		setTimeout(function(){ready = true;}, 500);
	});

	exports.bots[name].on("messageUpdated", (msg, editedmsg) => {
		if(sql.logchatedit !== undefined){
			sql.logchatedit(msg, editedmsg, ()=>{

			});
		}
	})
	
	exports.bots[name].reply = (message, str)=>{
		var n = message.author.username;
		if(message.member !== undefined && message.member.nick !== null){
			n = message.member.nick;
		}
		
		return new Promise(function(resolve, reject){
			exports.bots[name].createMessage(message.channel.id, "**"+n+"** "+str).then(function(msg){
				resolve(msg);
			},
			function(err){
				reject(err);
			});
		});
	}
	
	exports.bots[name].sendDM = (author, str)=>{
		exports.bots[name].getDMChannel(author.id).then((pch)=>{
			exports.bots[name].createMessage(pch.id, str);
		});
	}
	
	exports.bots[name].on("error", function(err, id) {
		console.log("Error with bot, Shard ID "+id);
		console.log(err.stack);
	});

	global.dbot = exports.bots[name];
	exports.bots[name].connect();
};

exports.module.init = function(){

};

exports.module.close = function(){
	for(var i in exports.bots){
		exports.bots[i].disconnect();	
	}
	console.log("\nClosing discord.");	
};
		
// The event, the type. 0 = discord.js, 1 = discord.io
function convertEvent(msgevent, type){
	if(type == 0){ return msgevent; }
	else { return null; }
}
