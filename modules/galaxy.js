exports.module = {
	name: "galaxy-module",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var _g = null;
var _u = null;
var shiplimit = 500;
var glib = null;
var confirmations = {};
exports.module.preinit = function(){
	
};

exports.module.init = function(){
	discord.hookprefix(galaxydiscord, "$");
	discord.hookprefix(galaxydiscord, "🖕");
	discord.hookprefix(galaxydiscord, "Hitler did **nothing** wrong. ");
	discord.hookcommand(galaxydiscord, "help", helpgalaxy);
	discord.hookcommand(galaxydiscord, "about", aboutgalaxy);
	discord.hookcommand(galaxydiscord, "galaxy", galaxy);
	discord.hookcommand(galaxydiscord, "ships", listships);
	discord.hookcommand(galaxydiscord, "reload", reload);
	discord.hookcommand(galaxydiscord, "sinfo", shipInfo, {version: 2});
	discord.hookcommand(galaxydiscord, "listship", listshiptype, {version: 2});
	
	// Economic commands
	discord.hookcommand(galaxydiscord, "bal", money, {version: 2});
	discord.hookcommand(galaxydiscord, "money", money, {version: 2});
	discord.hookcommand(galaxydiscord, "buyship", buyship, {version: 2});
	discord.hookcommand(galaxydiscord, "totalships", myships, "economy");
	discord.hookcommand(galaxydiscord, "me", mystats, "economy");
	discord.hookcommand(galaxydiscord, "vector", vectors, "admin");
	discord.hookcommand(galaxydiscord, "mine", mine, {version: 2});
	discord.hookcommand(galaxydiscord, "fix", fix, "admin");
	discord.hookcommand(galaxydiscord, "ship", shipid, "economy");
	discord.hookcommand(galaxydiscord, "e", evaluate, {version: 2});
	discord.hookcommand(galaxydiscord, "startcolony", startcolony, "economy");
	discord.hookcommand(galaxydiscord, "createcolony", startcolony, "economy");
	discord.hookcommand(galaxydiscord, "colonies", myColonies, "economy");
	discord.hookcommand(galaxydiscord, "selection", selectiongalaxy);
	discord.hookcommand(galaxydiscord, "warp", warp, {version: 2});
	discord.hookcommand(galaxydiscord, "hailsatan", hailsatan);
	discord.hookcommand(galaxydiscord, "namecolony", nameColony);
	discord.hookcommand(galaxydiscord, "sector", SectorInfo);
	discord.hookcommand(galaxydiscord, "claimsector", claimSector);
	discord.hookcommand(galaxydiscord, "createfleet", createFleet);
	discord.hookcommand(galaxydiscord, "listfleets", fleets, {version: 2});
	discord.hookcommand(galaxydiscord, "fleet", fleetinfo, {version: 2});
	discord.hookcommand(galaxydiscord, "colony", colonyinfo);
	discord.hookcommand(galaxydiscord, "fundcolony", fundcolony, {version: 2});
	discord.hookcommand(galaxydiscord, "fundall", fundAllColonies, {version: 2});
	discord.hookcommand(galaxydiscord, "renamefleet", renameFleet);
	
	discord.hookcommand(galaxydiscord, "fleetinvite", inviteToFleet);
	discord.hookcommand(galaxydiscord, "invites", listFleetInvites);
	discord.hookcommand(galaxydiscord, "clearinvites", clearFleetInvites);
	discord.hookcommand(galaxydiscord, "acceptinvite", fleetAcceptInvite);
	discord.hookcommand(galaxydiscord, "colonyowner", setColonyOwner);
	
	discord.hookcommand(galaxydiscord, "user", otherInfo);
	discord.hookcommand(galaxydiscord, "sell", sellShip, {version: 2});
	discord.hookcommand(galaxydiscord, "list", listShipsSelector, {version: 2});
	
	discord.hookcommand(galaxydiscord, "load", loadTransport, {version: 2});
	discord.hookcommand(galaxydiscord, "unload", unloadTransport, {version: 2});
	
	discord.hookcommand(galaxydiscord, "colonyspace", colonySpace, {version: 2});
	discord.hookcommand(galaxydiscord, "abandon", abandonColony, {version: 2});
	discord.hookcommand(galaxydiscord, "totalshipsother", otherships, {version: 2});
	discord.hookcommand(galaxydiscord, "totalprofit", totalColonyProfit, {version: 2});


	discord.hookcommand(galaxydiscord, "inventory", totalInventory, {version: 2});
	discord.hookcommand(galaxydiscord, "dump", dumpInventory, {version: 2});
	
	//discord.hookcommand(galaxydiscord, "donateship", donateShip);

	glib = modules.galaxylib;
	_g = glib._g;
	_u = glib._u;
	// autosave
	setInterval(function(){
		fs.writeFileSync("./data/galaxydata.json", JSON.stringify(_u));
	}, 60000);
	
	// Colony money
	setInterval(function(){
		for(var i in _u.colonies)
		{
			if(_u.colonies[i] != undefined && _u.colonies[i] != null){
				var u = _u.users[_u.colonies[i].owner];
				var rev = glib.getColonyProfit(i);
				u.money = parseInt(u.money + rev[2]);
			}
		}
	}, 10000);
	
	// Colony growth
	setInterval(function(){
		for(var i in _u.colonies)
		{
			if(_u.colonies[i] != undefined && _u.colonies[i] != null){
				var r = Math.random();
				var amount = 0;
				if(_u.colonies[i].funding != undefined)
				{
					if(_u.colonies[i].funding >= _u.colonies[i].population*100){
						amount = amount + getRandomInt(1000,3000);
						_u.colonies[i].funding = Math.floor(_u.colonies[i].funding - _u.colonies[i].population*10);
					} else if(_u.colonies[i].funding >= _u.colonies[i].population*10){
						amount = amount + getRandomInt(100,300);
						_u.colonies[i].funding = Math.floor(_u.colonies[i].funding - _u.colonies[i].population);
					} else if(_u.colonies[i].funding >= _u.colonies[i].population*2){
						amount = amount + getRandomInt(25,100);
						_u.colonies[i].funding = Math.floor(_u.colonies[i].funding - _u.colonies[i].population/4);
					} else {
						if(_u.colonies[i].funding >= 500){
							_u.colonies[i].funding = _u.colonies[i].funding - 500;
							amount = amount + getRandomInt(2,12);
						}
					}
				}
				if(r > .95){
					amount = amount + 2;
				} else if(r > .75){
					amount++;
				}
				
				_u.colonies[i].population = _u.colonies[i].population + amount;
			}
		}
	}, 60000);
	
	setInterval(function(){
		if(time_now() + 600 > _u.growth.time){
			
		}
		
	}, 30000);
	
	var laststats = {};
	setupStatisticCallback(function(){
		var stats = glib.getStats();
		var str = "\n **Galaxy Stats**\n"
			+" - "+glib.num(stats.players)+" Players "+getEmojiDiff(laststats.players, stats.players)+"\n"
			+" - "+stats.colonies+" Colonies "+getEmojiDiff(laststats.colonies, stats.colonies)+"\n"
			+" - "+stats.fleets+" Fleets "+getEmojiDiff(laststats.fleets, stats.fleets)+"\n"
			+" - "+glib.num(stats.ships)+" ships in total "+getEmojiDiff(laststats.ships, stats.ships)+"\n"
			+" - "+glib.num(Math.floor(stats.money))+" 💎 in total "+getEmojiDiff(laststats.money, stats.money)+"\n"
			+" - "+glib.num(Math.floor(stats.population))+" population in the galaxy "+getEmojiDiff(laststats.population, stats.population)+"\n"
			+" - Galaxy Data is "+getFilesizeInBytes("./data/galaxydata.json")+" MB in size";
		
		if(stats.broken > 0){
			str+="\n - "+stats.broken+" players have broken money. \n";
		}
			
		laststats = stats;
		return str;
	});
};

function getFilesizeInBytes(filename) {
	var stats = fs.statSync(filename)
	var fileSizeInBytes = stats["size"]
	var s = fileSizeInBytes/1000/1000;
	return parseFloat( s.toFixed(3) )
}

exports.module.close = function(){
	console.log("Saving user data.");
	fs.writeFileSync("./data/galaxydata.json", JSON.stringify(_u));
};

function helpgalaxy(m){ bot.sendDM(m.author, libtext.galaxy_help); }
function aboutgalaxy(m){ bot.sendDM(m.author, libtext.about_galaxy); }
function selectiongalaxy(m){ bot.reply(m, libtext.galaxyglibelection); }
function hailsatan(m){ bot.reply(m, "ALL HAIL SATAN, OUR SAVIOUR! 🔥🔥🔥👹🔥🔥🔥"); }

// Last, now
function getEmojiDiff(l,n)
{
	if(l == undefined){ return "⏺"; }
	if(n > l){ return "🔼"; } else if(l > n){ return "🔽"; } else { return "⏺"; }
}

function otherInfo(m)
{
	var c = m.content.split(" ");
	var usr = m.mentions[0];
	if(m.mentions.length == 0){
		bot.reply(m, "User not found.");
		return;
	}

	var d = _u.users[usr.id]
	var str = "**"+usr.username+"** \n"
		+"Total Ships: "+Object.keys(d.ships).length+"\n"
		+"Colonies: "+d.colonies.length+"\n"
		+"Spice: 💎"+glib.num(Math.floor(d.money))+"\n";
	
	if(d.fleet != false && _u.fleets[d.fleet] != undefined){
		str = str + "Fleet: "+_u.fleets[d.fleet].name +" ["+d.fleet+"]\n";
	}
	
	bot.reply(m, str);
}

function evaluate(m, str)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}		
	try {
		var ue = str;
		var returned = eval(ue);
		if(returned !== undefined){
			bot.createMessage(m.channel.id, "Eval: "+returned);
		}
	} catch(err){
		if(err){
			bot.reply(m, err);
		}
	}
}

