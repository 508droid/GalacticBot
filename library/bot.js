exports.ResolveUser = function(input)
{
	var userreg = new RegExp(/<@!?([0-9]{17,21})>/);
	var userreg2 = new RegExp(/id\:([0-9]{17,21})/);
	var userid = input;
	if(userreg.test(input)){
		var reg = userreg.exec(input);
		userid = reg[1];
	} else if(userreg2.test(input)){
		userid = userreg2.exec(input)[1];
	}

	var user = bot.users.get(userid);
	if(user == undefined){
		return false;
	} else {
		return user;
	}
}

exports.ResolveChannel = function(input)
{
	var regex = new RegExp(/<\#([0-9]{17,21})>/);
	var id = input;
	if(regex.test(input)){
		id = regex.exec(input)[1];
	}

	var guildid = bot.channelGuildMap[id];
	var guild = bot.guilds.get(guildid);
	if(guildid == undefined || guild == undefined){
		return false;
	}
	var channel = guild.channels.get(id);
	if(channel == undefined){
		return false;
	} else {
		return channel;
	}

}

exports.ResolveInt = function(input)
{
	var regex = new RegExp(/([0-9]*)/);
	if(regex.test(input)){
		return parseInt(input);
	} else {
		return false;
	}
}

exports.ResolveBool = function(input)
{
	if(input == "true" || input == "1" || input == "on" || input == "t" || input == "yes"){
		return true;
	} else {
		return false;
	}
}

exports.ResolveRole = function(input, guild)
{
	var r = guild.roles.map(g=>g);
	for(var i in r){
		if(r[i].name.toLowerCase() == input.toLowerCase()){
			return r[i];
		}
	}
	return false;
}