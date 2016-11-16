exports.module = {
	name: "admin-module",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var exec = require('child_process').exec;
var sql = null;
var modtypes = [null, "Banned", "Kicked", "Warned", "Muted", "Unmuted",null,null,null,null,"Unban"];
var perms = ["dj","prune","logs","commander","grant","roleadd","roleremove","ban","kick","warn","mute","unmute","moderator", "modlogs", "changemodlogs","administrator"];
var prunequeue = [];
var lastprune = {};
var emojiwarnings = {};
var sandboxes = {};
var fork = require('child_process').fork;
var customcommands = require("../data/commands.json");

exports.module.preinit = function(){
	
};

exports.module.init = function(){
	discord.hookprefix(discordbot, "-");
	discord.hookcommand(discordbot, "indexserver", indexServer, {module: "admin"});
	discord.hookcommand(discordbot, "settags", addTag, {module: "admin"});
	discord.hookcommand(discordbot, "tagserver", addTag, {module: "admin"});
	discord.hookcommand(discordbot, "mytags", listTags, {module: "admin"});
	discord.hookcommand(discordbot, "setinvite", setInvite, {module: "admin"});
	discord.hookcommand(discordbot, "cleartags", removeTags, {module: "admin"});
	discord.hookcommand(discordbot, "description", setDescription, {module: "admin"});
	discord.hookcommand(discordbot, "rtags", recommendedTags, {module: "admin"});
	discord.hookcommand(discordbot, "recommededtags", recommendedTags, {module: "admin"});
	discord.hookcommand(discordbot, "disable", disableCommand, {module: "admin"});
	discord.hookcommand(discordbot, "enable", enableCommand, {module: "admin"});
	discord.hookcommand(discordbot, "searchlogs", searchlogs, {module: "admin"});
	discord.hookcommand(discordbot, "onjoin", setJoinMessage, {module: "admin"});
	discord.hookcommand(discordbot, "onleave", setLeaveMessage, {module: "admin"});
	discord.hookcommand(discordbot, "ignorechannel", ignoreChannel, {module: "admin"});

	discord.hookcommand(discordbot, "grant", grant, {version: 2, module: "admin"});
	discord.hookcommand(discordbot, "revoke", revoke, {version: 2, module:"admin"});


	discord.hookcommand(discordbot, "hasperm", checkPerms, {version: 2, module: "admin"});
	discord.hookcommand(discordbot, "logs", setLogChannel, {version: 2, module: "admin"});
	discord.hookcommand(discordbot, "grantable", setGrantableRole, {version: 2, module: "admin"});
	discord.hookcommand(discordbot, "roleadd", grantRole, {version: 2});
	discord.hookcommand(discordbot, "ehval", evaluate, {version: 2});
	discord.hookcommand(discordbot, "settings", serverSettings, {version: 2});
	discord.hookcommand(discordbot, "pval", publicEval, {version: 2});

	// Moderation
	discord.hookcommand(discordbot, "ban", banUser, {version: 2});
	discord.hookcommand(discordbot, "kick", kickUser, {version: 2});
	discord.hookcommand(discordbot, "warn", warnUser, {version: 2});
	discord.hookcommand(discordbot, "mute", muteUser, {version: 2});
	discord.hookcommand(discordbot, "unmute", unmuteUser, {version: 2});
	discord.hookcommand(discordbot, "moderation", userModeration, {version: 2});
	discord.hookcommand(discordbot, "reason", changeReason, {version: 2});
	discord.hookcommand(discordbot, "case", modcase, {version: 2});
	discord.hookcommand(discordbot, "exportsettings", exportSettings, {version: 2});
	discord.hookcommand(discordbot, "add-domain", domainAllow, {version: 2});
	
	discord.hookcommand(discordbot, "prune", prune, {version: 2, module: "admin"});
	discord.hookcommand(discordbot, "cani", doIHavePermission, {version: 2, module: "spam"});
	discord.hookcommand(discordbot, "filter", filterSettings, {version: 2, module: "admin"});

	discord.hookcommand(discordbot, "activity", UserActivity, {version: 2, module: "admin"});
	// Ignoring commands, etc.

	bot = discord.bots["bot"];
	sql = global.modules["sqldb"];
	bot.on("guildBanAdd", EventMemberBanned);
	bot.on("guildBanRemove", OnUnbanned);
	bot.on("ready", ()=>{
		console.log("Bot is ready.");
	});

	_s = global.s;
	
	setInterval(()=>{
		fs.writeFileSync("./data/usercache.json", JSON.stringify(usercache));
	}, 180000);

	ActionCallbacks["unmute"] = EventUnmuteAction;
};

exports.module.close = function(){
	console.log("Saving user cache.");
	fs.writeFileSync("./data/usercache.json", JSON.stringify(usercache));
};

exports.module.close = function()
{

}

var msgBuffer = [];

function evaluate(m, str)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}		
	try {
		var ue = str;
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

function filterSettings(m, str)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, "This command has not yet been enabled.");
		return;
	}	
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "You are not an administrator."); return;
	}
	
	var settings = _s[m.channel.guild.id].settings;
	if(settings.filters == undefined){
		settings.filters = {};
	}
	var args = str.split(" ");
	if(str == ""){
		return bot.reply(m, "Usage:\n   -filter <filter name> <setting> <value>\n   -filter list");
	}
	var filter = args[0];
	if(filter == "list"){
		bot.reply(m, "\nHere is a list of filters names:\n"+Object.keys(MessageFilters).join(", "));
		return;
	}
	var index = args[1];
	var val = args[2];
	// Does the filter exist?
	if(MessageFilters[filter] == undefined){
		bot.reply(m, "That filter does not exist!");
		return;
	}
	if(settings.filters[filter] == undefined){
		settings.filters[filter] = MessageFilters[filter].CreateSettings();
	}
	
	if(index == "enable"){
		// Enable the filter 
		settings.filters[filter].enabled = true;
		bot.reply(m, "The filter has been enabled.");
	} else if(index == "disable"){
		// Disable the filter
		settings.filters[filter].enabled = false;
		bot.reply(m, "Disabled the filter.");
	} else if(index == "reset"){
		// Reset the settings
		settings.filters[filter] = MessageFilters[filter].CreateSettings();
		bot.reply(m, "Settings were reset to default.");
	} else if(index == "describe"){
		if(MessageFilters[filter].settings[val] == undefined){
			bot.reply(m, "Setting does not exist.");
			return;
		}
		bot.reply(m, MessageFilters[filter].settings[val]);
	} else {
		args.splice(0,2);
		MessageFilters[filter].SetOption(settings.filters[filter], index, args, m);
	}
	UpdateServerInfoAsync(m.channel.guild.id, (success)=>{

	});
}

function domainAllow(m, str)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}		
	
	var domain = str;
	sqlcon.query("select `domain` from `links` where `domain`=? and `server_id`='0' limit 1;", [domain], function(err, res){
		if(res.length == 0){
			sqlcon.query("insert into `links` (`domain`,`allowed`) values (?,1);", [domain], function(err){
				if(err){
					bot.reply(m, "Error inserting.");
				} else {
					bot.reply(m, ":ok: Successfully added the domain");
				}
			});
		} else {
			bot.reply(m, "Domain already added.");
		}
	});
}

function OnUnbanned(guild, user)
{
	var mreason = "Reason unknown";
	var modlog = {
		user: user.id, 
		staff: 0, 
		server: guild.id, 
		reason: mreason, 
		type: 10
	};
	var mlogs = [modlog];
	sql.addModerationLogs(mlogs, (success, result)=>{
		if(success){
			var logformat = libtext.logs.unban;
			var modstr = logformat.replace(/\{staff\}/g, "Unknown")
				.replace(/\{user\}/g, getFU(user.id))
				.replace(/\{reason\}/g, mreason)
				.replace(/\{caseid\}/g, result[0]);
			serverlog(guild, modstr, result[0]);
		} else {
			console.log("Error with moderation logs.");
		}
	});
}

function EventMemberBanned(guild, user)
{
	setTimeout(()=>{
		if(GuildRecentActions[guild.id] != undefined && GuildRecentActions[guild.id][user.id] !== undefined && GuildRecentActions[guild.id][user.id][0] > time_now() - 60){
			return;
		}
		var mreason = "No reason yet";
		var modlog = {
			user: user.id, 
			staff: 0, 
			server: guild.id, 
			reason: mreason, 
			type: 1
		};
		var mlogs = [modlog];
		sql.addModerationLogs(mlogs, (success, result)=>{
			if(success){
				var id = result[0];
				var modcase = mlogs[0];
				var logformat = libtext.logs.ban;
				var ModerationLog = libserver.CaseLog({
					staff: bot.user.id,
					user: mlogs[i].user,
					type: mtype,
					reason: "Unknown reason, automatically logged",
					format: logformat,
					id: id,
					length: ""
				});

				serverlog(guild, ModerationLog, id);
				
			} else {
				console.log("Error with moderation logs.");
			}
		});
	}, 10000);
}

