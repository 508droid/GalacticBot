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
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[1]
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
			domains.push(l.toLowerCase());
		}
	}
	return [domains, domains.length];
}

var LinkFilter = {
	name: "links",
	settings: {}
}


// Server settings object
LinkFilter.CreateSettings = ()=>{
	return {
		enabled: false,
		actions: [],
		type: Enum.FilterType.default,
		ignore: [],
		ignore_perms: []
	}
}

// Fired when a server recieves a filter request.
// Message Object, Server settings Object
LinkFilter.OnMessage = (message, settings)=>{
	if(message.member == undefined){ return; }
	// if(message.member.permission.json["manageMessages"] == true){
		// return;
	// }
	//console.log(message.content);
	var check = getDomains(message.content);
	if(settings.ml != undefined && check[1] > settings.ml){ // Max links threshold.
		modules.filters.HandleAction(message, settings.action_max);
	} else if(check[1] > 0){
		var q = "?,".repeat(check[0].length);
		q=q.substring(0, q.length-1);
		sqlcon.query("SELECT * FROM `links` WHERE (`domain` IN ("+q+") AND `server_id`='0') LIMIT 30;", check[0], function(err, result) {
			if(err){
				
			} else {
				if(result.length == 0){
					modules.filters.HandleAction(message, Enum.Actions.delete);
				} else {
					var domains = [];
					for(var i in result){
						domains.push(result[i].domain);
					}
					var notfound = [];
					for(var i in check[0]){
						if(domains.indexOf(check[0][i]) == -1){
							notfound.push(check[0][i]);
						}
					}

					if(notfound.length > 0){
						modules.filters.HandleAction(message, Enum.Actions.delete);
					} else {
						modules.filters.HandleAction(message, Enum.Actions.nothing);
					}
				}
			}
		});
	} else {
		return;
	}
};

LinkFilter.SetOption = (settings, option, args)=>{
	
};

exports.module.init = ()=>{
	RegisterFilter(LinkFilter);
}