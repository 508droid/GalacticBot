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
			var j = JSON.stringify(req.body);
			console.log("New discourse post ");
			var type = req.headers["x-discourse-event-type"];
			var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			if(type == "topic"){
				// New topic posted
				var title = j.title;
				var user = j.user;
			} else if(type == "post"){
				
			}
		}
	} catch(err){
		console.log(err);
	}
}