function useSandbox(m, str)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	


}

function publicEval(m, str)
{
	var noreply = true;
	try {
		var output = "";
		var runscript = fork(__dirname+'/../pval.js', peSettings.args);
		runscript.on('message', function(r) {
			if(r.type == "command"){
				if(r.cmd == "getUser"){
					var user = bot.users.find(g=>g.id == r.args)
					runscript.send({type: "command", uid: r.uid, result: user});
				}
			} else {
				if(r.timeout){
					bot.reply(m, "Your code has timed out, its limited to "+r.ms+"ms of cpu time\nOutput: ```"+output+"```");
				} else if(r.error){
					if(output == ""){
						bot.reply(m, "Your code has errored. Output: ```"+r.err+"``` Output: ```"+output+"```");
					} else {
						bot.reply(m, "Your code has errored. Output: ```"+r.err+"``` ");
					}
				} else {
					if(output == ""){
						bot.reply(m, "Successfully ran script. Output: ```"+r.output+"```");
					} else {
						bot.reply(m, "Successfully ran script. Output: ```"+r.output+"``` Console.log output: ```"+output+"```");
					}
					
				}
				runscript.kill();
				runscript = null;
				noreply = false;
			}
		});
		runscript.stdout.on("data", (data)=>{
			output += data.toString().replace(/`/g, "\`");
		});
		runscript.on("exit", (ec)=>{
			if(noreply){
				bot.reply(m, "Your code has exited with "+ec+"\nOutput: ```"+output+"```");
			}
			delete runscript;
		});
		var auth = {
			username: m.author.username,
			id: m.author.id
		}
		runscript.send({type: "script", code: str, user: auth});
		setTimeout(()=>{
			if(noreply == true && runscript != null){
				runscript.kill();
			}
		}, peSettings.waitTime);
	} catch(err){
		console.log("Error: "+err.stack);
	}
}

function getModerationString(moderation)
{
	if(moderation.mod_type == 1){
		return libtext.logs.ban.replace(/\{staff\}/g, getFU(moderation.staff_id))
			.replace(/\{user\}/g, getFU(moderation.user_id))
			.replace(/\{reason\}/g, moderation.reason)
			.replace(/\{caseid\}/g, moderation.case_id);
	} else if(moderation.mod_type == 2){
		return libtext.logs.kick.replace(/\{staff\}/g, getFU(moderation.staff_id))
			.replace(/\{user\}/g, getFU(moderation.user_id))
			.replace(/\{reason\}/g, moderation.reason)
			.replace(/\{caseid\}/g, moderation.case_id);
	} else if(moderation.mod_type == 3){
		return libtext.logs.warn.replace(/\{staff\}/g, getFU(moderation.staff_id))
			.replace(/\{user\}/g, getFU(moderation.user_id))
			.replace(/\{reason\}/g, moderation.reason)
			.replace(/\{caseid\}/g, moderation.case_id);
	} else if(moderation.mod_type == 4){
		return libtext.logs.mute.replace(/\{staff\}/g, getFU(moderation.staff_id))
			.replace(/\{user\}/g, getFU(moderation.user_id))
			.replace(/\{reason\}/g, moderation.reason)
			.replace(/\{caseid\}/g, moderation.case_id);
	} else if(moderation.mod_type == 10){
		return libtext.logs.unban.replace(/\{staff\}/g, getFU(moderation.staff_id))
			.replace(/\{user\}/g, getFU(moderation.user_id))
			.replace(/\{reason\}/g, moderation.reason)
			.replace(/\{caseid\}/g, moderation.case_id);
	} else {
		return false;
	}
}

function changeReason(m, str)
{
	if(dPerm(m.member, "manageGuild") == false && !hasPerm(m.author, m.channel.guild, "modlogs")){
		bot.reply(m, "You are missing the `logs` bot permission, or the administrator discord permission."); return;
	}
	
	if(str == "" || str.split(" ").length <= 1){
		bot.reply(m, "Usage: -reason <case ID> <reason>");
		return;
	}
	
	var caseid = parseInt(str.split(" ")[0]);
	var reason = str.split(" ");
	reason.shift();
	reason=reason.join(" ");
	if(isNaN(caseid)){
		bot.reply(m, "Invalid case number."); return;
	}
	
	var logchannel = _s[m.channel.guild.id].settings.logchannel;

	sql.getModeration(caseid, (success, moderation)=>{
		if(!success){
			bot.reply(m, "Fetching the reason failed.");
		} else {
			if(moderation.server_id != m.channel.guild.id){
				bot.reply(m, "That case ID does not belong to this server."); return;
			} else if(moderation.staff_id != m.author.id && dPerm(m.member, "administrator") == false && !hasPerm(m.author, m.channel.guild, "changemodlogs")){
				bot.reply(m, "You are not the staff who handled that case, and you don't have permission."); return;
			}
			sql.updateModeration(caseid, reason, (success)=>{
				if(!success){
					bot.reply(m, "Failed to update case reason.");
				} else {
					if(ModerationMessageCache[moderation.case_id] !== undefined){
						moderation.reason = reason;
						var newstr = libserver.CaseLog({
							staff: moderation.staff_id,
							user: moderation.user_id,
							reason: breason,
							format: libserver.getFormat(moderation.mod_type),
							id: result[i],
							type: moderation.mod_type
						});
						if(newstr == false){ return; }
						bot.editMessage(logchannel, ModerationMessageCache[moderation.case_id], newstr);
					}
					bot.reply(m, "Successfully updated case to reason `"+reason+"`");
				}
			});
		}
	});
}

function modcase(m, str)
{
	if(dPerm(m.member, "administrator") == false && !hasPerm(m.author, m.channel.guild, "logs")){
		bot.reply(m, "You are missing the `logs` bot permission, or the administrator discord permission."); return;
	}
	
	var caseid = parseInt(str.split(" ")[0]);
	var reason = str.split(" ");
	reason.shift();
	reason=reason.join(" ");
	if(isNaN(caseid)){
		bot.reply(m, "Invalid case number."); return;
	}
	
	sql.getModeration(caseid, (success, moderation)=>{
		if(!success){
			bot.reply(m, "Fetching the reason failed.");
		} else {
			if(moderation.server_id != m.channel.guild.id){
				bot.reply(m, "That case ID does not belong to this server!"); return;
			}
			var output = ", Moderation case #"+caseid
				+"\n**Moderator**: "+getFU(moderation.staff_id) +" (User ID "+moderation.staff_id+")"
				+"\n**Moderated**: "+getFU(moderation.user_id) +" (User ID "+moderation.user_id+")"
				+"\n**Reason**: "+moderation.reason;
				
			bot.reply(m, output);
		}
	});
}

function serverSettings(m, str)
{
	var db_warn = "however, updating to the database has failed. Changes will only be temporary."
	if(dPerm(m.member, "administrator") == false && !hasPerm(m.author, m.channel.guild, "administrator")){
		bot.reply(m, "You are missing the `administrator` permission. "); return;
	}	
	var sid = m.channel.guild.id;
	var guild = m.channel.guild;
	var perm = str.split(" ")[0];
	var arg = str.split(" ")[1];
	if(perm == "list"){
		bot.reply(m, ",\nHere is a list of server settings:\n"
			+"\n**join** <formatted message> - The message to display when a user joins."
			+"\n**leave** <formatted message> - The message to display when a user leaves."
			+"\n**allow_mm** <true | false> - Wether to allow people with Manage messages permission to be allowed to use commands anywhere."
			+"\n**ignore** <#channel [,]> - Ignore channels easily."
			+"\n**loglevel** 0-2 - Set the bots logging level."
		);
	} else if(perm == "join"){
		var msg = str.substring(5);
		if(msg == "" || arg == "" || arg == undefined){
			bot.reply(m, "Usage: -settings join <formatted message | disable>\nFormatting:"
				+"\n{user} - Replaced with **user#discriminator**, no mention"
				+"\n{mention} - Replaced with a user mention"
				+"\n{members} - Replaced with amount of users in the guild."
			); return;
		}
		//-e EventMemberJoined(m.channel.guild, m.member);
		if(arg == "disable"){
			_s[sid].settings.join_message = false;
		} else {
			_s[sid].settings.join_message = msg;
		}
		
		UpdateServerInfoAsync(sid, (success)=>{
			if(success){
				bot.reply(m, "Updated the join message successfully.");
			} else {
				bot.reply(m, "Updated the join message, "+db_warn);
			}
		});
	} else if(perm == "leave"){
		var msg = str.substring(6);
		if(msg == "" || arg == "" || arg == undefined){
			bot.reply(m, "Usage: -settings leave <formatted message | disable>\nFormatting:"
				+"\n{user} - Replaced with **user#discriminator**, no mention"
				+"\n{mention} - Replaced with a user mention"
				+"\n{members} - Replaced with amount of users in the guild."
			); return;
		}
		//-e EventMemberJoined(m.channel.guild, m.member);
		if(arg == "disable"){
			_s[sid].settings.leave_message = false;
		} else {
			_s[sid].settings.leave_message = msg;
		}
		
		UpdateServerInfoAsync(sid, (success)=>{
			if(success){
				bot.reply(m, "Updated the leave message successfully.");
			} else {
				bot.reply(m, "Updated the leave message, "+db_warn);
			}
		});
	} else if(perm == "ignore"){
		var d = str.split(" ");
		if(arg == "list"){
			var list = [];
			if(_s[sid].settings.c == undefined || _s[sid].settings.c.length == 0){
				bot.reply(m, "No channels are being ignored."); return;
			}
			var cl = _s[sid].settings.c;
			for(var i in cl){
				var cc = guild.channels.get(cl[i]);
				if(cc != undefined){
					list.push("<#"+cc.id+">");
				}
			}

			bot.reply(m, "Here is a list of channels being ignored:\n"+list.join(", "));
			return;
		} else if(arg == "set"){
			d.splice(0,2);
			var channels = d;
			var list = [];
			var newignore = [];
			for(var i in channels){
				var cc = libbot.ResolveChannel(channels[i]);
				if(cc != false){
					list.push("<#"+cc.id+">");
					newignore.push(cc.id);
				}
			}

			_s[sid].settings.c = newignore;
			UpdateServerInfoAsync(sid, (success)=>{
				if(success){
					bot.reply(m, "Set channels to ignore to the following:\n"+list.join(", "));
				} else {
					bot.reply(m, "Set channels to ignore to the following:\n"+list.join(", ")+", "+db_warn);
				}
			});
		} else if(arg == "add"){
			d.splice(0,2);
			var channels = d;
			var list = [];
			for(var i in channels){
				var cc = libbot.ResolveChannel(channels[i]);
				if(cc != false){
					if(_s[sid].settings.c.indexOf(cc.id) == -1){
						list.push("<#"+cc.id+">");
						_s[sid].settings.c.push(cc.id);
					}
				}
			}

			UpdateServerInfoAsync(sid, (success)=>{
				if(success){
					bot.reply(m, "Added channels to ignore:\n"+list.join(", "));
				} else {
					bot.reply(m, "Added channels to ignore:\n"+list.join(", ")+", "+db_warn);
				}
			});
		} else if(arg == "remove"){
			d.splice(0,2);
			var channels = d;
			var list = [];
			for(var i in channels){
				var cc = libbot.ResolveChannel(channels[i]);
				if(cc != false){
					var pos = _s[sid].settings.c.indexOf(cc.id);
					if(pos > -1){
						_s[sid].settings.c.splice(pos, 1);
						list.push("<#"+cc.id+">");
					}
				}
			}

			UpdateServerInfoAsync(sid, (success)=>{
				if(success){
					bot.reply(m, "Removed channels to ignore:\n"+list.join(", "));
				} else {
					bot.reply(m, "Removed channels to ignore:\n"+list.join(", ")+", "+db_warn);
				}
			});
		} else {
			bot.reply(m, 
				"\n**Usage:**\n"
				+"\n   `-settings ignore list`\n      Will list current ignored channels."
				+"\n   `-settings ignore set #channel[, ]`\n      Sets the channels to ignore, This will reset your previous ones to these channels specifically."
				+"\n   `-settings ignore add #channel[, ]`\n      Adds new channels to ignore."
				+"\n   `-settings ignore remove #channel[, ]`\n      Removes channels to ignore."
			)
		}
	} else if(perm == "allow_mm"){
		if(arg == "off" || arg == "false"){
			_s[sid].settings["allow_mm"] = false;
			UpdateServerInfoAsync(sid, (success)=>{
				if(success){
					bot.reply(m, "Turned off allowing manage messages bypass.");
				} else {
					bot.reply(m, "Turned off allowing manage messages bypass., "+db_warn);
				}
			});
		} else if(arg == "on" || arg == "true"){
			_s[sid].settings["allow_mm"] = true;
			UpdateServerInfoAsync(sid, (success)=>{
				if(success){
					bot.reply(m, "Turned on allowing manage messages bypass.");
				} else {
					bot.reply(m, "Turned on allowing manage messages bypass., "+db_warn);
				}
			});
		}
	} else if(perm == "muted_role"){
		var role = libbot.ResolveRole(arg, m.channel.guild);
		if(role == false){
			bot.reply(m, "Could not find the role!");
		} else {
			_s[sid].settings.muted = role.id;
			UpdateServerInfoAsync(sid, (success)=>{
				if(success){
					bot.reply(m, "Successfully set the muted role.");
				} else {
					bot.reply(m, "Successfully set the muted role, "+db_warn);
				}
			});
		}
	} else if(perm == "loglevel"){
		if(isNaN(parseInt(arg)) || parseInt(arg) < 0 || parseInt(arg) > 2){
			bot.reply(m, "Please use a proper integer between 0 and 2."); return;
		} else {
			_s[sid].settings.loglevel = parseInt(arg);
			UpdateServerInfoAsync(sid, (success)=>{
				if(success){
					bot.reply(m, "Successfully set the log level to "+arg);
				} else {
					bot.reply(m, "Successfully set the log level to "+arg+", "+db_warn);
				}
			});
		}
	} else {
		bot.reply(m, "Usage:\n-settings <setting> <value>\nIf you put a setting, it most likely does not exist.");
	}
}

function UpdateServerInfoAsync(serverid, callback)
{
	var sjson = JSON.stringify(_s[serverid].settings);
	if(sjson == "{}"){
		callback(false); return;
	}
	sql.updateServerInformation(serverid, {settings: sjson}, function(success){
		callback(success);
	});
	sql.createSettingsRevision(serverid, sjson);
}

function botMuteUser(m, mreason)
{
	var user = m.author;
	var member = m.member;
	var modlog = {
		user: user.id, 
		staff: m.author.id, 
		server: m.channel.guild.id, 
		reason: mreason, 
		type: 4
	};
	var mlogs = [modlog];
	var newroles = member.roles;
	newroles.push(_s[m.channel.guild.id].settings.muted);
	QueueAction("unmute", 3600, {
		user_id: user.id,
		guild: m.channel.guild.id
	});
	bot.editGuildMember(m.channel.guild.id, user.id, {
		roles: newroles
	});

	sql.addModerationLogs(mlogs, (success, result)=>{
		if(success){
			var ModerationLog = libserver.CaseLog({
				staff: bot.user.id,
				user: user.id,
				reason: mreason,
				format: libserver.getFormat(4),
				id: result[i],
				length: "1h"
			});
			serverlog(m.channel.guild, ModerationLog, result[i]);
		}
	});
}

function EventUnmuteAction(data)
{
	/*
		{user_id, guild}
	*/
	var user = bot.users.get(data.user_id);
	var guild = bot.guilds.get(data.guild);
	if(user == undefined || guild == undefined){
		return false;
	} else {
		var member = guild.members.get(user.id);
		if(member == undefined){ return false; }
		var newroles = member.roles;
		var mutedrole = _s[guild.id].settings.muted;
		var pos = newroles.indexOf(mutedrole);
		if(pos == -1){
			return false;
		}
		newroles.splice(pos, 1);
		bot.editGuildMember(guild.id, user.id, {
			roles: newroles
		});
	}
}

function exportSettings(m, str)
{
	if(dPerm(m.member, "administrator") == false){
		bot.reply(m, "You are missing the administrator permission. "); return;
	}

	bot.reply(m, "Here are your settings: \n ```"+JSON.stringify(_s[m.channel.guild.id].settings)+" ```");
}

function userModeration(m, str)
{
	if((dPerm(m.member, "manageGuild") == false && !hasPerm(m.author, m.channel.guild, "modlogs"))  || isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "You are missing the `modlogs` permission. "); return;
	}

	var arg = str.split(" ")[0];
	var userID = "";
	if(arg == ""){
		bot.reply(m, "Usage: -moderation @user | [user_id]"); return;
	}
	if(m.mentions.length > 0){
		userID = m.mentions[0].id;
	} else {
		userID = arg;
	}

	sql.getModerationLogs(userID, (success, logs)=>{
		if(success){
			if(logs.length == 0){
				bot.reply(m, "This user has no moderation logs.");
			} else {
				var output = ", **Moderation logs**";
				var addto = [];
				var otherservers = 0;
				for(var i in logs){
					var l = logs[i];
					if(l.server_id != m.channel.guild.id && l.mod_type < 5){
						otherservers++;
					} else {
						addto.push("\n"+modtypes[l.mod_type]+" by "+getFU(logs[i].staff_id)+" reason: `"+l.reason+"`");
					}
				}
				var overlength = false;
				output += "\n"+otherservers+" action(s) from other servers.";
				for(var i in addto){
					if(output.length + addto[i].length > 1900){
						overlength = true;
					} else {
						output+=addto[i];
					}
				}
				if(overlength){
					output+="**---** Some results not shown due to length.";
				}
				bot.reply(m, output);
			}
		} else {
			bot.reply(m, "Error querying moderation logs.");
		}
	});
}

