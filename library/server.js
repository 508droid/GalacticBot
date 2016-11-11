/*
	Server Utils
		Adds handy functions to manage servers.
*/

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