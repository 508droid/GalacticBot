exports.module = {
	name: "filter-links",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var tldlist = require("/home/semaphorism/servers/tld.json");
var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
var LinkRegex = new RegExp(expression);
var Responses = {
	unsafe: "**The following domains could be unsafe**, read it over to ensure its the real domain, or not malicious in any way.\n"
}

function getDomain(url) {
    var result;
    var match;
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/mi)) {
        result = match[0]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[0]
        }
    }
    return result
}

function getDomains(text)
{
	var m2 = text.match(LinkRegex);
	var domains = [];
	for(var i in m2){
		var l = getDomain(m2[i]);
		var sp = l.split(".");
		if(tldlist.indexOf(sp[sp.length-1].toLowerCase()) > -1){
			if(domains.indexOf(l.toLowerCase())==-1){
				domains.push(l.toLowerCase());
			}
		}
	}
	var q = "?,".repeat(domains.length);
	q=q.substring(0, q.length-1);
	return [domains, domains.length, q];
}

// Returns <int> amount of blacklisted domains are in the list sent.
function getBlacklisted(domains, settings, message, callback)
{
	if(settings.global === false){
		sqlcon.query("SELECT `domain` FROM `links` WHERE (`domain` IN (?) AND `server_id`=?) AND `allowed`='-1' LIMIT 10;", 
			[domains[0], message.channel.guild.id], function(err, result) {
				if(err){
					console.log(err);
					callback(false);
				} else {
					callback(true, result.length, result);
				}
		});
	} else {
		sqlcon.query("SELECT `domain` FROM `links` WHERE `domain` IN (?) (`server_id`=? OR `server_id`=?) AND `allowed`='-1' LIMIT 10;", 
			[domains[0], message.channel.guild.id, 0], function(err, result) {
				if(err){
					console.log(err);
					callback(false);
				} else {
					callback(true, result.length, result);
				}
		});
	}
}

function getWhitelisted(domains, settings, message, callback)
{
	if(settings.global === false){
		sqlcon.query("SELECT `domain` FROM `links` WHERE (`domain` IN (?) AND `server_id`=?) AND `allowed`='1' LIMIT 10;", 
			[domains[0], message.channel.guild.id], function(err, result) {
				if(err){
					console.log(err);
					callback(false);
				} else {
					callback(true, result.length, result);
				}
		});
	} else {
		sqlcon.query("SELECT `domain` FROM `links` WHERE `domain` IN (?) (`server_id`=? OR `server_id`=?) AND `allowed`='1' LIMIT 10;", 
			[domains[0], message.channel.guild.id, 0], function(err, result) {
				if(err){
					console.log(err);
					callback(false);
				} else {
					callback(true, result.length, result);
				}
		});
	}
}

var LinkFilter = {
	name: "links",
	description: "A filter for handling links on servers, fully customizable.",
	settings: {
		type: "The type of link filter to use.",
		min: "The minimum amount of links before the bot checks them. Default: 1",
		max: "The maximum amount of links in a message. Default: 10, maximum: 5. This helps prevent to much load on the bot.",
		global: "Whether to use the global blacklist/whitelist. Default: true"
	}
}


// Server settings object
LinkFilter.CreateSettings = ()=>{
	return {
		enabled: false,
		actions: [],
		type: Enum.LinkFilterType.blacklist,
		global: true
	}
}

// Fired when a server recieves a filter request.
// Message Object, Server settings Object
LinkFilter.OnMessage = (message, settings)=>{
	if(message.member == undefined){ return; }
	var domainlist = getDomains(message.content);
	if(domainlist[1] < settings.min || domainlist[1] === 0){
		return;
	}
	if(domainlist[1] > settings.max || domainlist[1] > 10){
		modules.filters.HandleAction(message, Enum.Actions.delete);
		return;
	}
	if(settings.type == Enum.LinkFilterType.blacklist){
		getBlacklisted(domainlist, settings, message, (success, amount, count, domains)=>{
			if(success){
				bot.reply(message, count +" of links are blacklisted.");
			} else {
				bot.reply(message, "Internal SQL error.");
			}
		});
	} else if(settings.type == Enum.LinkFilterType.whitelist){
		getWhitelisted(domainlist, settings, message, (success, amount, count, domains)=>{
			if(success){
				bot.reply(message, count +" of links are whitelisted.");
			} else {
				bot.reply(message, "Internal SQL error.");
			}
		});
	} else {
		bot.reply(message, "No filter type selected.");
	}
};