function fleets(m, str)
{
	var pagesize = 5;
	var c = str.split(" ");
	var rpp = 20;
	var page = 1;
	if(str != "" && !isNaN(page)){
		page = parseInt(c[0]);	
	}
	
	var str = "";
	var fkeys = Object.keys(_u.fleets);
	var total = fkeys.length;
	var maxpages = Math.ceil(total/pagesize);
	for(var i=((page-1)*pagesize);i<=(page*pagesize);i++){
		var y = fkeys[i];
		if(_u.fleets[y] != undefined){
			str = str+"\n**"+_u.fleets[y].name+"** ["+y+"]\n    Members: "+Object.keys(_u.fleets[y].members).length+"\n    Fleet power: "+glib.calcFleetPower(y)+"\n";
		}
	}
	delete fkeys;

	bot.reply(m, "**Fleets found:** Page ("+page+"/"+maxpages+")\n"+str);
}

function setColonyOwner(m)
{
	var c = m.content.split(" ");
	if(c[1] == undefined || c[2] == undefined){
		bot.reply(m, "Usage: $colonyowner <colony ID> <new owner>\nExamples of owners: fleet:FTag, user:1234567889");
		return;
	}
	if(_u.colonies[c[1]] == undefined){
		bot.reply(m, "The colony was not found.");
		return;
	}
	if(glib.isOwner(_u.colonies[c[1]].owner, m.author.id, 0))
	{
		var ty = glib.getOwnerType(c[2]);
		if(ty == 1){

		} else if(ty == 2){
			var o = glib.getOwner();
		}
	} else {
		bot.reply(m, "You don't own that colony.");
	}
}

function fleetinfo(m, str)
{
	if(str == undefined){
		bot.reply(m, "Usage: $fleet <Fleet tag> - Example: $fleet myfleet");
		return;
	}
	if(_u.fleets[str] == undefined){
		bot.reply(m, "The fleet was not found.");
		return;
	}
	var fusers = Object.keys(_u.fleets[str].members);
	var usernames = [];
	for(var i in fusers){
		var usr = bot.users.get(fusers[i]);
		if(usr === false || usr === null){
			usernames.push("**[Missing user]**");
		} else {
			usernames.push(usr.username+"#"+usr.discriminator);
		}
	}
	var str =_u.fleets[str].name +" ["+str+"]\n"
		+"Members: "+usernames.join(", ")+"\n"
		+"Storage: 💎"+_u.fleets[str].money+" spice.\n"
		+"Fleet power: "+glib.calcFleetPower(str);

	
	bot.reply(m, "**Fleet Info**\n"+str);
}

function colonyinfo(m)
{
	var c = m.content.split(" ");
	if(c[1] == undefined){
		bot.reply(m, "Usage: $colony <colony id> - Example: $colony 17");
		return;
	}
	
	if(_u.colonies[c[1]] == undefined){
		bot.reply(m, "The colony could not be found.");
		return;
	} else {
		var col = _u.colonies[c[1]];
		var str = "\n**"+col.name+"** ("+col.coords+")"
			+"\nPopulation: "+glib.num(col.population);
			
		var owner = bot.users.get(col.owner);
		if(owner == undefined){
			str+="\nOwner: Error fetching owner.";
		} else {
			str+="\nOwner: "+owner.username;
		}
			
		if(_u.colonies[c[1]].funding != undefined){
			str+="\nFunding: 💎"+glib.num(col.funding);
		} else {
			str+="\nFunding: None.";
		}

		if(col.inventory != undefined){
			str += "\nStorage: "+glib.invSpace(col.inventory)+"/"+glib.colonyInvSize(col);
		} else {
			str += "\nStorage: 0/"+glib.colonyInvSize(col);
		}
			
		if(col.modules != undefined){
			str += "\nModules: "+glib.colonyModSpace(col)+"/"+glib.colonyModSize(col);
		} else {
			str += "\nModules: 0/"+glib.colonyModSize(col);
		}
			
		bot.reply(m, str);
	}
}

function renameFleet(m)
{
	var c = m.content.split(" ");
	if(c[1] == undefined || c[2] == undefined){
		bot.reply(m, "Usage: $renamefleet <Fleet tag> <New name> - Example: $renamefleet myfleet The new Awesome fleet");
		return;
	}
	if(_u.fleets[c[1]] == undefined){
		bot.reply(m, "The fleet was not found.");
		return;
	}
	
	if(_u.fleets[c[1]].founder != m.author.id)
	{
		bot.reply(m, "You do not own that fleet.");
		return;
	}
	
	var reg2 = new RegExp(/^([a-zA-Z0-9\_\s\-]*)$/);
	var cname = c[0].length+c[1].length+2;
	var fname = m.content.substring(cname);
	if(fname.length < 5 || fname.length > 32 || reg2.test(fname) == false){
		bot.reply(m, "Please make sure your fleet name is between 5 and 32 characters.\n Characters allowed in name: a-z 0-9 . _ and spaces. ");
		return;
	}
	
	bot.reply(m, "Setting fleet name to "+fname);
	_u.fleets[c[1]].name = fname;
}