/* get formatted user */
function getFU(uid)
{
	var userm = bot.users.get(g.id);
	if(userm == null){
		if(usercache[uid] !== undefined){
			return "**"+usercache[uid]+"**";
		}
		return "Missing user";
	} else {
		return "**"+userm.username.replace(/`/g, "\`") +"#"+userm.discriminator+"**";
	}
	return "Missing";
}

function muteUser(m, str)
{
	if(dPerm(m.member, "kickMembers") == false && !hasPerm(m.author, m.channel.guild, "kick") && !hasPerm(m.author, m.channel.guild, "mute") && isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "You are missing the `kick` or `mute` permission. "); return;
	}

	if(m.mentions.length == 0 || m.mentions.length > 1){
		bot.reply(m, "Usage: -mute @user [time]; [reason]"); return;
	}
	var scc = (str.match(/\;/g) || []).length;
	var reg = new RegExp(/<@!?[0-9]{17,21}>/g);
	var reason = "";
	var mutelength = 3600;
	var mutelengthstr = "1h";
	if(scc === 0){
		reason = str.replace(reg, "");
	} else if(scc === 1){
		reason = str.replace(reg, "").split(";")[1];
		mutelength = Timestamp(str.replace(reg, "").split(";")[0]);
		mutelengthstr = str.replace(reg, "").split(";")[0];
	}

	var s = _s[m.channel.guild.id].settings;
	if(s.muted == undefined || s.muted == false){
		bot.reply(m, "No mute role was set! use `-settings muted_role [role name]`");
		return;
	}
	executeModeration(m, m.mentions, reason, 4, libtext.logs.mute, mutelength, mutelengthstr);
}

function unmuteUser(m, str)
{
	if(dPerm(m.member, "kickMembers") == false && !hasPerm(m.author, m.channel.guild, "kick") && !hasPerm(m.author, m.channel.guild, "mute") && isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "You are missing the `kick` or `mute` permission. "); return;
	}

	if(m.mentions.length == 0 || m.mentions.length > 1){
		bot.reply(m, "Usage: -unmute @user [reason]"); return;
	}

	var s = _s[m.channel.guild.id].settings;
	if(s.muted == undefined || s.muted == false){
		bot.reply(m, "No mute role was set! use `-settings muted_role [role name]`");
		return;
	}
	executeModeration(m, m.mentions, str, 5, libtext.logs.unmute);
}

function executeModeration(m, users, breason, mtype, logformat, modlength, modlengthstr)
{
	var sid = m.channel.guild.id;
	var mlogs = [];
	var usersmoderated = [];
	var s = _s[m.channel.guild.id].settings;
	var reg = new RegExp(/<@!?[0-9]{17,21}>/g);
	var breason = breason.replace(reg, "");
	var botmember = m.channel.guild.members.get(bot.user.id);
	if(GuildRecentActions[m.channel.guild.id] == undefined){
		GuildRecentActions[m.channel.guild.id] = {};
	}
	for(var i in m.mentions)
	{
		var user = m.mentions[i];
		var member = bot.guilds.get(sid).members.get(user.id);
		if(libperm.isHigherRole(m.channel.guild, m.member, member)){
			var modlog = {
				user: user.id, 
				staff: m.author.id, 
				server: sid, 
				reason: breason, 
				type: mtype
			};

			GuildRecentActions[m.channel.guild.id][user.id] = [time_now(), mtype];
			mlogs.push(modlog);
			usersmoderated.push("**"+user.username+"#"+user.discriminator+"**");
			if(mtype === 1){
				if(libperm.discordPerm(botmember, "banMembers") == false){
					bot.reply(m, "Unable to ban because the Bot is missing the `Ban Members` permission on discord.");
					return;
				}
				if(libperm.getHighestRolePos(botmember) < libperm.getHighestRolePos(member)){
					bot.reply(m, "Unable to ban because the user has a higher role than the bot.");
					return;
				}
				bot.banGuildMember(m.channel.guild.id, user.id, 7);
			} else if(mtype == 2){
				if(libperm.discordPerm(botmember, "kickMembers") == false){
					bot.reply(m, "Unable to kick because the Bot is missing the `Kick Members` permission on discord.");
					return;
				}
				if(libperm.getHighestRolePos(botmember) < libperm.getHighestRolePos(member)){
					bot.reply(m, "Unable to kick because the user has a higher role than the bot.");
					return;
				}
				bot.kickGuildMember(m.channel.guild.id, user.id)
			} else if(mtype == 3){
				// Warning
			} else if(mtype == 4){
				// Mute user
				if(libperm.discordPerm(botmember, "manageRoles") == false){
					bot.reply(m, "Unable to mute because the Bot is missing the `Manage Roles` permission on discord.");
					return;
				}
				var role = m.channel.guild.roles.get(s.muted);
				if(role == undefined){
					bot.reply(m, "Unable to mute because the mute role appears to be missing.");
					return;
				}
				var rolepos = role.position;
				if(libperm.discordPerm(botmember, "manageRoles") == false || libperm.canAssignRole(botmember, role) == false){
					bot.reply(m, "Unable to unmute because the Bot requires a role with `Manage Roles` permission and needs to be positioned above the muted role.");
					return;
				}
				var newroles = member.roles;
				newroles.push(s.muted);
				bot.editGuildMember(sid, user.id, {
					roles: newroles
				});
				if(modlength !== false){
					QueueAction("unmute", parseInt(modlength), {
						user_id: user.id,
						guild: m.channel.guild.id
					});
				}
			} else if(mtype == 5){
				// unmuted user
				var role = m.channel.guild.roles.get(s.muted);
				if(role == undefined){
					bot.reply(m, "Unable to unmute because the mute role appears to be missing.");
					return;
				}
				if(libperm.discordPerm(botmember, "manageRoles") == false || libperm.canAssignRole(botmember, role) == false){
					bot.reply(m, "Unable to unmute because the Bot requires a role with `Manage Roles` permission and needs to be positioned above the muted role.");
					return;
				}
				var newroles = [];
				for(var i in member.roles){
					if(member.roles[i] != s.muted){
						newroles.push(member.roles[i]);
					}
				}
				bot.editGuildMember(sid, user.id, {
					roles: newroles
				});
			}
		} else {
			bot.reply(m, "Unable to moderate "+user.username+"#"+user.discriminator+" because they have a role higher than the bot.");
			return;
		}
	}
	sql.addModerationLogs(mlogs, (success, result)=>{
		if(success){
			var hammerstr = ":hammer: "+modtypes[mtype]+" "+usersmoderated.join(" and ")+" for `"+breason+"`";
			
			if(modlengthstr != undefined){
				hammerstr += ", length: "+modlengthstr;
			}
			bot.reply(m, hammerstr);
			for(var i in result)
			{
				var ModerationLog = libserver.CaseLog({
					staff: m.author.id,
					user: mlogs[i].user,
					type: mtype,
					reason: breason,
					format: logformat,
					id: result[i],
					length: modlengthstr
				});

				serverlog(m.channel.guild, ModerationLog, result[i]);
			}
		} else {
			bot.reply(m, "Internal error attempting to log the moderation! ");
		}
	});
}

/* Ban */
function banUser(m, str)
{
	if(dPerm(m.member, "banMembers") == false && !hasPerm(m.author, m.channel.guild, "ban") && isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "You are missing the `ban` permission. "); return;
	}
	if(m.mentions.length == 0 || m.mentions.length > 3){
		bot.reply(m, "Usage: -ban @user [reason]\nMaximum of 3 users per ban command.\n This also has the setting of 7 days of message removal."); return;
	}
	executeModeration(m, m.mentions, str, 1, libtext.logs.ban);
}

/* Kick */
function kickUser(m, str)
{
	if(dPerm(m.member, "kickMembers") == false && hasPerm(m.author, m.channel.guild, "kick") == false && isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "You are missing the `kick` permission. "); return;
	}

	if(m.mentions.length == 0 || m.mentions.length > 3){
		bot.reply(m, "Usage: -kick @user [reason]\nMaximum of 3 users per kick command.\n"); return;
	}
	executeModeration(m, m.mentions, str, 2, libtext.logs.kick);
}

function warnUser(m, str)
{
	if(dPerm(m.member, "kickMembers") == false && hasPerm(m.author, m.channel.guild, "warn") == false && isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "You are missing the `warn` permission, or the discord kick permission. "); return;
	}

	if(m.mentions.length == 0 || m.mentions.length > 3){
		bot.reply(m, "Usage: -warn @user [reason]\nMaximum of 3 users per warn."); return;
	}
	executeModeration(m, m.mentions, str, 3, libtext.logs.warn);
}

function softban(m, str)
{

}

function tempban(m, str)
{

}


function doIHavePermission(m, args)
{
	if(perms.indexOf(args) === -1){
		bot.reply(m, "Permission does not exist.");
		return;
	}
	if(hasPerm(m.author, m.channel.guild, args)){
		bot.reply(m, "Yes, you have that permission.");
	} else {
		bot.reply(m, "No, you don't have that permission.");
	}
}

// User, server, perm
function hasPerm(user, server, perm)
{
	if(user == undefined || server == undefined)
	{
		return false;
	}
	if(user.id === server.ownerID){
		return true;	
	} else {
		var member = server.members.get(user.id);
		if(member != undefined){
			var roles = member.roles;
			var settings = _s[server.id].settings;
			if(settings.roles != undefined){
				for(var i in roles){
					if(settings.roles[roles[i]] != undefined && settings.roles[roles[i]].indexOf(perm) > -1){
						return true;
					}
				}
			}
		}
		return false;	
	}
}



function roleHasPerm(server, role, permname)
{
	var userperms = [];
	if(_s[server.id].settings.roles === undefined || _s[server.id].settings.roles[role] === undefined){
		return false;
	}
	var r = _s[server.id].settings.roles[role] || null;
	if(r === null || r.length === 0){
		return false;
	} else {
		if(r.indexOf(permname) > -1){
			return true;
		} else {
			return false;
		}
	}
}

function checkPerms(m, str)
{
	var count = (str.match(/`/g) || []).length;
	var reg = new RegExp(/^([a-zA-Z\s0-9]*)(\s")([a-zA-Z\s0-9]*)(")+$/);
	if(!reg.test(str)){
		bot.reply(m, "Usage: -hasperm permission \"Role name\"\nPlease permission with the permission name, and make sure to use the single quotes for the role.");
		return;
	}
	
	var matches = str.match(reg);
	var permname = matches[1];
	var groupname = matches[3];
	if(perms.indexOf(permname) == -1){
		bot.reply(m, "Permission does not exist.");
		return;
	}
	var role = getRoleByName(m.channel.guild, groupname);
	if(role === null || role === undefined){
		bot.reply(m, "Role not found.");
	} else {
		var gperm = roleHasPerm(m.channel.guild, role, permname);
		if(gperm){
			bot.reply(m, "**"+role.name+"** has the permission "+permname);
		} else {
			bot.reply(m, "**"+role.name+"** does not have the permission "+permname);
		}
	}
	
}

