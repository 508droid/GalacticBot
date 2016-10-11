exports.module = {
	name: "social-module",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

global.socialdiscord = {
	use: "bot",
	name: "social",
	disabled: false
};
var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
var red = require("nraw");
var RedditAPI = new red("Randombot");
var Reddit = {
	subcommands: {}
};

Reddit.Filters = [
	"comments",
	"controversial",
	"hot",
	"gilded",
	"new",
	"promoted",
	"rising",
	"top"
];

exports.module.init = ()=>
{
	discord.hookprefix(socialdiscord, "-");
	discord.hookcommand(socialdiscord, "reddit", Reddit.OnCommand, {version: 2});

	socialdiscord.check = discordbot.check;
}

Reddit.OnCommand = (m, str)=>
{
	var subreddit = str.split(" ")[0];
	var sortopt = str.split(" ")[1];
	if(subreddit == undefined || sortopt == undefined){
		bot.reply(m, "Usage:\n-reddit <subreddit> <sort option>\nSorts: "+Reddit.Filters.join(", "));
		return;
	}
	if(Reddit.Filters.indexOf(sortopt.toLowerCase()) > -1){
		Reddit.GetPosts(m, subreddit, sortopt, str);
	} else {
		bot.reply(m, "Invalid sort option.");
	}
}

Reddit.FinishCommand = (msg, data, str)=>{
    if(data == undefined || data.data == undefined){
        bot.reply(msg, "Reddit or posts not found."); return;
    }
    var c = data.data.children;
    var num = randint(c.length-1);
    if(c[num].data.over_18 == true){
    	bot.reply(msg, "The post returned was marked as NSFW, and this server has NSFW off."); return;
    }
    var txt = ", \n**"+ c[num].data.title +"**\n"+c[num].data.selftext;
    txt=txt.replace(urlRegex, 'Removed link')+" ";
    if(!c[num].data.url.includes("reddit.com")){
        txt+=c[num].data.url;
    }
    if(str.split(" ").indexOf("--source") > -1){
        txt+="\n\n <"+c[num].data.selftext+c[num].data.url+">";
    }
    if(txt.length>2000){
        bot.reply(msg, txt.substring(0,2000));
        for(var i = 1;i<=(Math.ceil(txt.length/2000));i++){
            setTimeout(()=>{
            	bot.createMessage(msg.channel.id, txt.substring(i*2000,(i+1)*2000));
            }, i*1000);
        }
    } else {
        bot.reply(msg, txt);
    }
}

Reddit.GetPosts = (m, subreddit, sort, str)=>
{
	RedditAPI.subreddit(subreddit).sort(sort).limit(10).exec(function(data){
		try {
			Reddit.FinishCommand(m, data, str);
		} catch(err){
			sql.logError(err, m, false);
		}
	});
}