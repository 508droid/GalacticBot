exports.module = {
	name: "processbot",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var aliases = {};
var processes = [];

exports.module.preinit = function(){

};

var statistics_message = null;
var statfunctions = [];
var subprocess = {};
var logs = {};
var loadedserverdata = false;
var changelog = {
	last_checked: 0,
	changes: false
};


exports.module.init = function(){
	discord.hookprefix(discordbot, "!");
	discord.hookprefix(discordbot, "-");
	discord.hookprefix(discordbot, "\\-");
	discord.hookprefix(discordbot, "💩");
	discord.hookprefix(discordbot, "✋ 😩 👌");
	discord.hookprefix(discordbot, "Hitler did **nothing** wrong. ");
	discord.hookcommand(discordbot, "ping", function(m){ bot.reply(m, libtext.ping[randint(libtext.ping.length-1)]); });

	// Log related (Developer related)
	discord.hookcommand(discordbot, "devclearlogs", clearlogs);
	discord.hookcommand(discordbot, "devsearchlogs", checklogs);
	discord.hookcommand(discordbot, "devignorelogging", ignoreLog);
	discord.hookcommand(discordbot, "devreloaddb", ReloadDBData);
	discord.hookcommand(discordbot, "devsavedb", SaveDBData);
	
	// Simple commands to get ids and such
	discord.hookcommand(discordbot, "chid", channelid);
	discord.hookcommand(discordbot, "self", mself);
	discord.hookcommand(discordbot, "me", me);
	discord.hookcommand(discordbot, "serverid", serverid);
	discord.hookcommand(discordbot, "ids", userids);
	
	// Information commands
	discord.hookcommand(discordbot, "statistics", stats);
	discord.hookcommand(discordbot, "stats", stats);
	discord.hookcommand(discordbot, "about", stats);
	discord.hookcommand(discordbot, "help", help);
	discord.hookcommand(discordbot, "devhelp", devhelp);
	discord.hookcommand(discordbot, "adminhelp", adminhelp);
	discord.hookcommand(discordbot, "invite", invite);
	
	// Developer commands
	discord.hookcommand(discordbot, "e", evaluate);
	discord.hookcommand(discordbot, "name", editname);
	discord.hookcommand(discordbot, "status", status);
	discord.hookcommand(discordbot, "tl", togglelogging);
	discord.hookcommand(discordbot, "sa", avatar);
	discord.hookcommand(discordbot, "channelinfo", channelInfo);
	discord.hookcommand(discordbot, "regexp", testRegExp);
	discord.hookcommand(discordbot, "say", say, {version: 2});
	discord.hookcommand(discordbot, "botstats", infostats);
	discord.hookcommand(discordbot, "logs", viewlogs);
	discord.hookcommand(discordbot, "finv", forceInvite);

	// Index services
	discord.hookcommand(discordbot, "search", searchServers);
	discord.hookcommand(discordbot, "serverinfo", displayServerInfo);
	discord.hookcommand(discordbot, "info", displayServerInfo);
	discord.hookcommand(discordbot, "lservers", displayServers);
	
	// Random
	//discord.hookcommand(discordbot, "hailsatan", hailSatan);
	//discord.hookcommand(discordbot, "spaghetti", spaghetti);
	discord.hookcommand(discordbot, "changelog", viewChangelog);
	discord.hookcommand(discordbot, "cemoji", convertToEmoji);
	discord.hookcommand(discordbot, "b64", convBase64, {version: 2});
	discord.hookcommand(discordbot, "en", superencode, {version: 2});
	discord.hookcommand(discordbot, "q", doquery, {version: 2});

	discord.hookcommand(discordbot, "ge", getError, {version: 2});
	discord.hookcommand(discordbot, "verifysettings", verifySettings, {version: 2});
	discord.hookcommand(discordbot, "react", (m, str)=>{
		bot.addMessageReaction(m.channel.id, m.id, encodeURIComponent("👌"));
	}, {version: 2});

	discord.hookcommand(discordbot, "choice", reactionChoice, {version: 2});
	discord.hookcommand(discordbot, "poll", reactionPoll, {version: 2});
	discord.hookcommand(discordbot, "result", reactionResults, {version: 2});

	bot.on("guildCreate", EventServerCreated);
	bot.on("guildDelete", EventServerDeleted);
	bot.on("guildMemberAdd", EventMemberJoined);
	bot.on("guildMemberRemove", EventMemberLeft);
	bot.on("guildMemberUpdate", EventMemberUpdate);
	bot.on("presenceUpdate", EventUserStatus);

	bot.on("ready", function(){
		bot.editStatus(false, {
			name: "-help | -invite | -about",
			type: 0,
			url: "https://discordapp.com"
		});
		sql.updateStatistics();
		if(!loadedserverdata){
			loadedserverdata = true;
			loadServerData();
		}
	});

	setInterval(function(){
		if(bot.user.id != "157958863038054400"){
			return;
		}
		if(statistics_message === null){
			var guild = bot.guilds.find(g=>g.id==dsettings.stats_server);
			if(guild == null){
				console.log("Guild appears to be null for statistics message."); return;
			}
			var channel = guild.channels.find(c=>c.id==dsettings.stats_channel);
			if(channel !== null)
			{
				bot.getMessages(channel.id, 1).then((msgs)=>{
					statistics_message = {m: msgs[0].id, c: channel.id};
				});
			} else {
				console.log("Statistics channel is null");
			}
		} else {
			var statsmsg = createStatisticsMessage();
			bot.editMessage(statistics_message.c, statistics_message.m, statsmsg).then(function(msg){

			});
		}
	}, 30000);
	
	setInterval(()=>{
		bot.editStatus(false, {
			name: "-help | -invite | -about",
			type: 0,
			url: "https://discordapp.com"
		});
	}, 60*60000);

};

function help(m){ bot.sendDM(m.author, libtext.help); }
function devhelp(m){ bot.sendDM(m.author, libtext.helpdev); }
function adminhelp(m){ bot.createMessage(m.author.id, libtext.helpadmin); }
function serverid(m){ bot.reply(m, "This servers ID is "+m.channel.guild.id); }
function mself(m){ bot.reply(m, "My id is "+bot.user.id); }
function me(m){ bot.reply(m, "Your id is "+m.author.id); }
function channelid(m){ bot.reply(m, "This channel ID is "+m.channel.id);}

function hailSatan(m){ bot.createMessage(m.channel.id, "ALL HAIL SATAN!!! 🔥 🔥 🔥 🔥 👹 👹 👹 🔥 🔥 🔥 🔥 🔥 🔥 🔥\n 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥 🔥"); }
function spaghetti(m){ bot.createMessage(m.channel.id, "🍝 🍝 🍝 🍝 🍝 🍝  ALL HAIL THE FLYING SPAGHETTI MONSTER!!! 🍝 🍝 🍝 🍝 🍝"); }

function getError(m, str)
{
	if(developers.indexOf(m.author.id) === -1){
		bot.reply(m, ":eyes:");
		return;
	}	

	sqldb.query("select `error` from `errors` where `md5`=?", [str], (success, res)=>{
		if(!success){
			bot.createMessage(m.channel.id, "An error was returned:\n``` "+JSON.stringify(res)+" ```");
		} else {
			if(res.length == 0){
				bot.createMessage(m.channel.id, "Error not found."); return;
			}
			bot.createMessage(m.channel.id, "Result:\n``` "+ res[0].error +" ```");
		}
	});
}

function doquery(m, str)
{
	if(developers.indexOf(m.author.id) === -1){
		bot.createMessage(m.channel.id, "Result: ur a skid");
		return;
	}	

	sql.customQuery(str, (success, res)=>{
		if(!success){
			bot.createMessage(m.channel.id, "An error was returned:\n``` "+JSON.stringify(res)+" ```");
		} else {
			bot.createMessage(m.channel.id, "Result:\n``` "+ JSON.stringify(res) +" ```");
		}
	});
}

function EventMemberUpdate(guild, member, oldmember)
{
	modules.mysqlhook.connections.nodedb.query("insert into `nickname_changes` (`id`, `guild`, `nickname`, `time_now`)"+
		"values (?,?,?,?)", [member.id, guild.id, member.nick, time_now()]);
}

function EventUserUpdate(user, olduser)
{

}

function EventUserStatus(userdata)
{
	var userid = null;
	var gamename = null;
	if(userdata.game == undefined)
	{
		return;
	}
	if(userdata.joinedAt !== undefined)
	{
		userid = userdata.id;
		gamename = userdata.game.name;
	} else {
		gamename = userdata.game.name;
		userid = userdata.user.id;
	}
	modules.mysqlhook.connections.nodedb.query(
		"update `users` set `status`=? where `id`=? limit 1", 
		[gamename, userid]
	);	
}

function loadServerData()
{
	if(_s == undefined){
		console.log("Server data variable is missing");
		setTimeout(loadServerData, 200);
		return;
	}
	var serverIds = bot.guilds.map(g => g.id);
	if(serverIds.length == 0){
		setTimeout(loadServerData, 1000);
		return;
	}

	sql.getServersInfo(serverIds, function(success, data){
		if(success === false){
			setTimeout(loadServerData, 5000);
			return;
		} else {
			if(data == false){
				console.log("Server data is false.");
				return;
			} else {
				for(var i in data){
					if(data[i] !== null && data[i] !== undefined){
						var r = data[i];
						var st = [];
						if(r.tags !== null && r.tags.length > 0){
							st = r.tags.split(" ");
						}
						_s[r.server_id] = {
							name: r.server_name,
							tags: st,
							invite: r.invite || false,
							settings: parseServerSettings(r.settings, r.server_id),
							cache: time_now()
						}
					}
				}

				var servers = bot.guilds.map(g=>g);
				for(var i in servers){
					if(_s[servers[i].id] == undefined){
						sql.createServerData(servers[i], ()=>{});
						var server = servers[i];
						_s[server.id] = {
							name: server.name,
							tags: [],
							invite: false,
							settings: {},
							cache: time_now()
						}
					}
				}
			}
		}
	});
}

function verifySettings(m, str)
{
	var output = "**Verifying server data**";
	if(m.channel.guild === undefined){
		bot.reply(m, "This command can only be used on a server/guild.");
		return;
	}
	var server = m.channel.guild;
	if(_s[server.id] === undefined){
		output+="\n - Server settings are missing in memory.";
	} else {
		output+="\n - Server settings were found in memory.";
	}
	sql.getServersInfo([server.id], (success, result)=>{
		try {
			if(!success){
				bot.reply(m, " - Error querying for server data.");
			} else {
				if(result.length === 0 || result == false){
					output+="\n - Server data not found in database, creating...";
					bot.reply(m, output);
					_s[server.id] = {
						name: server.name,
						tags: [],
						invite: false,
						settings: {},
						cache: time_now()
					}
					sql.createServerData(server, ()=>{});
				} else {
					output+="\n - Found server data in the database, stored into memory.";
					bot.reply(m, output);
					var r = result[0];
					console.log(result);
					_s[m.channel.guild.id] = {
						name: r.server_name,
						tags: [],
						invite: r.invite || false,
						settings: parseServerSettings(r.settings, m.channel.guild.id),
						cache: time_now()
					}
				}
			}
		} catch(err){
			sql.logError(err, m, false);
		}
	});
}

function convBase64(m, str)
{
	bot.createMessage(m.channel.id, new Buffer(str, 'base64').toString('ascii'));
}

function superencode(m, str)
{

	var ls = "";
	while(str.length <= 1900){
		ls = str;
		str = new Buffer(str, "ascii").toString('base64');
		if(str.length > 1900){
			break;
		}
		
	}
	bot.createMessage(m.channel.id, "Output: \n```"+ls+"```");	
}

function convertToEmoji(m)
{
	//1⃣ 2⃣ 3⃣ 4⃣ 5⃣ 6⃣ 7⃣ 8⃣ 9⃣ 0⃣
	var conv = {
		"1": "1⃣",
		"2": "2⃣",
		"3": "3⃣",
		"4": "4⃣",
		"5": "5⃣",
		"6": "6⃣",
		"7": "7⃣",
		"8": "8⃣",
		"9": "9⃣",
		"0": "0⃣"
	}
	var c = m.content.substring("cemoji".length + 2);
	var str = c;
	for(var i in conv)
	{
		str=str.replaceAll(i, conv[i]);
	}
	str=str.replaceAll(" ", "");
	bot.reply(m, str);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function updateChangelog(cb)
{
	var logs = bot.getMessages("180825266107580416", 12).then((msgs)=>{
		var str = "";
		for(var i in msgs){
			if(str.length + msgs[i].content.length <= 2000){
				str+="\n"+msgs[i].content;
			}
			
		}
		changelog.last_checked = time_now();
		changelog.changes = str;
		cb();
	});
}

function viewChangelog(m)
{
	// 
	var changes = bot.guilds.get("179080119489396736").channels.get("180825266107580416");
	if(changes === null){
		bot.reply(m, "Changelog unavailable.");
		return;
	}
	if(changelog.changes === false){
		updateChangelog(function(){
			bot.reply(m, changelog.changes);
		});
		return;
	}
	if(time_now() - 300 > changelog.last_checked){
		updateChangelog(function(){
			bot.reply(m, changelog.changes);
		});
	} else {
		bot.reply(m, changelog.changes);
	}
}

function EventServerCreated(server)
{
	var srv = {
		server_id: server.id,
		server_name: server.name,
		owner_id: server.ownerID,
		created: time_now(),
		settings: "{}"
	}
	_s[server.id] = {
		name: server.name,
		tags: [],
		invite: false,
		settings: {}
	}
	sql.setServerInformation(server.id, srv, function(success){
		if(success){
			bot.createMessage("229395393522302977", "GalacticBot has conquered another server, `"+server.name+"` with "+server.members.map(g=>g).length+" people.");
		} else {

		}
	});
}

function EventServerDeleted(server)
{
	var srv = {
		server_id: server.id,
		removed: 1
	}
	sql.updateServerInformation(server.id, srv, function(success){
		if(success){
			bot.createMessage("229395393522302977", "GalacticBot has failed, left a guild called `"+server.name+"` with "+server.members.map(g=>g).length+" people.");
			delete _s[server.id];
		} else {
			
		}
	});
}

// Formats message for join and leave messages.
function FormatServerMessage(server, member, format)
{
	if(format === undefined || format === false){
		return false;
	} else {
		var str = format;
		var membercount = server.memberCount;
		str = str.replace(/\{user\}/g, "**"+member.user.username+"#"+member.user.discriminator+"**");
		str = str.replace(/\{mention\}/g, "<@"+member.user.id+">");
		str = str.replace(/\{members\}/g, membercount);

		return str;
	}
}

function EventMemberJoined(server, member)
{
	var user = member.user;
	if(_s[server.id] === undefined || _s[server.id].settings === undefined || _s[server.id].settings.joinleave === undefined || _s[server.id].settings.joinleave === false){
		return;
	} else {
		var ch = server.channels.get(_s[server.id].settings.joinleave);
		if(ch === null || ch === false){
			return;
		} else {
			var fmessage = FormatServerMessage(server, member, _s[server.id].settings.join_message);
			if(fmessage === false){
				bot.createMessage(ch.id, "**"+user.username+"#"+user.discriminator+"** has joined the server.");
			} else {
				bot.createMessage(ch.id, fmessage);
			}
		}
	}
}

function EventMemberLeft(server, member)
{
	if(member == null){
		return;
	}
	usercache[member.user.id] = member.user.username + "#" + member.user.discriminator;
	var user = member.user;
	if(_s[server.id] === undefined || _s[server.id].settings === undefined || _s[server.id].settings.evleave === undefined || _s[server.id].settings.evleave === false){
		return;
	} else {
		var ch = server.channels.get(_s[server.id].settings.evleave);
		if(ch === null || ch === false){
			return;
		} else {
			var fmessage = FormatServerMessage(server, member, _s[server.id].settings.leave_message);
			if(fmessage === false){
				bot.createMessage(ch.id, "**"+user.username+"#"+user.discriminator+"** has left the server.");
			} else {
				bot.createMessage(ch.id, fmessage);
			}		
		}
	}
}

function SaveServerData(m){
	
}

function updateServerData(id)
{
	if(developers.indexOf(m.author.id) === -1){
		bot.reply(m, "hi u ok");
		return;
	}

	
}

function forceInvite(m)
{
	if(developers.indexOf(m.author.id) === -1){
		bot.reply(m, "hi u ok");
		return;
	}

	var c = m.content.split(" ");
	var server = bot.guilds.get(c[1]);
	var channels = server.channels.map(g=>g.id);
	if(server !== undefined && server !== null){
		bot.createInvite(channels[0],{maxAge: 20}, function(err, inv){
			
		}).then((inv)=>{
			bot.reply(m, inv.code);
		});
	}
}

function parseServerSettings(str, sid)
{
	var deft = { listen: 0, whitelist: [], blacklist: [] };
	if(str === null || str === "" || str === false){
		return deft;
	} else {
		try {
			return JSON.parse(str);
		} catch(err){
			console.log("Server ID ["+sid+"] had an error parsing.");
			return deft;
		}
	}
}

function infostats(m)
{
	bot.createMessage(m.channel, createStatisticsMessage());
}

function setChannelListening(m)
{
	if(_q.servers[m.channel.guild.id] == undefined){
		bot.reply(m, "The server data is not setup yet.");
		return;
	}


}

function isAdmin(user, server)
{
	if(user.id == server.ownerID || dsettings.developers.indexOf(user.id) > -1){
		return true;	
	} else {
		var roles = server.rolesOfUser(user);
		if(roles.length > 0){
			for(var i in roles){
				if(roles.hasPermission != undefined && roles.hasPermission("manageServer")){
					return true;
				}
			}
		}
		return false;	
	}
}

function setupData(m)
{
	if(!isAdmin(m, m.channel.guild)){
		bot.reply(m, "You must own this server or have Administrator permission.");
		return;
	}

	if(_q.servers[m.channel.guild.id] == undefined){
		bot.reply(m, "The server data is already setup.");
		return;
	} else {

	}
}

function viewlogs(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	
	var c = m.content.split(" ");
	if(logs[c[1]] != undefined){
		var str = "";
		for(var i in logs[c[1]]){
			str+=logs[c[1]][i];
		}
		bot.reply(m, str);
	}
}

function createStatisticsMessage()
{
	var st = getStats();
	var msg = ""
		+"**Bot Statistics**\n"
		+"Servers: "+ st.servers+"\n"
		+"Users: "+ st.users+"\n"
		+"Channels: "+ st.channels+"\n\n"
		+"**Bot Usage**\n "
		+"Memory Usage: "+Math.floor(process.memoryUsage().heapTotal / 1000 / 1000) +" MB";

	for(var i in statfunctions)
	{
		msg = msg + statfunctions[i]();
	}
	return msg;
}

function say(m, str)
{
	bot.createMessage(m.channel.id, {content: str, disableEveryone: true});
}

global.setupStatisticCallback = function(cb)
{
	statfunctions.push(cb);
}

function testRegExp(m)
{
	// /^([a-zA-Z0-9\-\_]*)+$/
	var c = m.content.split(" ");
	if(c[1] == undefined || c[2] == undefined){
		bot.reply(m, "Usage: !regexp <expression> <text>");
		return;
	}
	var reg = new RegExp(c[1]);
	var txt = m.content.substring(c[0].length+c[1].length+2);
	if(reg.test(txt) == false){
		bot.reply(m, "It does not match. `"+txt+"`");
	} elsebot.reply(m, "It matches."); {
		bot.reply(m, "It matches.");
	}
}

function getStats()
{
	var stats = {
		servers: 0,
		channels: 0,
		users: 0
	};
	stats.users = bot.users.map(g=>g.id).length;
	stats.servers = bot.guilds.map(g=>g.id).length;
	
	bot.guilds.map(g=>{
		stats.channels+=g.channels.map(c=>c.id).length;
	})
	return stats;
}

function getChannel(serverID, channelID)
{
	for(var i in bot.guilds){
		if(bot.guilds[i] != undefined)
		{
			if(bot.guilds[i].id == serverID)
			{
				for(var c in bot.guilds[i].channels)
				{
					if(bot.guilds[i].channels[c] != undefined)
					{
						if(bot.guilds[i].channels[c].id == channelID)
						{
							return bot.guilds[i].channels[c];
						}
					}
				}
			}
		}
	}
	return false;
}

function stats(m){
	var servers = bot.guilds.map(g=>g.id).length;
	var users = bot.users.map(g=>g.id).length;
	var user = bot.users.get("80031146431225856");
	bot.reply(m, ", **About the bot** "
		+"\n**"+users+"** users across **"+servers+"** guilds."
		+"\nDatabase: MariaDB"
		+"\nDeveloper: **"+user.username+"**#"+user.discriminator+""
	);
}

function ignoreLog(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	
	
	var c = m.content.split(" ");
	if(c[1] == undefined || c[1] == "" || c[2] == undefined){
		bot.reply(m, "Usage: !ignorelogging <type> <id>\nE.g. !ignorelogging server 1234 - 1234 would be the server ID.\n Types: server|s, channel|c, user|u");
		return;
	} else if(c[1] == "server" || c[1] == "s"){
		sql.addIgnoredServer(c[2]);
		bot.reply(m, "Ignoring that server ID in the logs from now on.");
	} else if(c[1] == "channel" || c[1] == "c"){
		sql.addIgnoredChannel(c[2]);
		bot.reply(m, "Ignoring that channel ID in the logs from now on.");
	} else if(c[1] == "user" || c[1] == "u"){
		sql.addIgnoredUser(c[1]);
		bot.reply(m, "Ignoring that user ID in the logs from now on.");
	}
}

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
function checklogs(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	
	
	var c = m.content.split(" ");
	if(c[1] == "count"){
		var q = m.content.substring(18);
		if(c[2] == undefined || c[2] == ""){
			q = "";
		} 
		
		sql.countlogs(q, function(success, result){
			if(success){
				bot.reply(m, "Successful query. \n Rows matching this criteria: "+result[0]["COUNT(*)"]+"");
			} else {
				bot.reply(m, "SQL Error: "+result);	
			}
		});
	} else if(c[1] == "latest"){
		var q = m.content.substring(19);
		sql.getlogs(q, function(success, result){
			if(success){
				var str = "";
				var omitted = 0;
				for(var i in result){
					var user = bot.users.get("id", result[i].user_id);
					var uname = "**[Not found]**"
					if(user){
						uname = user.username+"#"+user.discriminator+" ("+user.id+") ";
					}
					var mmm = "";
					if(result[i].message.length > 200){
						mmm = result[i].message.substring(0,200) +" ...";
					} else {
						mmm = result[i].message;
					}
					var cl = uname+" ("+formatTime(result[i].timestamp)+") said: \n` "+mmm.replace("`", " ")+" `\n\n";
					if(str.length + cl.length < 1920){
						str = str + cl;
					} else {
						omitted++;
					}
				}
				var str2 = "";
				if(omitted > 0){
					str2 = omitted +" results not shown due to length.";
				}
				bot.reply(m, "Successful query. "+str2+" \n Messages found:\n\n"+str);
			} else {
				bot.reply(m, "SQL Error: "+result);	
			}
		});
	} else if(c[1] == "channel_query"){
		var ch = [];
		var srv = bot.guilds.get(m.channel.guild.id);
		var sv = srv.channels.map(r=>r);
		for(var a in sv){
			if(sv[a] != undefined){
				if(sv[a].id != undefined){
					ch.push(sv[a].id);
				}
			}
		}
		
		bot.reply(m, ch.join(","));
	}
}

function clearlogs(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	
	var c = m.content.split(" ");
	var q = m.content.substring(c[0].length + 1);
	sql.clearlogs(q, function(success, result){
		if(success){
			bot.reply(m, "Successfully removed "+result.affectedRows+" chat logs.");
		} else {
			bot.reply(m, "SQL error: "+result);	
		}
	});
}

function searchServers(m)
{
	var c = m.content.substring(7).split(" ");
	if(c[1] == undefined || c[1] == ""){
		bot.reply(m, libtext.search_query);
		return;
	}
	var reg = new RegExp("^[a-zA-Z\_]+$");
	
	if(c.length > dsettings.max_tags){
		bot.reply(m, "The maximum tags are "+dsettings.max_tags+", but you're searching with more.");
		return;
	}
	for(var i in c){
		if(c[i].length > 0){
			if(c[i].length > 24){
				bot.reply(m, "Tags can be a maximum of 24 characters. Referencing '"+c[i]+"'");
				return;
			}
			if(reg.test(c[i]) == false){
				bot.reply(m, "The tag '"+ c[i] +"' does not match the proper tag formatting.");
				return;
			}
		}
	}
	
	sql.searchWithTags(c, 1, function(success, servers){
		if(!success){ bot.reply(m, "Internal query error. ", servers); return ;}
		
		var srv = [];
		for(var i in servers){
			var sv = serverInfo(servers[i].server_id);
			var hasinv = "no";
			if(servers[i].invite != null){
				hasinv = "yes";
			}
			var desc = servers[i].description || "No description set!";
			srv.push("**"+sv.name+"** ("+sv.id+") \n Description: "+desc+" \n Has invite link: "+hasinv);
		}
		var str = srv.join("\n");
		bot.reply(m, "Servers found: \n "+str);
	});
	
}

function getInfo(m)
{
	var c = m.content.split(" ");
	if(c[1] == undefined){
		bot.reply(m, "Usage: !serverinfo <server Id>");	
		return;
	}
	var info = serverInfo(c[1]);
	if(info != null){
		bot.reply(m, "\n**Server Info** ``` Name: "+info.name+" \n Region: "+info.region+" \n Users: "+info.users+" ```");	
	} else {
		bot.reply(m, "The server was not found.");	
	}
}

function displayServerInfo(m)
{
	var c = m.content.split(" ");
	if(c[1] == undefined){
		bot.reply(m, "Usage: !info <server ID> - Displays information about the specific server and shows an invite link if it has one.")
		return;
	}
	var s = serverInfo(c[1]);
	if(s == null){
		bot.reply(m, "The server was not found, or the bot is not a part of it.");
	} else {
		var reg = new RegExp("^[0-9]+$");
		if(reg.test(c[1]) == false){
			bot.reply(m, "Please enter a valid server ID.");
			return;
		}
		sql.getServerInfo(c[1], function(suc, server){
			if(!suc){ bot.reply(m, libtext.internal_error); return; }
			var desc = null;
			if(server != null){
				desc = server.description;	
				bot.reply(m, "Here is the information about the server\n **"+s.name+"** \n Description: "+desc+"\n\n Invite Link: "+server.invite);
			} else {
				bot.reply(m, "No information found on the server.");
				
			}
			
		})
	}
}

function serverInfo(serverid)
{
	for(var s in bot.guilds){
		if(bot.guilds[s] != undefined){
			if(bot.guilds[s].id != undefined && bot.guilds[s].id == serverid){
				return {
					id: serverid,
					name: bot.guilds[s].name,
					region: bot.guilds[s].region,
					icon: bot.guilds[s].icon,
					users: bot.guilds[s].members.length
				}
			}
		}
	}
	return null;
}

function channelInfo(m)
{
	var c = m.content.split(" ");
	var channelId = c[1];
	for(var s in bot.guilds){
		if(bot.guilds[s] != undefined){
			if(bot.guilds[s].id != undefined){
				for(var i in bot.guilds[s].channels){
					if(bot.guilds[s].channels[i] != undefined && bot.guilds[s].channels[i].id == channelId){
						bot.reply(m, "Server is "+	bot.guilds[s].name +" ["+ bot.guilds[s].id +"]");
						return;
					}
				}
			}
		}
	}
	bot.reply(m, "Server was not found with channel ID.");
}

function userids(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	
	
	var str = "";
	for(var i in m.mentions){
		str = str + "\n"+m.mentions[i].id+" :: "+m.mentions[i].username;
	}
	
	bot.reply(m, "Here is a list for you: ```"+str+"```");	
}

function ReloadDBData(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	
	
	sql.reloadDBData();
	bot.reply(m, "Reloaded data from file.");
}

function SaveDBData(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	
	
	sql.saveDBData();	
	bot.reply(m, "Saved data to file.");
}

function togglelogging(m){
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}
	
	var c = m.content.split(" ");
	if(c[1] == "1"){
		global.bot.logging = true;
		bot.reply(m, "Enabled option.");
	} else if(c[1] == "0"){
		global.bot.logging = false;
		bot.reply(m, "Enabled option.");
	}
}

function getUserVoiceChannel(id){
	for(var i in bot.guilds){
		if(bot.guilds[i] != undefined){
			var mm = bot.guilds[i].members;
			for(var c in mm){
				if(mm[c] != undefined && mm[c].voiceChannel != null && mm[c].id == id){
					return mm[c].voiceChannel;
				}
			}
		}
	}
}

function voiceCon(id){
	for(var i in bot.voiceConnections){
		if(bot.voiceConnections[i] != undefined && bot.voiceConnections[i].voiceChannel != undefined && bot.voiceConnections[i].voiceChannel.id == id){
			return bot.voiceConnections[i];
		}
	}
	return null;
}

function playaudio(m){
	var vc = getUserVoiceChannel(m.author.id);
	//vc.id
	
	if(vc != undefined){
		var con = voiceCon(vc.id);
		if(con == undefined){
			bot.joinVoiceChannel(vc, function(err, con){
				if(!err){
					var au = m.content.substring(6);
					con.playFile("./sound/"+au, (err, intent) => {
						
						intent.on('end', () => {
							con.destroy();
							console.log("Ayy lmao");
						});
					});
				}
			});
		} else {
			if(!con.playing){
				var au = m.content.substring(6);
				con.playFile("./sound/"+au, (err, intent) => {
					intent.on('end', () => {
						con.destroy();
						console.log("Ayy lmao");
					});
				});	
			}
		}

	}
}

function kill()
{
	var vc = getUserVoiceChannel(m.author.id);
	bot.leaveVoiceChannel(vc);
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}
	for(var i in bot.voiceConnections){
		if(bot.voiceConnections[i] != undefined && bot.voiceConnections[i].voiceChannel != undefined){
			bot.voiceConnections[i].destroy();
		}
	}
}