function inviteToFleet(m)
{
	var d = glib.userdata(m);
	var c = m.content.split(" ");
	if(c[1] == undefined || c.length > 2){
		bot.reply(m, "Usage: $fleetinvite @user");
		return;
	}
	
	if(d.fleet == false){
		bot.reply(m, "You must be in a fleet to invite someone.");
		return;
	} else if(_u.fleets[d.fleet].founder !== m.author.id){
		bot.reply(m, "You must be the fleet founder to invite someone.");
		return;
	}
	
	if(m.mentions.length == 0){
		bot.reply(m, "User not found.");
		return;
	}
	
	if(_u.fleets[d.fleet].founder == m.mentions[0].id){
		bot.reply(m, "Look buddy, you can't invite yourself lmao.");
		return;
	}
	if(_u.users[m.mentions[0].id] == undefined){
		bot.reply(m, "That user has not played the game yet! Get them to do any galaxy command to get started.");
		return;
	} else {
		if(_u.users[m.mentions[0].id].fleet != undefined && _u.users[m.mentions[0].id].fleet != false){
			bot.reply(m, "That user is already in a fleet.");
			return;
		}
		if(_u.users[m.mentions[0].id].invites == undefined){
			_u.users[m.mentions[0].id].invites = [];
		} else {
			for(var i in _u.users[m.mentions[0].id].invites){
				if(_u.users[m.mentions[0].id].invites[i][0] == d.fleet){
					bot.reply(m, "That user already has an invite to your fleet.");
					return;
				}
			}
		}
		if(_u.users[m.mentions[0].id].invites.length >= 10){
			bot.reply(m, "That user already has to many invites.");
			return;
		}
		_u.users[m.mentions[0].id].invites.push([d.fleet, m.author.id, time_now()+3600]);
		bot.reply(m, "Invite sent to "+m.mentions[0].username);
		return;
	}
	
}

// Invite format [Fleet Tag, Who invited, Timer]
function fleetAcceptInvite(m)
{
	var d = glib.userdata(m);
	var c = m.content.split(" ");
	if(d.fleet !== false && d.fleet !== undefined){
		bot.reply(m, "You're already in a fleet.");
		return;
	}
	if(c[1] == undefined){
		bot.reply(m, "Usage: $acceptinvite <fleet tag>");
		return;
	}
	
	for(var i in d.invites){
		if(d.invites[i] != undefined && d.invites[i] != null){
			if(d.invites[i][0] == c[1]){
				d.fleet = d.invites[i][0];
				_u.fleets[d.fleet].members[m.author.id] = 1;
				bot.reply(m, "Accepted invite.");
				d.invites = [];
				return;
			}
		}
	}
	
	bot.reply(m, "You don't have an invite for that fleet.");
}

function clearFleetInvites(m)
{
	var d = glib.userdata(m);
	d.invites = [];
}

function listFleetInvites(m)
{
	var d = glib.userdata(m);
	if(d.fleet != false){
		bot.reply(m, "You're already in a fleet.");
		return;
	}
	if(_u.users[m.author.id].invites == undefined || _u.users[m.author.id].invites.length == 0){
		bot.reply(m, "You don't have any pending invites.");
		return;
	} else {
		var str = "\n**Fleet invites**\n";
		for(var i in d.invites){
			var user = bot.users.get("id", d.invites[i][1]);
			if(user != undefined){
				str+="\n"+user.username+"#"+user.discriminator+" invited you to "+d.invites[i][0];
			} else {
				str+="\n Unknown user invited you to "+d.invites[i][0];
			}
		}
		
		bot.reply(m, str);
	}
}

function fundcolony(m, str)
{
	var d = glib.userdata(m);
	var c = str.split(" ");
	if(c[0] == undefined || c[1] == undefined){
		bot.reply(m, "Usage: $fundcolony <colony ID> <amount> - Example: $fundcolony 1 100422");
		return;
	}

	if(!glib.isNumeric(c[1]) || glib.toNumber(c[1]) < 0){
		bot.reply(m, "Incorrect number");
		return;
	}
	var col = c[0];
	var amnt = glib.toNumber(c[1]);
	if(_u.colonies[col] == undefined){
		bot.reply(m, "The colony was not found.");
	} else {
		if(_u.colonies[col].owner != m.author.id){
			if(confirmations[m.author.id] == undefined || confirmations[m.author.id][0] != m.content){
				confirmations[m.author.id] = [m.content, Math.floor(Date.now() / 1000)];
				bot.reply(m, "The colony "+_u.colonies[col].name+" is not owned by you, please repeat the command if you still want to fund the colony.")
				return;
			}
		}
		if(_u.colonies[col].funding == undefined){
			_u.colonies[col].funding = 0;
		}
		
		if(d.money < parseInt(amnt)){
			bot.reply(m, "You don't have enough money to do that.");
			return;
		}

		_u.colonies[col].funding = _u.colonies[col].funding + amnt;
		d.money = d.money - parseInt(amnt);
		bot.reply(m, "Successfully funded 💎"+glib.num(amnt) +" to "+_u.colonies[col].name);
	}
}

function fundAllColonies(m, str)
{
	var d = glib.userdata(m);
	var amount = glib.toNumber(str);
	if(str == undefined || str == "" || !glib.isNumeric(amount) || parseInt(amount) < 0 || isNaN(amount)){
		bot.reply(m, "Usage: $fundall <amount> - Example: $fundall 100422 \n It will be split evenly between the colonies.");
		return;
	}
	
	if(isNaN(amount)){
		bot.reply(m, "Usage: $fundall <amount> - Example: $fundall 100422 \n It will be split evenly between the colonies.");
		return;
	}
	if(d.money < amount){
		bot.reply(m, "You don't have enough money.");
		return;
	}
	var colonies = [];
	for(var i in _u.colonies){
		if(_u.colonies[i].owner === m.author.id){
			colonies.push(i);
		}
	}

	if(colonies.length === 0){
		bot.reply(m, "No colonies found that are owned by you.");
		return;
	}
	d.money = d.money - amount;
	amount = Math.floor(amount / colonies.length);
	for(var i in colonies){
		_u.colonies[colonies[i]].funding+=amount;
	}
	bot.reply(m, "Funded "+glib.num(amount)+" to all your colonies.");
}

