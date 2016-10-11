exports.module = {
	name: "starmade-status",
	requires: ["remotes"],
	libraries: [],
	failed: false
};
global.starmadediscord = {
	use: "bot"
};

var time_now = function(){ return Math.floor(Date.now() / 1000); }
var dsettings = require("../data/discord.json").settings;
var exec = require('child_process').exec;
var bot;
var serverstatus = {};
var statuschannel = null;
var ws = null;
var remote;
var server = null;
var admin = "80031146431225856";
var voicestats = {};
var runscript;

var starmadeserver = {
	online: false,
	players: 0
};
var errors = [];
var fork = require('child_process').fork;

exports.notifyadmin = true;

exports.module.preinit = function(){
	errmsg = require("../data/texts.json");
};

exports.module.init = function(){
	global.modules["discordbot"].hookprefix(global.galacticvoicediscord, "starmade/");
	global.modules["discordbot"].hookcommand(global.galacticvoicediscord, "reset", resetStatus, {version: 2});

	bot = global.modules["discordbot"].bots["bot"];
	ws = global.modules["remotes"];
	//initServer();

};

exports.module.close = function()
{

}

function runSMPinger()
{
	var runscript = fork(directory+'/scripts/starmadeping.js', {execArgv: ["--max-old-space-size=20"], silent: true});
	runscript.on('message', function(r) {
		onServerStatus(r);
	});
	runscript.on("exit", (ec)=>{
		console.log("Starmade process exited");
		delete runscript;
		runSMPinger();
	});
}

function resetStatus(m, str)
{
	
}

function onServerStatus(state)
{
	if(state.error){
	starmadeserver = {
		online: false,
		players: 0,
		version: "-",
		desc: "-"
	};
	var n = time_now();
	errors.push(n);
	var e = errors.length;
	if(e>=3)
	var ers = 0;
	// [1,2,3]
	for(i=e-2;i>=0;i--)
	{
		var w = errors[i];
		var w2 = errors[i+1];
		if(w + 62 > w2)
		{
			ers++;
		}
	}
	if(ers >= 2)
	{
		if(exports.notifyadmin === true)
		{

			bot.createMessage("214811073407090688", "<@&214867915621662720> StarMade server is down!");
			exports.notifyadmin = false;
		}
	}
	last_error = time_now();
	} else {
		starmadeserver = {
			online: true,
			players: state.raw.numplayers,
			version: state.raw.data[3],
			desc: state.raw.description
		};
	}
	var ostr = ":red_circle: ";
	if(starmadeserver.online){
		ostr = " :ballot_box_with_check: ";
	}
	var str = "\n\n  **StarMade Server** (a.galacticarc.ca) \n"+
		ostr+"Online: "+starmadeserver.online+"\n"+
		" :space_invader: Players: "+starmadeserver.players+"\n"+
		" :cyclone: Version: "+starmadeserver.version+"\n"+
		" :speech_balloon: Description: "+starmadeserver.desc+"\n";
		
	str=str+"\n\n";
	bot.editMessage("214872601326125056","214872732331016192", str);
}