function listaudio(m){
	var fls = fs.readdirSync("./sound/");
	var msg = "";
	for(var i in fls){
		msg = msg +fls[i]+"\n";
	}
	bot.createMessage(m.channel, "Files found: \n```"+msg+"```");
}

function goodshit(m){
	var msg = "👌👀👌👀👌👀👌👀👌👀 good shit go౦ԁ sHit👌 thats ✔ some good👌👌shit right👌👌there👌👌👌 right✔there ✔✔if i do ƽaү so my self 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 👌👌 👌НO0ОଠOOOOOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ👌 👌👌 👌 💯 👌 👀 👀 👀 👌👌Good shit";
	bot.createMessage(m.channel, msg);
}

function edgy(m){
	var msg = "💉🔪 💉🔪💉🔪edgy shit edgY sHit 🔪thats 🔫some edgy💉💉 shit right 🔪th🔪 ere💉💉💉 right there 🚬🚬if i do ƽaү so my selｆ 🔫i say so 🔫 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ🔫 🔪🔪🔪НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ🔪🔪🔪 🔫 💉💉 🔪🔪 Edgy shit";
	
	bot.createMessage(m.channel, msg);
}

function justright(m){
	bot.reply(m, "✋😩👌");
}

function cena(m)
{
	var vc = getUserVoiceChannel(m.author.id);
	if(vc != undefined){
		bot.joinVoiceChannel(vc, function(err, con){
			if(!err){
				con.playFile("./sound/cena.ogg", (err, intent) => {
					intent.on('end', () => {
						con.destroy();
					});
				});	
			}
		});
	}
}

