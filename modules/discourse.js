exports.module = {
	name: "discourse",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var discourse = require("../data/discourse.json");
var bcrypt = require("bcrypt-node");
var http = null;
var express = require("express");
var bodyParser = require('body-parser');
var request = require("request");
var fs = require("fs");

exports.module.preinit = ()=>{
	global.commandVerify = commandPreCheck;
}

exports.module.init = ()=>{
	// Saving loop
	setInterval(()=>{
		fs.writeFileSync("./data/discourse.json", JSON.stringify(discourse));
	}, 120000);
}

exports.module.preinit = function(){
	app = express();
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.listen(6660);
	app.get('/', rootpath);
	app.post('/discourse/*', discourseEvent);
	
};

function rootpath(req, res){
	res.send('No page to be displayed.');
}

function discourseEvent(req,res)
{
	try {
		if(req.headers["x-discourse-event-type"] == undefined){
			res.status(403).send();
			return;
		} else {
			
			res.status(200).send();
			var j = req.body;
			var type = req.headers["x-discourse-event-type"];
			var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			if(type == "topic"){
				var p = j.topic.post_stream.posts;
				var t = p[p.length-1];
				// New topic posted
				var title = j.topic.title;
				var user = t.username;
				if(user == "system"){
					return;
				}
				var url = "<http://stylis-studios.com/t/"+t.topic_slug+"/"+t.topic_id+">";
				request({
				    url: "https://canary.discordapp.com/api/webhooks/238028225845002241/92UtzXDqfoVZVylhKIVQJ4nBSnUKPImJsTubxddxk3j5VlcldaF_vCTLiphlii547rHn",
				    method: "POST",
				    json: true,
				    headers: {
				        "content-type": "application/json;",
				    },
				    body: {
				    		content: "**A new topic was posted!**"
				    		+"\n*"+title+"*"
				    		+"\nPosted by "+user
				    		+"\n"+url
				    }
				}, function(error, response ,body){
					if(error){
						console.log(response.statusCode,error);
					} else {
						
					}
				});
			} else if(type == "post"){
				var p = j.topic.post_stream.posts;
				var t = p[p.length-1];
				//fs.writeFileSync("discoursestuff.json", JSON.stringify(j));
				// New topic posted
				var title = j.topic.title;
				var user = t.username;
				if(user == "system"){
					return;
				}
				var pnum = t.post_number;
				var url = "<http://stylis-studios.com/t/"+t.topic_slug+"/"+t.topic_id+"/"+pnum+">";
				request({
				    url: "https://canary.discordapp.com/api/webhooks/238028225845002241/92UtzXDqfoVZVylhKIVQJ4nBSnUKPImJsTubxddxk3j5VlcldaF_vCTLiphlii547rHn",
				    method: "POST",
				    json: true,
				    headers: {
				        "content-type": "application/json;",
				    },
				    body: {
			    		content: "**"+user+"** has replied to "
			    		+"*"+title+"*"
			    		+"\n"+url
				    }
				}, function(error, response ,body){
					if(error){
						console.log(response.statusCode,error);
					} else {
						
					}
				});
			}
		}
	} catch(err){
		console.log(err);
	}
}