function claimSector(m)
{
	var d = glib.userdata(m);
	var c = m.content.split(" ");
	if(c[1] == undefined || c[2] == undefined){
		bot.reply(m, "Usage: $claimsector <Coordinates> <self|fleet> - You can claim it for your self, or your fleet.");
		return;
	}
	
	if(c[2] == "fleet" && d.fleet == false){
		bot.reply(m, "You're not in a fleet.");
		return;
	}
	
	if(_u.sectors[c[1]] == undefined){
		bot.reply(m, "The sector "+c[1]+" was not found");
	} else {
		if(_u.sectors[c[1]].colonies.length == 0){
			bot.reply(m, "You need a colony in that sector to claim it.");
			return;
		}
		if(_u.sectors[c[1]].colonies.length !== _u.sectors[c[1]].max_colonies){
			bot.reply(m, "Sorry, but sectors can only be claimed when the sector is maxed out on colonies.");
			return;
		}
		if(c[2] == "self"){
			for(var i in _u.sectors[c[1]].colonies){
				var id = _u.sectors[c[1]].colonies[i];
				if(_u.colonies[id] != undefined){
					if(!glib.isOwner(_u.colonies[id].owner, m.author.id)){
						bot.reply(m, "There are colonies in this sector not owned by you!");
						return;
					}
				}
			}
		} else if(c[2] == "fleet"){
			if(!glib.fleetOwned(_u.sectors[c[1]], d.fleet)){
				bot.reply(m, "There are colonies in this sector not owned by your fleet, or anyone in it!");
				return;
			}
		} else {
			bot.reply(m, "Invalid owner, please use self or fleet.");
			return;
		}
		if(d.money <= 100000){
			bot.reply(m, "You do not have enough money, it costs  💎100,000 to claim a sector.");
			return;
		}
		var str = "";
		if(c[2] == "self"){
			str = "yourself";
			_u.sectors[c[1]].owner = "user:"+m.author.id;
		} else if(c[2] == "fleet"){
			str = "your fleet";
			_u.sectors[c[1]].owner = "fleet:"+d.fleet;
		} else {
			bot.reply(m, "Please say `self` or `fleet` when claiming.");
			return;
		}
		d.money = d.money - 100000;
		bot.reply(m, "You have claimed the sector for "+str)
	}
}

function fleetdata(fleetshortcut)
{
	
}

function createFleet(m)
{
	var d = glib.userdata(m);
	if(d.fleet != undefined && d.fleet != false){
		bot.reply(m, "You are already in a fleet! You are in ["+d.fleet+"]");
		return;
	}
	var c = m.content.split(" ");
	var reg = new RegExp(/^([a-zA-Z0-9\_\-]*)$/);
	var reg2 = new RegExp(/^([a-zA-Z0-9\_\s\-]*)$/);
	if(c[1] == undefined || c[2] == undefined || reg.test(c[1]) == false || c[1].length < 2 || c[1].length > 8){
		bot.reply(m, "Usage: $createfleet <shortcut> <name> - It will create your fleet. \n Example: $createfleet myfleet The Best Fleet Ever\n <shortcut> must be all one word and follow the formatting of a-z, 0-9, only . and _ are allowed for symbols.\n Shortcut must be between 2-8 characters, Name between 5-32 characters.");
		return;
	} 
	
	var cname = c[0].length+c[1].length+2;
	var fname = m.content.substring(cname);
	if(fname.length < 5 || fname.length > 32 || reg2.test(fname) == false){
		bot.reply(m, "Please make sure your fleet name is between 5 and 32 characters.\n Characters allowed in name: a-z 0-9 . _ and spaces. "+fname);
		return;
	}
	
	if(_u.fleets[c[1]] != undefined){
		bot.reply(m, "There is already a fleet with that shortcut!");
	} else {
		if(confirmations[m.author.id] != undefined && confirmations[m.author.id][0] == m.content && Math.floor(Date.now() / 1000) - 15 <= confirmations[m.author.id][1]){
			_u.fleets[c[1]] = {
				name: fname,
				members: { [m.author.id]: 0},
				founder: m.author.id,
				money: 50000,
				allies: [],
				enemies: [],
				divisions: {}
			};
			
			d.fleet = c[1];
			d.money = d.money - 250000;
			
			bot.reply(m, "Your \""+fname+"\" fleet has been created!");
		} else {
			bot.reply(m, "Creating fleets cost  💎250,000, please repeat the command to verify you want to make a fleet.");
			confirmations[m.author.id] = [m.content, Math.floor(Date.now() / 1000)];
		}
	}
}

function SectorInfo(m)
{
	var c = m.content.split(" ");
	if(c[1] == undefined){
		bot.reply(m, "Usage: $sector <Coordinates>");
		return;
	}
	
	if(_u.sectors[c[1]] == undefined){
		bot.reply(m, "The sector "+c[1]+" was not discovered yet!");
	} else {
		var str = "**Sector Information**\n"
			+_u.sectors[c[1]].name+"\n"
			+"Owner: "+glib.parseOwner(_u.sectors[c[1]].owner)+"\n"
			+"Colonies: "+_u.sectors[c[1]].colonies.length+"/"+_u.sectors[c[1]].max_colonies+" ("+_u.sectors[c[1]].colonies.join(",")+")";
		bot.reply(m, str);
	}
}

// Start colony
function startcolony(m)
{
	var d = glib.userdata(m);
	var c = m.content.split(" ");
	if(c[1] == undefined || !glib.isNumeric(c[1])){
		bot.reply(m, "Usage: $startcolony <Unique ID> - Make sure the UID is that of a lander type ship.");
		return;
	}
	var ship = d.ships[c[1]];
	if(ship == undefined){
		bot.reply(m, "The ship does not exist!");
		return;
	}
	var tn = time_now() - ship.move;
	if(time_now() < ship.move){
		bot.reply(m, "The lander ship is out of moves. Please wait "+tn+" seconds.");
		return;
	}
	var ty = glib.shipdata(ship.id);
	if(ty.type != "lander"){
		bot.reply(m, "You can only use Lander type ships to start colonies.");
		return;
	}
	var coords = ship.location[0]+","+ship.location[1];
	var sector = null;
	if(_u.sectors[coords] == undefined){
		sector = glib.intSectorData(coords);
	} else {
		sector = glib.intSectorData(coords);
	}
	
	if(sector.colonies.length >= sector.max_colonies){
		bot.reply(m, "This solar system is maxed out on colonies.");
		return;
	}
	var cLimit = glib.maxColonies(m.author.id);
	if(_u.users[m.author.id].colonies.length >= cLimit){
		bot.reply(m, "You have reached the colony limit! Your limit is "+cLimit+".");
		return;
	}
	ship.move = 666;
	var newid = _u.colonyid;
	_u.colonyid++;
	var newcolony = {
		name: "Sector "+coords,
		population: ship.crew,
		modules: [],
		owner: m.author.id,
		coords: coords,
		funding: 0,
		inventory: {}
	};
	_u.users[m.author.id].colonies.push(newid);
	sector.colonies.push(newid);
	_u.colonies[newid.toString()] = newcolony;
	bot.reply(m, "The colony has been created! The ID is "+newid);
	delete _u.users[m.author.id].ships[ship.uid];
}


function myColonies(m)
{
	var cmd = m.content.split(" ");
	var page = parseInt(cmd[1]) || 1;
	var d = glib.userdata(m);
	var c = glib.getMyColonies(m.author.id, 5, page);
	var num = 1;
	if(cmd[1] !== undefined){
		num = parseInt(cmd[1]);
	}
	var str = " - Your colonies (Page "+num+"/"+ Math.ceil(d.colonies.length/5) +")\n";
	if(page > Math.ceil(d.colonies.length/5)){
		bot.reply(m, "No colonies to be listed, you have past the last page.");
		return;
	} else if(page < 1){
		bot.reply(m, "You can't list a page less than one 😖");
		return;
	}
	if(Object.keys(c).length == 0){
		bot.reply(m, "You have no colonies set up.");
		return;
	}
	var extra = false;
	var hidden = 0;
	for(var i in c){
		var p = glib.getColonyProfit(i);
		var prof = ""+glib.num(p[0])+" - "+glib.num(p[1]);
		var ns = c[i].name+" ("+i+") ["+c[i].coords+"]\n    💎 "+prof+"/cycle | Population: "+glib.num(c[i].population)+"\n";
		str=str+ns;
	}
	if(extra){
		str=str+"**("+hidden+" results hidden)**";
	}
	bot.reply(m, str);
}