function getRoleByName(server, rname)
{
	var r = server.roles.find((role,index)=>{
		return role.name.toLowerCase() == rname.toLowerCase();
	});
	return r;
}

// Grants permissions to a role.
function grant(m, args)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires to be an administrator of the server.");
		return;
	}	
	if(args.split(" ").length <= 1){
		bot.reply(m, "Usage: -grant \"Role name\" permission");
		return;
	}
	var ar = args.split(" ");
	if(perms.indexOf(ar[ar.length-1]) === -1){
		bot.reply(m, "The permission you're trying to assign was not found");
		return;
	}
	var regex = new RegExp(/(\")([a-zA-Z0-9\s\-\_]*)(\")/);
	if(regex.test(args)){
		var matches = args.match(regex);
		var rolename = matches[2];
		var role = getRoleByName(m.channel.guild, rolename);
		if(role === null){
			bot.reply(m, "Unable to find the role");
		} else {
			var perm = ar[ar.length-1];
			
			if(_s[m.channel.guild.id].settings.roles === undefined){
				_s[m.channel.guild.id].settings.roles = {};
			}
			if(_s[m.channel.guild.id].settings.roles[role.id] !== undefined && _s[m.channel.guild.id].settings.roles[role.id].length > 0){
				if(_s[m.channel.guild.id].settings.roles[role.id].indexOf(perm) > -1){
					bot.reply(m, "The role already has that permission.");
					return;
				} else {
					_s[m.channel.guild.id].settings.roles[role.id].push(perm);
				}
			} else {
				_s[m.channel.guild.id].settings.roles[role.id] = [perm];
			}
			UpdateServerInfoAsync(m.channel.guild.id, (success)=>{
				if(!success){
					bot.reply(m, "Granted `"+role.name+"` the `"+perm+"` permission. however, could not update to the database. Changes are temporary.");
				} else {
					bot.reply(m, "Granted `"+role.name+"` the `"+perm+"` permission");
				}
			});
			
		}
	} else {
		bot.reply(m, "Unable to parse role name.");
		return;
	}
}

// revoke permissions from a role.
function revoke(m, args)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires to be an administrator of the server.");
		return;
	}	
	if(args.split(" ").length <= 1){
		bot.reply(m, "Usage: -revoke \"Role name\" permission");
		return;
	}
	var ar = args.split(" ");
	if(perms.indexOf(ar[ar.length-1]) === -1){
		bot.reply(m, "The permission you're trying to remove was not found");
		return;
	}
	var regex = new RegExp(/(\")([a-zA-Z0-9\s\-\_]*)(\")/);
	if(regex.test(args)){
		var matches = args.match(regex);
		var rolename = matches[2];
		var role = getRoleByName(m.channel.guild, rolename);
		if(role === null){
			bot.reply(m, "Unable to find the role");
		} else {
			var perm = ar[ar.length-1];
			var settings = _s[m.channel.guild.id].settings;
			if(settings.roles === undefined){
				settings.roles = {};
			}
			if(settings.roles[role.id] !== undefined && settings.roles[role.id].length > 0){
				var pos = settings.roles[role.id].indexOf(perm);
				if(pos == -1){
					bot.reply(m, "The role does not have that permission.");
					return;
				} else {
					settings.roles[role.id].splice(pos, 1);
				}
			} else {
				bot.reply(m, "No permissions on that role.");
				return;
			}
			UpdateServerInfoAsync(m.channel.guild.id, (success)=>{
				if(!success){
					bot.reply(m, "Revoked `"+role.name+"` the `"+perm+"` permission. however, could not update to the database. Changes are temporary.");
				} else {
					bot.reply(m, "Revoked `"+role.name+"` the `"+perm+"` permission");
				}
			});
			
		}
	} else {
		bot.reply(m, "Unable to parse role name.");
		return;
	}
}

function isAdmin(user, server)
{
	if(user.id == server.ownerID 
		|| developers.indexOf(user.id) > -1 
		|| hasPerm(user, server, "administrator") === true){
		return true;	
	} else {
		var member = server.members.get(user.id);
		if(member.permission.json["administrator"] === true){
			return true;
		}
		return false;	
	}
}

function prune(m, args)
{
	var server = m.channel.guild;
	if(!hasPerm(m.author, m.channel.guild, "prune") && dPerm(m.member, "manageMessages") == false){
		bot.reply(m, "Requires permission 'prune'");
		return;
	}
	if(_s[server.id] === undefined){
		bot.reply(m, "Your server settings appear to be missing or errored, please use -verifySettings");
		return;
	}
	if(time_now() < lastprune[m.channel.guild.id]){
		bot.reply(m, "Please wait "+(lastprune[m.channel.guild.id]-time_now())+" seconds before pruning again. This is due to discords rate limits.");
		return;
	}
	lastprune[m.channel.guild.id] = time_now() + 15;
	var c = args.split(" ");
	var amount = parseInt(c[0]) + 1;
	if(isNaN(amount) || amount < 2){
		bot.reply(m, "Please use a proper number for the argument, Can't be more than 100 at a time.");
		return;
	}
	if(amount > 100){
		amount = 100;
	}
	var users = [];
	var userlist = false;
	if(m.mentions.length > 0){
		userlist = true;
		for(var i in m.mentions){
			users.push(m.mentions[i].id);
		}
	}

	var pro = bot.getMessages(m.channel.id, amount, null, null, null).then((msgs) => {
		if(userlist === true){
			var newarr = [];
			for(var i in msgs){
				if(users.indexOf(msgs[i].author.id) > -1){
					newarr.push(msgs[i].id);
				}
			}
			bot.deleteMessages(m.channel.id, newarr).then(() => {
				bot.reply(m, "Pruned").then((msg)=>{
					setTimeout(()=>{
						bot.deleteMessage(m.channel.id, msg.id);
					}, 2500);
				});
			}, function(err){
				if(err){
					bot.reply(m, "Bot failed to prune, most likely missing the proper permissions. 'Manage Messages' is required.").then((msg)=>{
						setTimeout(()=>{
							bot.deleteMessage(m.channel.id, msg.id);
						}, 2500);
					});
				}
			});
		} else {
			var newarr = [];
			for(var i in msgs){
				newarr.push(msgs[i].id);
			}
			bot.deleteMessages(m.channel.id, newarr).then((err) => {
				bot.reply(m, "Pruned").then((msg)=>{
					setTimeout(()=>{
						bot.deleteMessage(m.channel.id, msg.id);
					}, 2500);
				});
			}, function(err){
				if(err){
					bot.reply(m, "Bot failed to prune, most likely missing the proper permissions. 'Manage Messages' is required.").then((msg)=>{
						setTimeout(()=>{
							bot.deleteMessage(m.channel.id, msg.id);
						}, 2500);
					});
				}
			});
		}
	});
}

function setVoiceRoom(m)
{

}

function setJoinMessage(m)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires to be owner of the server.");
		return;
	}	
	var c = m.content.split(" ");
	if(c[1] === "off"){
		delete _s[m.channel.guild.id].settings["joinleave"];
	} else if(c[1] === "here"){
		_s[m.channel.guild.id].settings["joinleave"] = m.channel.id;
	} else {
		bot.reply(m, "Usage: !onjoin off|here - Using off will turn it off, here will set it to this channel.")
		return;
	}
	
	UpdateServerInfoAsync(m.channel.guild.id, (success)=>{
		if(success){
			bot.reply(m, "Successfully updated join settings.");
		} else {
			bot.reply(m, "Successfully updated join settings temporarily");
		}
	});
}