function invite(m)
{
	bot.reply(m, libtext.invite);
}

function editname(m)
{
	var bot = bot = global.modules["discordbot"].bots["bot"];
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}
	
	var u = m.content.substring(5);
	bot.setUsername(u)
	bot.reply(m, "Set the bots name to "+u)
}

function status(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}
	
	bot.setPlayingGame(m.content.substring(7));
	bot.reply(m, "Set the new status.");
}

function avatar(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}
	var c = m.content.split(" ");
	

	fs.readFile("./data/avatar.png", function(err, rp){
		if(err){
			bot.reply(m, "Failed to set avatar, path failed.");
		} else {
			
			bot.reply(m, "Set the new avatar.");
			bot.setAvatar(rp);
		}
	});
}

function evaluate(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
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

function displayServers(m)
{
	var str = "";
	for(var i in bot.guilds){
		if(bot.guilds[i] != undefined && bot.guilds[i].id != undefined){
			str = str + bot.guilds[i].name+" - "+bot.guilds[i].id+"\n";
		}
	}
	bot.reply(m, str);
}

function reactionChoice(m, str)
{
	var num = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
	var question = str.split(":")[0];
	var str2 = str.split(":")[1];
	var opt = str2.split(";");
	if(opt.length < 2 || opt.length > 9){
		bot.reply(m, "You must provide at least 2 options, and no more than 9");
	}
	var out = "**"+question+"**";
	for(var i in opt){
		out+="\n :"+num[i]+": "+opt[i];
	}
	bot.reply(m, out);
}

function reactionPoll(m, str)
{
	bot.createMessage(m.channel.id, "**"+str+"**").then((m2)=>{
		bot.addMessageReaction(m2.channel.id, m2.id, encodeURIComponent("☑"));
		setTimeout(()=>{1
			bot.addMessageReaction(m2.channel.id, m2.id, encodeURIComponent("❌"));
		}, 500);
		setTimeout(()=>{
			bot.editMessage(m2.channel.id, m2.id, "**"+str+"** (Poll ID: "+m2.id+")");
		}, 10000);
	});
}

function reactionResults(m, str)
{
	var result = {
		yes: -1,
		no: -1
	};
	var temp = {};
	bot.getMessage(m.channel.id, str).then((m2)=>{
	  bot.getMessageReaction(m.channel.id, m.id, encodeURIComponent("☑"), 500).then((users)=>{
	  	for(var i in users){
	  		temp[users[i].id] = 1;
	  		result.yes++;
	  	}

	  	bot.getMessageReaction(m.channel.id, m.id, encodeURIComponent("❌"), 500).then((users2)=>{
	  		for(var i in users2){
	  			if(temp[users2[i].id] !== undefined){
	  				delete temp[users2[i].id];
	  				result.yes--;
	  			} else {
	  				result.no++;
	  				temp[users2[i].id] = -1;
	  			}
	  		}

	  		bot.reply(m, "**Results: **\n ☑ "+result.yes+"\n ❌ "+result.no);
	  	});
	  });
	});
	
}