LinkFilter.SetOption = (settings, option, args, message)=>{
	if(option == "type"){
		var a = args[0];
		if(a == undefined || Enum.LinkFilterType[a] == undefined || a == ""){
			bot.reply(message, "Invalid option, available options: `"+Object.keys(Enum.LinkFilterType).join(", ")+"`");
		} else {
			settings.type = Enum.LinkFilterType[a];
			bot.reply(message, "Set link filter type to `"+Enum.LinkFilterType[a]+"`");
		}
	} else if(option == "min"){

	} else if(option == "global"){
		var opt = libbot.ResolveBool(args[0]);
		settings.global = opt;
		return "Updated global link filter usage to "+opt;
	} else if(option == "whitelist"){
		var a = args[0];
		var domainlist = getDomains(args[0]);
		if(domainlist.length == 0){
			bot.reply(message, "Please provide a proper domain name.");
			return;
		}
		sqlcon.query("SELECT * FROM `links` WHERE `domain`=? AND `server_id`=? LIMIT 10;", 
			[a, message.channel.guild.id], function(err, result) {
				if(err){
					console.log(err);
					bot.reply(message, "Internal error fetching domain, please report this issue. ");
				} else {
					if(result.length == 0){
						// add domain
						sqlcon.query("insert into `links` (`server_id`,`domain`,`allowed`) values (?,?,?);", [message.channel.guild.id, a, 1], function(err,res){
							if(err){
								bot.reply(message, "Internal error saving domain, please report this issue.");
							} else {
								bot.reply(message, "Successfully whitelisted domain `"+domainlist[0]+"`");
							}
						});
					} else {
						sqlcon.query("delete from `links` where `server_id`=? and `domain`=?;", [message.channel.guild.id, a], function(err,res){
							if(err){
								bot.reply(message, "Internal error updating domain data, please report this issue.");
							} else {
								sqlcon.query("insert into `links` (`server_id`,`domain`,`allowed`) values (?,?,?);", [message.channel.guild.id, a, 1], function(err,res){
									if(err){
										bot.reply(message, "Internal error saving domain, please report this issue.");
									} else {
										bot.reply(message, "Successfully whitelisted domain `"+domainlist[0]+"`");
									}
								});
							}
						});
					}
				}
		});
	} else if(option == "blacklist"){
		var a = args[0];
		var domainlist = getDomains(args[0]);
		if(domainlist.length == 0){
			bot.reply(message, "Please provide a proper domain name.");
			return;
		}
		sqlcon.query("SELECT * FROM `links` WHERE `domain`=? AND `server_id`=? LIMIT 10;", 
			[a, message.channel.guild.id], function(err, result) {
				if(err){
					console.log(err);
					bot.reply(message, "Internal error fetching domain, please report this issue. ");
				} else {
					if(result.length == 0){
						// add domain
						sqlcon.query("insert into `links` (`server_id`,`domain`,`allowed`) values (?,?,?);", [message.channel.guild.id, a, -1], function(err,res){
							if(err){
								bot.reply(message, "Internal error saving domain, please report this issue.");
							} else {
								bot.reply(message, "Successfully blacklisted domain `"+domainlist[0]+"`");
							}
						});
					} else {
						sqlcon.query("delete from `links` where `server_id`=? and `domain`=?;", [message.channel.guild.id, a], function(err,res){
							if(err){
								bot.reply(message, "Internal error updating domain data, please report this issue.");
							} else {
								sqlcon.query("insert into `links` (`server_id`,`domain`,`allowed`) values (?,?,?);", [message.channel.guild.id, a, -1], function(err,res){
									if(err){
										bot.reply(message, "Internal error saving domain, please report this issue.");
									} else {
										bot.reply(message, "Successfully blacklisted domain `"+domainlist[0]+"`");
									}
								});
							}
						});
					}
				}
		});
	} else if(option == "action"){

	}
};

exports.module.init = ()=>{
	Enum.LinkFilterType = {
		blacklist: 1,
		whitelist: 2,
		custom: 3
	}

	RegisterFilter(LinkFilter);
}