function setLeaveMessage(m)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires to be owner of the server.");
		return;
	}	
	var c = m.content.split(" ");
	if(c[1] === "off"){
		delete _s[m.channel.guild.id].settings["evleave"];
	} else if(c[1] === "here"){
		_s[m.channel.guild.id].settings["evleave"] = m.channel.id;
	} else {
		bot.reply(m, "Usage: !onjoin off|here - Using off will turn it off, here will set it to this channel.")
		return;
	}
	
	UpdateServerInfoAsync(m.channel.guild.id, (success)=>{
		if(success){
			bot.reply(m, "Successfully updated leave settings.");
		} else {
			bot.reply(m, "Successfully updated leave settings temporarily");
		}
	});
}

function disableCommand(m)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	var c = m.content.split(" ");
	if(discordsettings.always_enabled.indexOf(c[1]) > -1){
		bot.reply(m, "Sorry, you can't disable that command.");
		return;
	}

	if(_s[m.channel.guild.id] !== undefined && _s[m.channel.guild.id].settings !== undefined){
		var found = false;
		for(var i in discord.hooks){
			if(discord.hooks[i].command == c[1]){
				found = true;
			}
		}
		if(!found){
			bot.reply(m, "That command does not exist.");
			return;
		}
		if(_s[m.channel.guild.id].settings.commands === undefined){
			_s[m.channel.guild.id].settings.commands = {};
		}
		_s[m.channel.guild.id].settings.commands[c[1]] = false;
		UpdateServerInfoAsync(m.channel.guild.id, (success)=>{
			if(success){
				bot.reply(m, "Successfully disabled `"+c[1]+"`");
			} else {
				bot.reply(m, "Successfully disabled `"+c[1]+"` temporarily");
			}
		});
		
	}
}