function totalColonyProfit(m, str)
{
	var d = glib.userdata(m);
	var c = glib.getMyColonies(m.author.id);
	var n = {s: 0, m: 0};
	for(var i in c){
		var p = glib.getColonyProfit(i);
		n.s+=p[0];
		n.m+=p[1];
	}
	bot.reply(m, "Your total colony profit is\n 💎"+glib.num(n.s)+" - "+glib.num(n.m));
}

function nameColony(m)
{
	var reg = new RegExp("^[a-zA-Z0-9\_\.]*$");
	var c = m.content.split(" ");
	if(c[1] == undefined || c[2] == undefined || reg.test(c[2]) == false){
		bot.reply(m, "Usage: $namecolony <unique ID> <new name>\n Formatting of names: No spaces, only _, . a-z and 0-9.\n Examples: my_colony, Colony1234.5");
		return;
	}
	
	if(_u.colonies[c[1]] == undefined){
		bot.reply(m, "The colony you're looking for was not found.");
	} else if(_u.colonies[c[1]].owner != m.author.id){
		bot.reply(m, "Sorry! you don't own that colony.");
	} else {
		_u.colonies[c[1]].name = c[2];
		bot.reply(m, "Successfully named the colony.");
	}
}

function fix(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, msg.admin_only);
		return;
	}	
	
	var nulls = 0;
	for(var i in _u.users)
	{
		var ships = _u.users[i].ships;
		var newships = {};
		for(var s in ships)
		{
			if(ships[s] == null){
				nulls++;
			} else {
				newships[ships[s].uid] = ships[s];
				if(newships[ships[s].uid].moving == undefined){
					newships[ships[s].uid].moving = false;
				}
			}
		}
		
		if(_u.users[i].money == NaN || _u.users[i].money == null){
			_u.users[i].money = 10000;	
		}
		
		if(_u.users[i].fleet == undefined){
			_u.users[i].fleet = false;
		}
		
		_u.users[i].ships = newships;
		
	}
	
	for(var i in _u.colonies)
	{
		if(_u.colonies[i].name == undefined){
			_u.colonies[i].name = "Sector "+_u.colonies[i].coords;
		}
		
		if(_u.colonies[i].capita == undefined){
			_u.colonies[i].capita = 5;
		}
	}
	
	if(_u.fleets == undefined)
	{
		_u.fleets = {};
	}
	
	bot.reply(m, "Did some fixing, null's found: "+nulls);
}

function vectors(m)
{
	var c = m.content.split(" ");
	if(c[1] && c[2]){
		bot.reply(m, "Distance is "+glib.distance(glib.Vector2(c[1]), glib.Vector2(c[2])));
	}
}

function shipid(m)
{
	var d = glib.userdata(m);
	var c = m.content.split(" ");
	if(c[1] == undefined || !glib.isNumeric(c[1])){
		bot.reply(m, "Usage: $ship <unique ID>");
		return;
	}
	
	var s = d.ships[c[1]];
	if(s == undefined){
		bot.reply(m, "The ship was not found, or had an error.");
	} else {
		var str = "";
		var ty = glib.shipdata(s.id);
		str = str + ty.name +"\n";
		if(s.move > 0){
			str = str + "Moving, time until done: "+glib.tl(s.move)+" seconds \n";	
		} else {
			str = str + "Not moving.\n";	
		}
		str = str + "Location: "+s.location;	
		if(s.cargo !== undefined){
			str += "\nPassengers: "+s.cargo;
		}
		if(s.crew !== undefined){
			str += "\nCrew: "+s.crew +"/"+ty.crew;
		}
		if(s.inventory !== undefined){
			str += "\nInventory: "+ glib.invSpace(s.inventory)+"/"+ty.space;
			for(var i in s.inventory){
				str += "\n   - "+s.inventory[i]+" "+i;
			}
		}
		bot.reply(m, str);
	}
}

function sellShip(m, args)
{
	var d = glib.userdata(m);
	if(args == ""){ bot.reply(m, "Usage: $sell [selector] [quantity]"); return; }
	args = args.split(" ");
	var selector = args[0];
	var quantity = args[1];
	var ships = glib.getShips(m, args[0]);
	if(args[1] == undefined){
		quantity = ships.length;
	}
	if(ships === false){
		bot.reply(m, "Invalid selector");
		return;
	} else if(ships.length === 0){
		bot.reply(m, "No ships were found with that selector");
	} else {
		var total = 0;
		var sold = 0;
		for(var i in ships){
			var s = glib.shipdata(ships[i].id);
			total += s.price*.25;
			sold++;
			if(sold >= quantity){
				break;
			}
		}
		
		if(confirmations[m.author.id] != undefined && confirmations[m.author.id][0] == m.content && Math.floor(Date.now() / 1000) - 15 <= confirmations[m.author.id][1]){
			// sell 
			d.money += total;
			var delsold = 0;
			for(var i in ships){
				delsold++;
				delete d.ships[ships[i].uid];
				if(delsold >= quantity){
					break;
				}
			}
			
			bot.reply(m, "Sold "+delsold+" ships for 💎"+total+".");
		} else {
			confirmations[m.author.id] = [m.content, Math.floor(Date.now() / 1000)];
			
			bot.reply(m, "Selling value will be "+total+" with "+quantity+" being sold. Repeat the command to confirm selling.");
		}
		
	}
}

