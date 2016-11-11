exports.module = {
	name: "filters",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

global.MessageFilters = {};
var filters = {};
var removalQueue = {};

exports.module.preinit = ()=>{
	Enum.NSFW = {
		allow: 1,
		deny: 0
	}
	
	Enum.SettingType = {
		Integer: 1,
		String: 2,
		StringEnum: 3,
		Boolean: 4,
		Custom: 5
	}
}

exports.module.init = ()=>{

	bot.on("messageCreate", exports.OnMessageReceived);
	bot.on("messageUpdate", exports.OnMessageUpdate);
	bot.on("messageDelete", exports.OnMessageRemoved);
}

var MessageCache = {};
var Responded = {};

exports.OnMessageUpdate = function(m, old)
{
	if(old != null && m.content == old.content){
		return;
	}

	exports.OnMessageReceived(m);
}

exports.OnMessageRemoved = function(m)
{
	if(Responded[m.id] == undefined || Responded[m.id] == true){ return; }
	else {
		bot.deleteMessage(Responded[m.id][1], Responded[m.id][0]);
	}
}

exports.OnMessageReceived = function(m) // Message
{
	if(m.author.id == bot.user.id){ return; }
	if(_s[m.channel.guild.id] == undefined || _s[m.channel.guild.id].settings == undefined){
		return; // Server data or settings are missing.
	}
	var settings = _s[m.channel.guild.id].settings;
	// Loop through all the filters.
	if(settings.filters == undefined || Object.keys(settings.filters).length == 0){
		return;
	}
	for(var i in MessageFilters){
		// check if settings are missing.
		if(settings.filters[i] == undefined || settings.filters[i].enabled == false){ 
			continue; 
		} 
		var filtersettings = settings.filters[i];
		try {
			MessageFilters[i].OnMessage(m, filtersettings);
		} catch(err){
			console.log(err.stack);
		}
	}
}

// Filter object
global.RegisterFilter = function(fdata)
{
	console.log("Register filter "+fdata.name,JSON.stringify(fdata));
	MessageFilters[fdata.name] = fdata;
}

exports.HandleAction = function(message, action, arg)
{
	var settings = _s[message.channel.guild.id].settings;
	var member = message.member;
	var user = message.author;
	if(action == Enum.Actions.mute) // Mute
	{
		// Add the muted role to the user.
		var bmember = message.channel.guild.members.get(bot.user.id);
		libserver.MuteMember(message.channel.guild, message.member, bot.bmember, "Muted by bot filters.")
		return true;
	}
	else if(action == Enum.Actions.kick) // Kick
	{

		return false;
	}
	else if(action == Enum.Actions.ban) // Ban
	{
		return false;
	}
	else if(action == Enum.Actions.delete) // Ban
	{
		bot.deleteMessage(message.channel.id, message.id);
	}
	return true;
}