function enableCommand(m)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	var c = m.content.split(" ");
	if(discordsettings.always_enabled.indexOf(c[1]) > -1){
		bot.reply(m, "That command can't be disabled anyway.");
		return;
	}

	if(_s[m.channel.guild.id] !== undefined && _s[m.channel.guild.id].settings !== undefined){
		var found = false;
		for(var i in discord.hooks){
			if(discord.hooks[i].command == c[1]){
				found = true;
			}
		}
		if(!found){
			bot.reply(m, "That command does not exist.");
			return;
		}
		if(_s[m.channel.guild.id].settings.commands === undefined){
			_s[m.channel.guild.id].settings.commands = {};
		}
		delete _s[m.channel.guild.id].settings.commands[c[1]];
		UpdateServerInfoAsync(m.channel.guild.id, (success)=>{
			if(success){
				bot.reply(m, "Successfully enabled `"+c[1]+"`");
			} else {
				bot.reply(m, "Successfully enabled `"+c[1]+"` temporarily");
			}
		});
	}
}

function ignoreChannel(m)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	if(_s[m.channel.guild.id] === undefined || _s[m.channel.guild.id].settings === undefined){
		bot.reply(m, "This server is missing settings data, please report this error.");
		return;
	}
	if(_s[m.channel.guild.id].settings.c === undefined){
		_s[m.channel.guild.id].settings.c = [];
	}
	
	var c = m.content.split(" ");
	if(c[1] == undefined){
		bot.reply(m, "\nUsage: !ignorechannel <yes | no>");
		return;
	}
	
	if(c[1] == "yes"){
		if(_s[m.channel.guild.id].settings.c.indexOf(m.channel.id) == -1){
			_s[m.channel.guild.id].settings.c.push(m.channel.id);
			serverlog(m.channel.guild, m.author.username+"#"+m.author.discriminator+" set the bot to ignore <#"+m.channel.id+">");
		}
	} else if(c[1] == "no"){
		if(_s[m.channel.guild.id].settings.c.indexOf(m.channel.id) > -1){
			var newarr = [];
			for(var i in _s[m.channel.guild.id].settings.c){
				if(_s[m.channel.guild.id].settings.c[i] != m.channel.id){
					newarr.push(_s[m.channel.guild.id].settings.c[i]);
				}
			}
			_s[m.channel.guild.id].settings.c = newarr;
			serverlog(m.channel.guild, m.author.username+"#"+m.author.discriminator+" set the bot to not ignore <#"+m.channel.id+">");
		}
	}
	
	var sjson = JSON.stringify(_s[m.channel.guild.id].settings);
	sql.updateServerInformation(m.channel.guild.id, {settings: sjson}, function(success){
		if(!success){
			bot.reply(m, "Temporarily updated channel ignore settings, there was an SQL error.");
		} else {
			bot.reply(m, "Updated channel ignore settings.");
		}
	});
}

function setInvite(m)
{
	if(m.channel.isPrivate){
		bot.reply(m, libtext.server_only);
		return;
	}
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	
	var c = m.content.split(" ");	
	if(c[1] == undefined || c[1] == ""){
		bot.reply(m, "Usage: !setinvite <invite link>");
		return;
	}
	sql.setInvite(m.channel.guild, c[1], function(success){
		if(success){
			bot.reply(m, "Succesfully set your server invite!");	
		} else {
			bot.reply(m, libtext.internal_error);	
		}
	});
}

function listTags(m)
{
	if(m.channel.isPrivate){
		bot.reply(m, libtext.server_only);
		return;
	}
	sql.getTags(m.channel.guild, function(success, tags){
		if(tags == null || tags.length == 0){
			bot.reply(m, "This server has no tags!");
			return;
		}
		var ts = tags.split(" ");
		bot.reply(m, "This servers tags are: ```"+ ts.join(", ") +"```");
	});
}