function buyship(m, str)
{
	var d = glib.userdata(m);
	var c = str.split(" ");
	if(c[1] == undefined){
		bot.reply(m, "Usage: $buyship <ship id> <quantity> [colony ID]");
		return;
	}
	var amount = 1;
	if(glib.isNumeric(c[1])){

		amount = parseInt(c[1]);
		if(amount > 100){
			amount = 100;
		} else if(amount < 1){
			amount = 1;
		}
	}
	amount = parseInt(amount);
	var s = glib.shipdata(c[0]);
	
	if(s == null){
		bot.reply(m, "The ship was not found.");
		return;
	}
	var slotsleft = shiplimit - Object.keys(d.ships).length;
	if(slotsleft <= 0 || isNaN(amount)){
		bot.reply(m, "You can't buy that many, you only have "+slotsleft+" slots left for ships.");
		return;
	}
	
	if(d.colonies.length > 0 && c[2] == undefined){
		bot.reply(m, "Please define what colony to spawn at. Required once you have colonies.");
		return;
	}
	if(s.price == -1){
		bot.reply(m, "This ship can't be purchased.");
		return;
	}
	if((parseInt(s.price*amount) > parseInt(d.money)) == true){
		bot.reply(m, "You don't have enough 💎 spice, You need "+glib.num((s.price*amount - d.money))+" more spice."+d.money+" -"+s.price*amount+", "+s.price);
	} else {
		var ids = [];
		var actuallybought = 0;
		
		var colloc = [0,0];
		if(d.colonies.length > 0){
			if(_u.colonies[c[2]] == undefined){
				bot.reply(m, "The colony you defined could not be found.");
				return;
			} else if(_u.colonies[c[2]].owner !== m.author.id){
				bot.reply(m, "The colony you defined is not owned by you.");
				return;
			} else {
				var ll = _u.colonies[c[2]].coords.split(",");
				colloc = [ll[0], ll[1]];
			}
		} else {
			if(s.free_crew == false){
				bot.reply(m, "Sorry, that ship requires population to be transfered from your colonies.");
				return;
			}
		}
		var estr = "";
		var nopop = 0;
		for(var i=1;i<=amount;i++){
			if(Object.keys(d.ships).length >= shiplimit){
				estr = "\nYou have reached the limit on ships. The limit is "+shiplimit+" and you have "+Object.keys(d.ships).length;
				break;	
			}
			if(d.money >= s.price){
				if((d.colonies.length == 0) || _u.colonies[c[2]].population - s.crew > 100 || s.free_crew == true){
					if(s.free_crew == false){
						_u.colonies[c[2]].population -= s.crew;
					}
					
					d.ships[_u.uniqueid] = {
						id: s.id,
						uid: _u.uniqueid,
						location: colloc,
						health: s.health,
						move: 0,
						durability: 1000,
						lifetime: Math.floor(Date.now() / 1000),
						crew: s.crew,
						inventory: {}
					};
					
					ids.push(_u.uniqueid);
					_u.uniqueid++;
					d.money = Math.floor(d.money - s.price);
					actuallybought++;
					slotsleft--;
				} else {
					nopop++;
				}
			} else {
				return;	
			}
		}
		if(nopop > 0){
			estr+="\n"+nopop+" ships were unable to be created due to no population.";
		}
		if(actuallybought>0){
			var strsi = ids.join(", ");
			var strout = "";
			if(strsi.length > 1500){
				strout = "Unique IDs are hidden due to length.";
			} else {
				strout = "Unique IDs are ("+strsi+")";
			}
			var fstr = "Successfully bought "+actuallybought+" "+s.name+"s for 💎"+glib.num(s.price*actuallybought)+" spice. "+strout+estr;
			if(fstr.length > 2000){
				bot.reply(m, "Unable to show data, to long. Report this issue please. Length is "+fstr.length);
			} else {
				bot.reply(m, fstr);
			}
			
			
		} else {
			bot.reply(m, "Couldn't buy any ships. "+estr);
		}
	}
}

function warp(m, str)
{
	var d = glib.userdata(m);
	var c = str.split(" ");
	if(c[1] == undefined){
		bot.reply(m, "Usage: $warp <ships> <location>");
		return;
	}
	
	var ships = glib.getShips(m, c[0], {canMove: true});
	if(ships === undefined || ships === false || ships.length == 0){
		bot.reply(m, "No ships found, or they're out of moves, make sure you format your selection properly. Look at $selection");
		return;
	}
	var v = glib.Vector2(c[1]);
	if(v == false){ bot.reply(m, "Incorrect location. Please use the format `x,y` E.g 512,42."); return; }
	if(v[0] > 1500 || v[0] < -1500){
		bot.reply(m, "Incorrect location. You can not go past coordinates 1500 or -1500 in either direction."); 
		return;
	}
	if(confirmations[m.author.id] != undefined && confirmations[m.author.id][0] == m.content && Math.floor(Date.now() / 1000) - 15 <= confirmations[m.author.id][1]){
		
		var str = "";
		var amnt = 0;
		for(var i in ships)
		{
			var ty = glib.shipdata(ships[i].id);
			var l = ships[i].location;
			if(v[0]==l[0] && v[1]==l[1]){ bot.reply(m, "Incorrect location. Your ship is already there."); return; }
			if(l == false){
				ships[i].location = glib.Vector2(c[1]);
			}
			var dis = glib.distance(v,l);
			var t = dis/ty.movement;
			var tt = t*30;
			var move = time_now() + tt;
			if(!isNaN(move)){
				d.ships[ships[i].uid].location = glib.Vector2(c[1]);
				d.ships[ships[i].uid].move = move;
				str = str + ships[i].uid +": time until done: "+Math.floor(tt)+" seconds\n";
				amnt++;
			}
		}
		if(amnt > 5){
			bot.reply(m, "Warping ships.");
		} else {
			bot.reply(m, "Warping ships "+str);
		}
		
		delete confirmations[m.author.id];
	} else {
		var maxseconds = 0;
		var v = glib.Vector2(c[1]);
		if(v == false){ bot.reply(m, "Incorrect location. Please use the format `x,y` E.g 512,42."); return; }
		for(var i in ships)
		{
			var ty = glib.shipdata(ships[i].id);
			var l = ships[i].location;
			var dis = glib.distance(v,l);
			var t = dis/ty.movement;
			var tt = t*30;
			if(tt > maxseconds){
				maxseconds = tt;
			}
		}
		confirmations[m.author.id] = [m.content, Math.floor(Date.now() / 1000)];
		bot.reply(m,"Do you really want to warp your ships there? It will take maximum "+Math.floor(maxseconds)+" seconds for all ships to reach the location. Repeat the command to confirm.");
	}
}

// Lists stats of each ship type.
function myships(m, str)
{
	var d = glib.userdata(m);
	var sh = {};
	for(var i in d.ships){
		var s = d.ships[i];
		if(sh[glib.shipdata(s.id).name] == undefined){
			sh[glib.shipdata(s.id).name] = 1;	
		} else {
			sh[glib.shipdata(s.id).name]++;	
		}
	}
	
	var str = "Your ship fleet: \n ```";
	for(var i in sh){
		str = str + sh[i] +" "+i+"s\n";
	}
	str = str + "```";
	bot.reply(m, str);
}

function otherships(m, str)
{
	if(developers.indexOf(m.author.id) == -1){
		return;
	}
	var d = _u.users[m.mentions[0].id];
	var sh = {};
	for(var i in d.ships){
		var s = d.ships[i];
		if(sh[glib.shipdata(s.id).name] == undefined){
			sh[glib.shipdata(s.id).name] = 1;	
		} else {
			sh[glib.shipdata(s.id).name]++;	
		}
	}
	
	var str = "fleet: \n ```";
	for(var i in sh){
		str = str + sh[i] +" "+i+"s\n";
	}
	str = str + "```";
	bot.reply(m, str);
}

// Lists ships of a specific type, their UID, and their location.
function listshiptype(m, str)
{
	var d = glib.userdata(m);
	var sh = {};
	var c = str.split(" ");
	var pageNumber = 1;
	if(c[1] !== undefined && parseInt(c[1]) !== NaN){
		pageNumber = parseInt(c[1]);
	}
	if(c[0] === undefined){
		bot.reply(m, "Usage: $listship <type> <page>");
		return;
	}
	var ships = [];
	for(var i in d.ships){
		var s = d.ships[i];
		var ty = glib.shipdata(s.id);

		if(ty.type == c[0]){
			ships.push(s.uid);
		}
	}

	if(ships.length === 0){
		bot.reply(m, "No ships of that type were found.");
		return;
	}
	var maxPages = Math.ceil(ships.length / 100);
	var output = "**[ Deprecated, use $list instead ]** Page ("+pageNumber+"/"+maxPages+") of your "+str+" type ships \n ```";
	var newlist = [];
	for(var i=((pageNumber-1)*100);i<=pageNumber*100;i++){
		if(ships[i] === undefined || ships[i] === null){
			break;
		}
		newlist.push(ships[i]);
	}

	output = output+newlist.join(", ")+" ```";
	bot.reply(m, output);	

	delete ships;
	delete newlist;
}

