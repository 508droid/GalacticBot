/*
	Server Utils
		Adds handy functions to manage servers.
*/

exports.ModTypeColors = {
	"1": 0x7F0000,
	"2": 0xCE6118,
	"3": 0xCCAA00,
	"4": 0x0094FF,
	"5": 0x267F00,
	"10": 0x7F0000
}
exports.BotModeration = {}; // Stores moderation actions recently.
exports.AddPoint = (guild, member)=>{
	if(BotModeration[guild.id] == undefined){
		BotModeration[guild.id] = {};
	}
	if(BotModeration[guild.id][member.id] == undefined)
	{
		BotModeration[guild.id][member.id] = {
			points: 0
		}
	}
	BotModeration[guild.id][member.id]++;
}

// Mutes the member using the staff Id as the user who did it.
// Guild, Member, Staff<Member>, reason
exports.MuteMember = (guild, member, staff, reason)=>{
	var settings = _s[m.channel.guild.id].settings;
	var user = m.author;
	var member = m.member;
	var modlog = {
		user: member.id, 
		staff: staff.id, 
		server: guild.id, 
		reason: reason, 
		type: 4
	};
	var mlogs = [modlog];
	var newroles = member.roles;
	newroles.push(settings.muted);
	QueueAction("unmute", 84600, {
		user_id: member.id,
		guild: guild.id
	});

	bot.editGuildMember(guild.id, member.id, {
		roles: newroles
	}).then(()=>{
		sql.addModerationLogs(mlogs, (success, result)=>{
			if(success){
				var modstr = libtext.logs.mute.replace(/\{staff\}/g, getFU(staff.id))
					.replace(/\{user\}/g, getFU(member.id))
					.replace(/\{reason\}/g, reason)
					.replace(/\{caseid\}/g, result[0]);
				exports.modlog(guild, modstr, result[0]);
			}
		});
	}, ()=>{
		exports.throwError(guild, "The bot tried to mute "+getFU(member.id)+" because `"+reason+"`, but is lacking the ability to assign the mute role properly, or another error occured.");
	});
}

// 

// Creates a server moderation log
exports.modlog = (server, str, caseId)=>
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

// Returns the format string for whatever type of moderation number.
exports.getFormat = function(moderation)
{
	if(moderation.mod_type == 1){
		return libtext.logs.ban;
	} else if(moderation.mod_type == 2){
		return libtext.logs.kick;
	} else if(moderation.mod_type == 3){
		return libtext.logs.warn;
	} else if(moderation.mod_type == 4){
		return libtext.logs.mute;
	} else if(moderation.mod_type == 10){
		return libtext.logs.unban;
	} else {
		return "Unable to find format for "+moderation;
	}
}

// Gets a formatted user output like Username#1337
exports.formatUser = function(uid)
{
	var userm = bot.users.get(uid);
	if(userm == null){
		if(usercache[uid] !== undefined){
			return "**"+usercache[uid]+"**";
		}
		return "Missing user";
	} else {
		return ""+userm.username.replace(/`/g, "\`") +"#"+userm.discriminator+"";
	}
	return "Missing";
}

// Creates a formatted mod case using Embeds.
/*
	moddata {
		staff <user ID>
		user <user ID>
		reason <String>
		id <case ID>
		type <moderation type>
		format <log format>
	}
*/
exports.CaseLog = function(moddata)
{
	var staff = libbot.ResolveUser(moddata.staff);
	var user = libbot.ResolveUser(moddata.user);
	
	var formatted = moddata.format.replace(/\{staff\}/g, exports.formatUser(moddata.staff))
		.replace(/\{user\}/g, exports.formatUser(moddata.user))
		.replace(/\{reason\}/g, moddata.reason)
		.replace(/\{caseid\}/g, moddata.id)
		.replace(/\{userid\}/g, moddata.user)
		.replace(/\{length\}/g, moddata.length);
	
	var embed = {
		color: exports.ModTypeColors[moddata.type.toString()],
		author: {
			name: user.username+"#"+user.discriminator,
			icon_url: user.avatarURL
		},
		title: '',
		url: '',
		description: formatted,
		fields: [],
		timestamp: new Date(),
		footer: {
		icon_url: staff.avatarURL,
		text: staff.username+"#"+staff.discriminator +" (STAFF)"
		}
	};
	
	return {
		content: "",
		embed: embed
	}
}

// Bot error
exports.throwError = (guild, message)=>{
	if(_s[server.id].settings.error == undefined){
		bot.createMessage(guild.defaultChannel.id, message);
	} else if(_s[server.id].settings.error == Enum.ErrorReporting.owner){
		var owner = bot.users.get(guild.ownerID);
		owner.getDMChannel().then((dm)=>{
			bot.createMessage(dm.id, message);
		});
	}
}