function addTag(m)
{
	if(m.channel.isPrivate){
		bot.reply(m, libtext.server_only);
		return;
	}
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	var c = m.content.split(" ");
	c=c.splice(1,1);
	if(c.length == 0){
		bot.reply(m, "Usage: -settags <tag[, tag] \n E.g !settags tag another_tag");
		return;
	}
	var reg = new RegExp("^[a-zA-Z\_]*");
	if(c.length > dsettings.max_tags){
		bot.reply(m, "You can only have a maximum of "+dsettings.max_tags+" tags. "+c.length);
		return;
	}
	for(var i in c){
		if(c[i].length > 24){
			bot.reply(m, "Tags can be a maximum of 24 characters. Referencing '"+c[i]+"'");
			return;
		}
		if(reg.test(c[i]) == false){
			bot.reply(m, "The tag '"+ c[i] +"' does not match the proper tag formatting. "+c[i]);
			return;
		}
	}
	
	sql.setTags(m.channel.guild, c.join(" "), function(success){
		if(success){
			bot.reply(m, "Successfully set your servers tags");	
		} else {
			bot.reply(m, "Failed to set tags, internal error.");	
		}
	});
}

function removeTags(m)
{
	if(m.channel.isPrivate){
		bot.reply(m, libtext.server_only);
		return;
	}
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	
	sql.clearTags(m.channel.guild, function(success){
		if(success){
			bot.reply(m, "Cleared your server tags.");	
		} else {
			bot.reply(m, "Failed to clear your servers tags, internal error.");	
		}
	});
}

function setDescription(m)
{
	if(m.channel.isPrivate){
		bot.reply(m, libtext.server_only);
		return;
	}
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	
	var c = m.content.substring(12);
	if(c == undefined || c.length == 0){
		bot.reply(m, "Usage: -description <description> - Sets your servers description. \n Restrictions: No links allowed, Descriptions must be <= 500 characters.")
		return;
	}
	
	if(m.content.length > 500){
		bot.reply(m, "Sorry, the descriptions have a maximum of 500 characters.");
		return;
	} else {
		sql.setDesc(m.channel.guild, c, function(success){
			if(!success){ bot.reply(m, libtext.internal_error); return; }
			
			bot.reply(m, "Updated your servers description on the index!");
		});
		
	}
}

function toggle(m){
	
}

function indexServer(m)
{
	if(m.channel.isPrivate){
		bot.reply(m, libtext.server_only);
		return;
	}
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	var c = m.content.split(" ");
	if(c[1] === undefined){
		bot.reply(m, "Usage: -indexserver <on | off>");
		return;
	}
	var update = {
		index_server: 0
	}
	if(c[1] === "yes" || c[1] === "on"){
		update.index_server = 1;
	} else {
		update.index_server = 0;
	}
	sql.updateServerInformation(m.channel.guild.id, update, function(success, errcode){
		if(success){
			bot.reply(m, libtext.admin_indexed);
		} else {
			bot.reply(m, libtext.admin_failed_index);	
		}
	});
}	



function channelSQL(serverID)
{
	var ch = [];
	var srv = bot.guilds.get(serverID);
	return srv.channels.map(g => g.id).join(",");
}

function parseUserString(str){
	var reg1 = new RegExp(/^(id\:)([0-9]*)+$/);
	var reg2 = new RegExp(/(<@!?)([0-9]{17,21})(>)/g);
	if(str === "all"){
		return "*";
	} else if(reg1.test(str)){
		return str.split(":")[1];
	} else if(reg2.test(str)){
		var result = str.match(reg2)[1];
	}
	return false;
}

function matchAll(str, regex) {
    var res = [];
    var m;
    if (regex.global) {
        while (m = regex.exec(str)) {
            res.push(m[1]);
        }
    } else {
        if (m = regex.exec(str)) {
            res.push(m[1]);
        }
    }
    return res;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function formatTime(t)
{
	var n = time_now();
	var d = n-t;
	if(d > 60*60*24){
		return Math.floor(d/(60*60*24))+" days ago";
	} else if(d > 60*60){
		return Math.floor(d/(60*60))+" hours ago";
	} else if(d > 60){
		return Math.floor(d/60)+" minutes ago";
	} else {
		return Math.floor(d)+" seconds ago.";
	}
}

// Counts how much matche a certain query returns.
function searchlogs(m)
{
	if(!hasPerm(m.author, m.channel.guild, "logs") && !isAdmin(m.author, m.channel.guild)){
		bot.reply(m, "Requires permission 'logs'");
		return;
	}
	
	var c = m.content.split(" ");
	var userlist = m.mentions;
	var user = parseUserString(c[1]);
	if(user === false && userlist.length == 0){
		bot.reply(m, "The user was not found.");
		return;
	} else if(user === false && userlist.length > 0){
		user = userlist[0].id;
	}
	var chstr = channelSQL(m.channel.guild.id);
	var q = "where ";
	var reg1 = new RegExp(/(\-\-find\:\`)([a-zA-Z0-9\-\=\s]*)(\`)/);
	var reg1_2 = new RegExp(/(\-\-find\:\')([a-zA-Z0-9\-\=\s]*)(\')/);
	var reg1_3 = new RegExp(/(\-\-find)/);
	var reg2 = new RegExp(/(\-\-show\:)([0-9]*)/);
	var reg4 = new RegExp(/(\-\-page\:)([0-9]*)/);
	var reg5 = new RegExp(/(\-\-channel\:)([0-9]*)/);
	var reg3 = new RegExp(/(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi);
	var limitstring = false;
	var whereq = [];
	if(user !== "*"){
		whereq.push("user_id=? ");
	}
	var usingFind = false;
	var findNotUsed = false;
	if(reg1.test(m.content))
	{
		var matches = m.content.match(reg1);
		var searchQ = matches[2];
		whereq.push("message like '%"+searchQ+"%'");
		usingFind = true;
	} else if(reg1_2.test(m.content)){
		var matches = m.content.match(reg1_2);
		var searchQ = matches[2];
		whereq.push("message like '%"+searchQ+"%'");
		usingFind = true;
	}
	if(reg2.test(m.content)){
		var matches = m.content.match(reg2);
		var searchQ = parseInt(matches[2]);
		if(searchQ > 30){
			bot.reply(m, "Max search amount is 30.");
			return;
		}
		limitstring = "limit "+searchQ;
		if(reg4.test(m.content)){
			matches = m.content.match(reg4);
			var ipage = parseInt(matches[2]);
			limitstring="limit "+(ipage-1)*searchQ+","+searchQ;
		}
	}
	if(c.indexOf("--ignoreself") > -1){
		whereq.push("user_id !='"+m.author.id+"' ");
	}
	if(c.indexOf("--here") > -1){
		whereq.push("channel_id='"+m.channel.id+"' ");
	} else if(reg5.test(m.content)){
		var matches = m.content.match(reg5);
		var chid = matches[2];
		var channel = bot.channels.get("id", chid);
		if(channel == null || channel.server.id !== m.channel.guild.id){
			bot.reply(m, "Invalid channel id. Make sure it exists, and it is on your server.");
			return;
		}

		whereq.push("channel_id='"+chid+"' ");
	} else {
		whereq.push("channel_id in ("+chstr+") ");
	}
	if(reg1_3.test(m.content)){
		if(!usingFind){ findNotUsed = true; }
	}
	whereq.push("user_id !='"+bot.user.id+"' ");
	q+= whereq.join("and ");
	if(c.indexOf("--latest") > -1){
		q+=" order by timestamp desc ";
	}
	var showUID = false;
	if(c.indexOf("--ids") > -1){
		showUID = true;
	}
	
	if(limitstring === false){
		limitstring = "limit 30";
	}
	q+=limitstring;
	sql.getLogsSafe(q, [user], function(success, result){
		if(success){
			var str = "";
			var omitted = 0;
			for(var i in result){
				var user = bot.users.find(g=>g.id==result[i].user_id);
				var uname = "**[Not found]**"
				if(user !== undefined && user !== null){
					uname = user.username+"#"+user.discriminator+" ";
					if(showUID){ uname+="("+user.id+")"; }
				}
				var mmm = "";

				if(result[i].message.length > 200){
					mmm = result[i].message.substring(0,200) +" ...";
				} else {
					mmm = result[i].message;
				}
				var reg3 = new RegExp(/((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi);
				var rep = {};
				while (match=reg3.exec(mmm)) {
					var old = mmm.substring(match.index, reg3.lastIndex);
					rep[old] = " <"+old+"> ";
				}
				for(var zz in rep){
					mmm = mmm.replace(zz, rep[zz]);
				}
				var cl = uname;
				if(showUID){
					cl+=" ["+result[i].id+"]";
				}
				if(result[i].has_attachment == 1){
					cl+=" _Attachment_";
				}
				var rstr = mmm.replaceAll("`", " ").replaceAll("\n", " ").replaceAll("\r", " ");
				if(rstr === ""){
					rstr = "_No text to show._";
				} else {
					rstr = "` "+rstr+" `";
				}
				cl+=" said "+formatTime(result[i].timestamp)+": \n"+rstr+" \n\n";
				if(str.length + cl.length < 1500){
					str = str + cl;
				} else {
					omitted++;
				}
			}
			var str2 = "";
			if(omitted > 0){
				str2 = omitted +" results not shown due to length.";
			}
			if(findNotUsed === true){
				str2 += " --find parameter could not be used."
			}
			bot.reply(m, "Successful query. "+str2+" \n Messages found:\n\n"+str);
		} else {
			var estr = "";
			if(result === "ER_PARSE_ERROR"){
				estr = "\nQuery logged to console.";
			}
			bot.reply(m, "SQL Error: "+result+estr);	
		}
	});
}