function listShipsSelector(m, args)
{
	var d = glib.userdata(m);
	var sh = {};
	var c = str
	var useAll = false;
	var ids = [];
	var args = args.split(" ");
	var selector = args[0];
	var pageNumber = 1;
	if(args[1] != undefined && parseInt(args[1]) !== NaN){
		pageNumber = parseInt(args[1]);
	}

	if(selector == undefined || selector == "" || pageNumber == NaN){
		bot.reply(m, "Usage: $list <selector> <page>\n E.g. $list 1 - $list var:1");
		return;
	}
	if(Object.keys(d.ships).length == 0){
		bot.reply(m, "You don't have any ships.");
		return;
	}
	
	var ships = glib.getShips(m, selector);
	if(ships === false){
		bot.reply(m, "Invalid selector.");
		return;
	}
	if(ships.length === 0 || ships === undefined){
		bot.reply(m, "No ships with that selector was found.");
		return;
	}
	var ps = Math.ceil(ships.length / 100);
	var str = "Ships found \n Page ("+pageNumber+"/"+ps+") ```";
	var slist = [];
	var len = 0;
	for(var i=(pageNumber-1)*100;i<=(pageNumber*100);i++){
		if(ships[i] == undefined){
			break;
		}
		if(len + ships[i].uid.toString().length+2 < 1900){
			slist.push(ships[i].uid);
			len+=ships[i].uid.toString().length+2
		} else {
			break;
		}
	}
	str+=slist.join(", ");
	str+=" ```";
	if(str.length > 2000){
		bot.createMessage(m.channel.id, "String to big.");
	} else {
		bot.createMessage(m.channel.id, str);
	}
	
}

function mystats(m)
{
	var d = glib.userdata(m);
	var str = "\n"
		+"Total Ships: "+Object.keys(d.ships).length+"\n"
		+"Colonies: "+d.colonies.length+"\n"
		+"Spice: 💎"+glib.num(Math.floor(d.money))+"\n";
	
	if(d.fleet != false && _u.fleets[d.fleet] != undefined){
		str = str + "Fleet: "+_u.fleets[d.fleet].name +" ["+d.fleet+"]\n";
	}
	
	bot.reply(m, str);
}

function money(m)
{
	var d = glib.userdata(m);
	bot.reply(m, "You have 💎"+glib.num(Math.floor(d.money))+" spice.");
}

function galaxy(m)
{
	bot.reply(m, "Ayy lmao");
}

function reload(m)
{
	if(developers.indexOf(m.author.id) == -1){
		bot.reply(m, libtext.admin_only);
		return;
	}	
	
	delete require.cache[require.resolve("../data/galaxy.json")]
	_g = require("../data/galaxy.json");
	bot.reply(m, "Reloaded game data.");
}

function listships(m)
{
	var str = "";
	for(var i in _g.ships){
		if(_g.ships[i].price == -1){
			str=str+"\n"+_g.ships[i].name +" ["+_g.ships[i].type+"] Id: "+_g.ships[i].id+" Price: Unpurchasable, Crew: "+_g.ships[i].crew;
		} else {
			str=str+"\n"+_g.ships[i].name +" ["+_g.ships[i].type+"] Id: "+_g.ships[i].id+" Price: 💎"+glib.num(_g.ships[i].price)+", Crew: "+_g.ships[i].crew;
		}
		
	}
	bot.reply(m, "Here are some ships available: "+str);
}

