exports.module = {
	name: "roblox-module",
	requires: [],
	libraries: [],
	failed: false
};

var request = require('request');
var cheerio = require("cheerio");

String.prototype.decodeHTML = function() {
    var map = {"gt":">" /* , … */};
    return this.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);?/gi, function($0, $1) {
        if ($1[0] === "#") {
            return String.fromCharCode($1[1].toLowerCase() === "x" ? parseInt($1.substr(2), 16)  : parseInt($1.substr(1), 10));
        } else {
            return map.hasOwnProperty($1) ? map[$1] : $0;
        }
    });
};

exports.module.init = ()=>
{
	discord.hookprefix(socialdiscord, "-");
	discord.hookcommand(socialdiscord, "roblox", Roblox, {version: 2});

	socialdiscord.check = discordbot.check;
}

function Roblox(m, str)
{
	var args = str.split(" ");
	if(args[0] == "user"){
		if(args[1] == "exists"){
			request('http://api.roblox.com/users/get-by-username?username='+args[2], 
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var found = JSON.parse(body);
					if(found.success){
						bot.reply(m, "User does exist");
					} else {
						bot.reply(m, "User does not exist.");
					}
				}
			});
		} else if(args[1] == "info"){
			var userid = null;
			request('http://api.roblox.com/users/get-by-username?username='+args[2], 
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var found = JSON.parse(body);
					if(found.success == undefined){
						userid = found.Id;
						request("https://www.roblox.com/users/"+userid+"/profile", 
							function (error2, response2, body2) {
								if (!error2 && response2.statusCode == 200) {
									var $ = cheerio.load(body2);
									var status = $("[profile-header-data]").attr("data-statustext");
									var username = $("[profile-header-data]").attr("data-profileusername");
									var pastnicknames = $(".tooltip-pastnames").attr("title");
									var fc1 = $("[profile-header-data]").attr("data-friendscount");
									var fc2 = $("[profile-header-data]").attr("data-followingscount");
									var fc3 = $("[profile-header-data]").attr("data-friendscount");
									var avatar = $(".avatar-card-image.profile-avatar-thumb").attr("src");
									var bio = $(".profile-about-content-text").html();
									var ret = "Results: "
										+"\nUsername: "+username
										+"\nPrevious usernames: "+pastnicknames
										+"\nUser ID: "+userid
										+"\nStats: "+fc1+" Friends, "+fc2+" Followers, Following "+fc3+"."
										+"\nStatus: "+status
										+"\nAvatar: "+avatar;
									bio = bio.decodeHTML();
									if(bio.length + ret.length > 2000){
										bot.createMessage(m.channel.id, ret).then((msg)=>{
											if(bio.length > 2000){
												bio = bio.substring(0,1900)+"...";
											}
											bot.createMessage(m.channel.id, "Bio: ```"+bio+"```");
										});
									} else {
										if(bio != ""){
											ret+="\nBio: ```"+bio+"```";
										}
										
										bot.reply(m, ret);
									}
									delete body2;
									delete body;
									delete response;
									delete response2;
								} else if(response2.statusCode == 404){
									bot.reply(m, "User is banned or does not exist.");
								} else {
									bot.reply(m, "Internal error.");
								}
							}
						);
					} else {
						bot.reply(m, "User does not exist.");
					}
				} else {
					bot.reply(m, "Web page returned HTTP "+response.statusCode);
				}
			});
		}
	}
}