function recommendedTags(m){ bot.reply(m, libtext.recommended_tags); }

function serverlog(server, str, caseId)
{
	if(_s[server.id].settings === undefined || _s[server.id].settings.logchannel === undefined){
		return;
	} else {
		var cid = _s[server.id].settings.logchannel;
		var c = server.channels.find(g => g.id == cid);
		if(c !== undefined && c !== null){
			bot.createMessage(c.id, str).then((message)=>{
				if(caseId !== undefined && !isNaN(caseId)){
					ModerationMessageCache[caseId.toString()] = message.id;
				}
			});
		}
		
	}
}

function setLogChannel(m, str)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires to be owner of the server.");
		return;
	}	
	if(_s[m.channel.guild.id] == undefined){
		bot.reply(m, "Please run -verifysettings first, your settings appear to be missing.");
		return;
	}
	str=str.toLowerCase();
	if(str === "off" || str == "false"){
		delete _s[m.channel.guild.id].settings["logchannel"];
	} else if(str === "here"){
		_s[m.channel.guild.id].settings["logchannel"] = m.channel.id;
	} else {
		bot.reply(m, "Usage: -logs `off` | `here` - Using `off` will turn it off, `here` will set it to this channel.");
		return;
	}
	
	var sjson = JSON.stringify(_s[m.channel.guild.id].settings);
	sql.updateServerInformation(m.channel.guild.id, {settings: sjson}, function(success){
		if(!success){
			bot.reply(m, "Updated log channel temporarily, server failed to update to the database.");
		} else {
			bot.reply(m, "Sucessfully updated log channel setting.");
		}
	});
}

function setGrantableRole(m, str)
{
	if(isAdmin(m.author, m.channel.guild) == false){
		bot.reply(m, "This command requires \"Administrator\" permission, or owner to use this command.");
		return;
	}
	
	var reg = new RegExp(/^(")([a-zA-Z\s0-9]*)("\s)([a-zA-Z]*)+$/);
	if(!reg.test(str)){
		bot.reply(m, "Usage: -grantable \"Role name\" `yes` | `no` \n E.g -grantable \"Moderator\" no");
		return;
	}
	
	var ma = str.match(reg);
	var rolename = ma[2];
	var opt = ma[4];
	if(opt != "yes" && opt != "no"){
		bot.reply(m, "Please use yes or no for argument 2.");
		return;
	}
	var srv = m.channel.guild;
	var role = getRoleByName(srv, rolename);
	if(role === null){
		bot.reply(m, "Role not found.");
	} else {
		if(_s[m.channel.guild.id].settings.grantable === undefined){
			_s[m.channel.guild.id].settings.grantable = [];
		}
		if(opt == "yes"){
			if(_s[m.channel.guild.id].settings.grantable.indexOf(role.id) == -1){
				_s[m.channel.guild.id].settings.grantable.push(role.id);
			}
		} else if(opt == "no") {
			if(_s[m.channel.guild.id].settings.grantable.indexOf(role.id) > -1){
				var nt = [];
				for(var i in _s[m.channel.guild.id].settings.grantable){
					if(_s[m.channel.guild.id].settings.grantable[i] != role.id){
						nt.push(_s[m.channel.guild.id].settings.grantable[i])
					}
					
				}
				_s[m.channel.guild.id].settings.grantable = nt;
			}
		}
		var sjson = JSON.stringify(_s[m.channel.guild.id].settings);
		sql.updateServerInformation(m.channel.guild.id, {settings: sjson}, function(success){
			if(!success){
				bot.reply(m, "Updated grantable role temporarily, server failed to update to the database.");
			} else {
				bot.reply(m, "Sucessfully updated grantable role.");
			}
		});
	}
	
}

function grantRole(m, str)
{
	if(!hasPerm(m.author, m.channel.guild, "roleadd")){
		bot.reply(m, "Requires permission `roleadd`");
		return;
	}	

	var ss = str.split(" ");
	var user = m.mentions[0];
	var groupname = ss[1];
	var role = getRoleByName(m.channel.guild, groupname);
	if(role === null || role == undefined){
		bot.reply(m, "Role not found.");
	} else {
		if(_s[m.channel.guild.id].settings.grantable.indexOf(role.id) == -1){
			bot.reply(m, "That role isn't grantable.");
			return;
		}
		var cb = (err)=>{
			if(err){
				bot.reply(m, "Error attempting to give user the role.");
			} else {
				bot.reply(m, "Gave "+user.username+"#"+user.discriminator+" the `"+role.name+"` role.");
				serverlog(m.channel.guild, m.author.username+"#"+m.author.discriminator+" granted "+user.username+"#"+user.discriminator+" the `"+role.name+"` role");
			}
		};
		var ur = m.channel.guild.members.find(g => g.id == user.id).roles;
		ur.push(role.id);
		var prom = bot.editGuildMember(m.channel.guild.id, user.id, {
			roles: ur
		});
		prom.then(cb, ()=>{
			
		});
	}

}

function removeRole(m, str)
{

}


function UserActivity(m, str)
{
	var t = time_now() - (60*60*24*30);
	var args = str.split(" ");
	var user = null;
	var channels = null;
	if(m.channel.guild == undefined || args == undefined || args[0] == ""){
		var user = m.author;
	} else {
		user = libbot.ResolveUser(args[0]);
		if(args[1] == "globally"){
			channels = null;
		} else {
			channels = m.channel.guild.channels.map(g=>g.id);
		}
		
	}

	if(user == false || user == undefined){
		bot.reply(m, "Unable to find user.");
	} else {
		if(channels == null){
			sqlcon.query("select count(*) as `messages` from `chat_logs` where `user_id`=? and `timestamp` > ?;", [user.id, t], 
				function(err,result){
					if(err){
						bot.reply(m, "Internal SQL error. "+err.code);
						return;
					}
					if(result.length == 0){
						bot.reply(m, "No results for that user.");
					} else {
						bot.reply(m, user.username+"#"+user.discriminator+" has sent "+result[0]["messages"]+" messages in the last 30 days.");
					}
				}
			);
		} else {
			sqlcon.query("select count(*) as `messages` from `chat_logs` where `user_id`=? and `timestamp` > ? and `channel_id` in (?);", [user.id, t, channels], 
				function(err,result){
					if(err){
						bot.reply(m, "Internal SQL error. "+err.code);
						return;
					}
					if(result.length == 0){
						bot.reply(m, "No results for that user.");
					} else {
						bot.reply(m, user.username+"#"+user.discriminator+" has sent "
								+result[0]["messages"]+" messages in the last 30 days in this server.");
					}
				}
			);
		}
	}
}

var processingActive = {};

// Gets a list of the most active users.
function MostActive(m, str)
{
	var t = time_now() - (60*60*24*30);
	var guild = m.channel.guild;
	if(processingActive[guild.id]){
		bot.reply(m, "Sorry, you can't run this command again, please wait for the last request to finish.");
		return;
	}
	var users = guild.members.map(g=>g.id);
	processingActive[guild.id] = true;
}

// Gets a list of the most active users.
function LeastActive(m, str)
{
	var t = time_now() - (60*60*24*30);
	var guild = m.channel.guild;
	if(processingActive[guild.id]){
		bot.reply(m, "Sorry, you can't run this command again, please wait for the last request to finish.");
		return;
	}
	processingActive[guild.id] = true;
	var users = guild.members.map(g=>g.id);
	// select `user_id`,count(*) as amount from `chat_logs` where `timestamp` > 1473879123 group by `user_id` order by `amount` desc
	sqlcon.query("select count(*) from `chat_logs` where `timestamp` > ? group by `user_id`;");
}