function shipInfo(m, str)
{
	var c = str
	if(c.length == 0){
		bot.reply(m, "Usage: $sinfo <ship id>");
		return;
	}
	
	var s = glib.shipdata(str);
	if(s == null){
		bot.reply(m, "The ship was not found.");
		return;
	}
	
	var str = "\n"
		+"**"+s.name+"**\n"
		+"Type: "+s.type+"\n"
		+"Price: 💎"+glib.num(s.price)+"\n"
		+"Speed: ☄"+s.movement+"\n"
		+"Cargo space: "+s.space+"\n"
		+"Bonuses:\n";
	var ss = "";
	for(var i in s.bonuses){
		if(s.bonuses[i] >= 1){
			ss=ss+"\n    %"+s.bonuses[i]*100+" "+i+" increase.";
		} else {
			ss=ss+"\n    %"+ (1-s.bonuses[i])*100 +" "+i+" decrease";
		}
	}
	str = str + ss;
	bot.reply(m, str);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mine(m, selector)
{
	var d = glib.userdata(m);
	var sh = {};
	var c = str
	var useAll = false;
	var ids = [];

	if(selector == undefined || selector == ""){
		bot.reply(m, "Usage: $mine <selector> \n E.g. $mine 1 - $mine 1,2,3,4,5 - $mine all");
		return;
	}
	if(Object.keys(d.ships).length == 0){
		bot.reply(m, "You don't have any ships, You need to buy some. Use $help for a tutorial.");
		return;
	}
	
	var ships = glib.getShips(m, selector, {types: ["miner"], canMove: true});
	if(ships === false){
		bot.reply(m, "Invalid selector.");
		return;
	}
	if(ships.length === 0 || ships === undefined){
		bot.reply(m, "No ships found, or they are out of moves. Remember, Mining has a 10 second wait before that ship can mine again.");
		return;
	}
	var str = "Mining operation";
	var res = "";
	var found = 0;
	var profit = 0;
	var full = 0;
	var tnt = time_now() + 1;
	for(var i in ships){
		var s = ships[i];
		var rint = getRandomInt(1,10000);
		var r = glib.getResource(rint);
		s.move = tnt;
		var bonus = 1;
		if(glib.shipdata(s.id).bonuses["mining"] != undefined){
			bonus = glib.shipdata(s.id).bonuses["mining"];
		}
		if(r != false){
			found++;
			var pr = Math.floor(r[1] * bonus);
			var prm = getRandomInt(pr*.5, pr*1.3)*.10;
			d.money = Math.floor(d.money + prm);
			profit += Math.floor(prm);
			var store = glib.addToInventory(s, r[0], 1);
			if(store == 1){
				full++;
			}
			res = res + "\nResource found: "+r[0]+", worth 💎"+ Math.floor(prm);
		}
	}
	
	if(res == ""){
		str = "No ores were found.";	
	} else {
		if(ships.length <= 5){
			str = str+" ("+found+"/"+ships.length+" ships found ores.) Balance: 💎"+glib.num(d.money)+" \n"+res;	
		} else {
			str = str+" ("+found+"/"+ships.length+" ships found ores.) Balance: 💎"+glib.num(d.money)+" \n Profit made: 💎"+glib.num(profit);	
		}
	}
	if(full > 0){
		str += "\n"+full+" ships could not load resources because they're full.";
	}
	
	bot.reply(m, str);
}

function loadTransport(m, str)
{
	var d = glib.userdata(m);
	var c = str.split(" ");

	if(c.length < 3 || isNaN(c[2]) || parseInt(c[2]) < 0){
		bot.createMessage(m.channel.id, "Usage: $load [ship id] [colony id] [amount]");
		return;
	}
	
	var ships = glib.getShips(m, c[0], {types: ["transport"]});
	if(ships.length === 0){
		bot.createMessage(m.channel.id, glib.toUser(m.author)+" no ships were found with that selector.");
	} else {
		if(_u.colonies[c[1]] == undefined){
			bot.createMessage(m.channel.id, glib.toUser(m.author)+" That colony was not found.");
		} else if(_u.colonies[c[1]].owner !== m.author.id){
			bot.createMessage(m.channel.id, glib.toUser(m.author)+" That colony is not owned by you.");
		} else {
			var col = _u.colonies[c[1]];
			var moving = 0;
			var invalidloc = 0;
			var successful = 0;
			var full = 0;
			var NEP = false; // not enough population;

			for(var i in ships){
				var tsize = parseInt(c[2]);
				var l = ships[i].location[0]+","+ships[i].location[1];
				var tn = time_now();
				if(l != col.coords){
					invalidloc++;
				} else if(tn < ships[i].move){
					moving++;
				} else {
					if(ships[i].cargo === undefined){
						ships[i].cargo = 0;
					}
					var st = glib.shipdata(ships[i].id);
					var size = st.bonuses.transport;
					var amount = ships[i].cargo;
					if(tsize > size){
						tsize = size;
					}
					if(col.population <= 0){
						NEP = true;
						break;
					}

					var sleft = (size - amount);
					if(tsize > sleft){
						tsize = sleft;
					}
					if(sleft === 0){
						full++;
					} else {
						if(col.population < tsize){
							tsize = col.population;
						}
						if(col.population - tsize >= 0){
							ships[i].cargo += tsize;
							col.population -= tsize;
							successful++;
						}
					}
				}
			}
			
			var out = "";
			if(successful > 0){
				out = glib.toUser(m.author)+" loading was successful for "+successful+" ships.";
			} else {
				out = glib.toUser(m.author)+" loading was unsuccessful, no ships were loaded.";
			}
			if(NEP){
				out += "\nThere was not enough population to load.";
			}
			if(full > 0){
				out += "\n"+moving+" ships are full";
			}
			if(moving > 0){
				out += "\n"+moving+" ships were unable to load because they are moving.";
			}
			if(invalidloc > 0){
				out += "\n"+moving+" ships were unable to load because they are not at the colonies sector.";
			}
			
			bot.createMessage(m.channel.id, out);
		}
	}
}

function unloadTransport(m, str)
{
	var d = glib.userdata(m);
	var c = str.split(" ");
	
	if(c.length < 3 || isNaN(c[2]) || parseInt(c[2]) < 0){
		bot.createMessage(m.channel.id, "Usage: $unload [ship id] [colony id] [amount]");
		return;
	}
	var tsize = parseInt(c[2]);
	var ships = glib.getShips(m, c[0], {types: ["transport"]});
	var tn = time_now();
	if(ships.length === 0){
		bot.reply(m, " no ships were found with that selector.");
	} else {
		if(_u.colonies[c[1]] == undefined){
			bot.createMessage(m.channel.id, glib.toUser(m.author)+" That colony was not found.");
		} else if(_u.colonies[c[1]].owner !== m.author.id){
			bot.createMessage(m.channel.id, glib.toUser(m.author)+" That colony is not owned by you.");
		} else {
			var col = _u.colonies[c[1]];
			var moving = 0;
			var invalidloc = 0;
			var successful = 0;
			for(var i in ships){
				var l = ships[i].location[0]+","+ships[i].location[1];
				if(l != col.coords){
					invalidloc++;
				} else if(tn < ships[i].move){
					moving++;
				} else {
					if(ships[i].cargo === undefined){
						ships[i].cargo = 0;
					}
					var st = glib.shipdata(ships[i].id);
					var size = st.bonuses.transport;
					var amount = ships[i].cargo;
					if(tsize > size){
						tsize = size;
					}
					if(tsize > ships[i].cargo){
						tsize = ships[i].cargo;
					}

					ships[i].cargo -= tsize;
					col.population += tsize;
					successful++;
				}
			}
			
			var out = "";
			if(successful > 0){
				out = glib.toUser(m.author)+" unloading was successful for "+successful+" ships.";
			} else {
				out = glib.toUser(m.author)+" unloading was unsuccessful, no ships were loaded.";
			}
			if(moving > 0){
				out += "\n"+moving+" ships were unable to unload because they are moving.";
			}
			if(invalidloc > 0){
				out += "\n"+moving+" ships were unable to unload because they are not at the colonies sector.";
			}
			
			bot.createMessage(m.channel.id, out);
		}
	}
}

function createDivision(m, str)
{

}

function colonySpace(m, str)
{
	var d = glib.userdata(m);
	var cc = glib.maxColonies(m.author.id);
	bot.reply(m, "Your colony limit is "+cc);
}

function abandonColony(m, str)
{
	var d = glib.userdata(m);
	var col = _u.colonies[str];
	if(_u.colonies[str] == undefined){
		bot.reply(m, "The colony does not exist."); return;
	}
	if(col.owner !== m.author.id){
		bot.reply(m, "That colony is not owned by you.");
	} else {
		if(confirmations[m.author.id] != undefined && confirmations[m.author.id][0] == m.content && Math.floor(Date.now() / 1000) - 15 <= confirmations[m.author.id][1]){
			var cname = _u.colonies[str].name;
			var cpos = _u.users[m.author.id].colonies.indexOf(parseInt(str));
			delete _u.users[m.author.id].colonies[cpos];
			delete _u.colonies[str];
			
			bot.reply(m, "Abandoned 98941the "+cname+" colony.");
		} else {
			confirmations[m.author.id] = [m.content, Math.floor(Date.now() / 1000)];
			var cname = _u.colonies[str].name;
			bot.reply(m, "You are going to abandon your **"+cname+"** colony, Repeat the command to confirm you want to abandon it.");
		}
	}
}

function totalInventory(m, str)
{
	var inv = {};
	var d = glib.userdata(m);
	var c = str.split(" ");
	var ships = glib.getShips(m, c[0]);
	if(ships.length == 0){
		bot.reply(m, "No ships were selected.");
		return;
	}
	for(var i in ships)
	{
		if(ships[i].inventory != undefined){
			var i2 = ships[i].inventory;
			for(var j in i2){
				if(inv[j] != undefined){
					inv[j]+=i2[j];
				} else {
					inv[j] = i2[j];
				}
			}
		}
	}

	var output = ",\nTotal Inventory:\n";
	for(var i in inv){
		output+="\n   - "+inv[i]+" "+i;
	}
	bot.reply(m, output);
}

function dumpInventory(m, str)
{
	var inv = {};
	var d = glib.userdata(m);
	var c = str.split(" ");
	var ships = glib.getShips(m, c[0]);
	var todump = c[1];
	if(c[1] == "" || c[1] == undefined){
		bot.reply(m, "Usage: $dump <selector> <resource>"); return;
	}
	todump=todump.toLowerCase();
	if(ships.length == 0){
		bot.reply(m, "No ships were selected.");
		return;
	}
	var amount = 0;
	for(var i in ships)
	{
		if(ships[i].inventory != undefined){
			var i2 = ships[i].inventory;
			if(i2[todump] != undefined){
				amount += i2[todump];
				delete i2[todump];
			}
		}
	}

	bot.reply(m, "Dumped "+amount+" "+todump);
}

