exports.module = {
	name: "convert-module",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};
var fork = require('child_process').fork;
var channels = ["187059970422865920","222578714095910913","179764110613807105"];
exports.module.init = ()=>{
	bot.on("messageCreate", OnMessageReceived);


};

function OnMessageReceived(message)
{
	if(channels.indexOf(message.channel.id) > -1){
		if(message.attachments.length > 0){
			var url = message.attachments[0].url;
			if(url.substring(url.length-4) == ".wmv"){
				var output = "";
				var runscript = fork(__dirname+'/../html5convert.js', {execArgv: ["--max-old-space-size=300"], silent: false});
				runscript.on('message', function(r) {
					if(r.status == 200){
						try {
							bot.deleteMessage(message.channel.id, message.id);
							bot.createMessage(message.channel.id, "**Auto converted video** uploaded by "+message.author.username+"#"+message.author.discriminator+"\n"+message.content+"\nhttp://media.galacticarc.ca/"+message.id+".webm");
							runscript.kill();
						} catch(err){

						}
					}
				});
				runscript.send({url: url, name: message.id});
			}

		}
	}
}