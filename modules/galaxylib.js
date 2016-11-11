exports.module = {
	name: "galaxylib",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};
global.galaxydiscord = {
	use: "bot",
	name: "galaxy"
};

var exec = require('child_process').exec;

exports._g = {};
exports._u = {};
var _u = null;
var _g = null;

exports.fleetreg = new RegExp(/^(fleet\:)([a-zA-Z0-9\_\-]*)+$/);
exports.userreg = new RegExp(/^(user\:)([0-9]*)+$/);

var confirmations = {};
exports.module.preinit = function(){
	exports._g = require("../data/galaxy.json");
	exports._u = require("../data/galaxydata.json");

	_u = exports._u;
	_g = exports._g;
};

exports.module.init = function(){
	galaxydiscord.check = commandVerify;
};

var usercmds = {};
var timeout = {};

exports.tl = (n)=>{
	if(n-time_now() < 0){
		return 0;
	} else {
		return Math.ceil(n-time_now());
	}
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.getColonyProfit = function(c)
{
	if(_u.colonies[c] == undefined){
		return [0,0];
	} else {
		var r = Math.random() * (1 - 0.2) + 0.2;
		var m = 0.06;
		var p = Math.floor(_u.colonies[c].population / 25000 +1)*1.15;
		var rev = _u.colonies[c].population * .01;
		var rand = Math.floor(rev*p)*r;
		return [Math.floor(rev*.2*p), Math.floor(rev*p), rand];
	}
}

exports.num = function(x) {
	if(x == undefined){ return "error"; }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

exports.getUser = function(userID)
{
	var u = bot.users.get("id", userID);
	if(u == null || u == undefined){
		return false;
	} else {
		return u;
	}
}

exports.notify = function(userID, message)
{
	var u = exports.getUser(userID);
	if(u == false){
		return;
	} else {
		if(_u.users[userID].notifications){
			bot.sendMessage(u, message);
		}
	}
}

exports.maxColonies = function(userID)
{
	var size = 10;
	for(var i in _u.users[userID].colonies){
		var cid = _u.users[userID].colonies[i];
		if(_u.colonies[cid] != undefined){
			var p = _u.colonies[cid].population;
			size+=Math.floor(p/1000000);
			if(p>100000){
				size++;
			}
		}
	}
	return size;
}

exports.getStats = function(){
	var stats = {
		players: Object.keys(_u.users).length,
		colonies: Object.keys(_u.colonies).length,
		fleets: Object.keys(_u.fleets).length,
		ships: 0,
		money: 0,
		population: 0,
		broken: 0
	}
	
	for(var i in _u.users)
	{
		stats.ships = stats.ships + Object.keys(_u.users[i].ships).length;
		if(!exports.isNumeric(_u.users[i].money)){
			console.log("User "+i+" has broken money.");
			stats.broken++;
		} else {
			stats.money = stats.money + _u.users[i].money;
		}
	}
	
	for(var i in _u.colonies)
	{
		stats.population = stats.population + _u.colonies[i].population;
	}
	
	return stats;
};

exports.calcFleetPower = function(fleetID)
{
	if(_u.fleets[fleetID] == undefined){
		return 0;	
	} else {
		var fpower = 0;
		for(var i in _u.fleets[fleetID].members){
			for(var s in _u.users[i].ships){
				var sd = exports.shipdata(	_u.users[i].ships[s].id);
				fpower = fpower+sd.fpower;
			}
		}
		return fpower;
	}
}

// Is the str owned by user.
exports.isOwner = function(str, user, p)
{
	var p = typeof p !== 'undefined' ?  p : 1;
	var reg1 = new RegExp(/^(user\:)([0-9]*)+$/);	
	if(exports.isNumeric(str)){
		if(str == user){ return true; } else { return false; }
	} else if(reg1.test(str)){ // Is the user: or id method the user?
		var id = str.split(":")[1];
		if(id == user){ return true; } else { return false; }
	} else if(exports.fleetreg.test(str)){ // Is the user in the fleet?
		var id = str.split(":")[1];
		if(_g.fleets[id] == undefined){
			return false;	
		} else {
			if(_g.fleets[id].members[user] != undefined && _g.fleets[id].members[user] <= p){
				return true;	
			} else {
				return false;	
			}
		}
	}
}

// owner type, fleet ID
exports.isInFleet = function(str, f)
{
	if(_u.fleets[f] == undefined){
		return false;
	}
	if(exports.isNumeric(str)){
		if(_u.fleets[f].members[str] !== undefined){
			return true;
		}
	} else if(exports.userreg.test(str)){ // Is the user: or id method the user?
		var id = str.split(":")[1];
		if(_u.fleets[f].members[id] !== undefined){
			return true;
		}
	} else if(exports.fleetreg.test(str)){ // Is the user in the fleet?
		var id = str.split(":")[1];
		if(id == f){
			return true;
		}
	}
	return false;
}

// Sector Data, Fleet ID
exports.fleetOwned = function(d, f)
{
	if(d === undefined || f === null || f === false || f === ""){ return false; }
	var c = d.colonies;
	for(var i in c){
		if(_u.colonies[c[i]] !== undefined){
			var col = _u.colonies[c[i]];
			if(exports.isInFleet(col.owner, f) === false){
				return false;
			}
		}
	}
	return true;
}

// Types user = 1, fleet = 2
exports.getOwnerType = function(str)
{
	var reg1 = new RegExp(/^(user\:)([0-9]*)+$/);
	var reg2 = new RegExp(/^(fleet\:)([a-zA-Z0-9\_\-]*)+$/);	
	if(reg1.test(str)){ 
		return 1;
	} else if(reg2.test(str)){ 
		return 2;
	}
}

exports.getOwner = function(str)
{
	var reg1 = new RegExp(/^(user\:)([0-9]*)+$/);
	var reg2 = new RegExp(/^(fleet\:)([a-zA-Z0-9\_\-]*)+$/);	
	if(reg1.test(str)){ 
		var u = str.split(":");
		if(_u.users[u[1]] == undefined){
			return false;
		}
		return _u.users[u[1]];
	} else if(reg2.test(str)){ 
		var u = str.split(":");
		if(_u.fleets[u[1]] == undefined){
			return false;
		}
		return _u.fleets[u[1]];
	}	
}

exports.parseOwner = function(str)
{
	var reg1 = new RegExp(/^(user\:)([0-9]*)+$/);
	var reg2 = new RegExp(/^(fleet\:)([a-zA-Z0-9\_\-]*)+$/);	
	if(!isNaN(str)){
		var user = bot.users.get(str);
		if(user !== undefined && user !== null && user !== false){
			return user.username+"#"+user.discriminator;
		}
		return "**[Not found]**";
	} else if(reg1.test(str)){ // Is the user: or id method the user?
		var id = str.split(":")[1];
		var user = bot.users.get(id);
		if(user !== undefined && user !== null && user !== false){
			return user.username+"#"+user.discriminator;
		}
		return "**[Not found]**";
	} else if(reg2.test(str)){ // Is the user in the fleet?
		var id = str.split(":")[1];
		if(_u.fleets[id] == undefined){
			return "Error (Fleet not found)";	
		} else {
			return _u.fleets[id].name +" ["+id+"]";
		}
	} else {
		return "**Unable to parse**";	
	}
}

exports.getResource = function(chance)
{
	for(var i in _g.mining){
		var r = _g.mining[i];
		if(chance >= r.chance[0] && chance <= r.chance[1]){
			return [i, r.value];	
		}
	}
	return false;
}

exports.userdata = function(m)
{
	if(_u.users[m.author.id] == undefined){
		_u.users[m.author.id] = {
			money: 10000,
			ships: {},
			version: 1,
			colonies: []
		};
		
		return _u.users[m.author.id];
	}
	return _u.users[m.author.id];
}

exports.distance = function(v,v2)
{
	var dist = Math.sqrt( Math.pow((v[0]-v2[0]), 2) + Math.pow((v[1]-v2[1]), 2) );
	return dist;
}

exports.Vector2 = function(s)
{
	var reg = new RegExp(/^([\-]{0,1})([0-9]*)(\,)([\-]{0,1})([0-9]*)+$/);
	if(reg.test(s) == false){
		return false;	
	}
	var v = s.split(",");	
	if(v[0] == "" || v[1] == "" || parseInt(v[0]) == NaN || parseInt(v[1]) == NaN){
		return false;
	}
	return [parseInt(v[0]), parseInt(v[1])];
}

exports.intSectorData = function(coords)
{
	if(_u.sectors[coords] == undefined){
		_u.sectors[coords] = {
			name: "Sector "+coords,
			colonies: [],
			max_colonies: getRandomInt(1,6),
			owner: false
		}
		return _u.sectors[coords];
	}
	return _u.sectors[coords];
}

exports.getMyColonies = function(id, ps, page)
{
	if(ps == undefined || page == undefined){
		var c = {};
		for(var i in _u.colonies)
		{
			if(_u.colonies[i].owner == id){
				c[i] = _u.colonies[i];
			}
		}
		return c;
	} else {
		var c = {};
		var start = page*ps-ps+1;
		var end = page*ps;
		var at = 1;
		for(var i in _u.colonies)
		{
			if(_u.colonies[i].owner == id){
				if(at >= start && at <= end){
					c[i] = _u.colonies[i];
				} else if(at > end){
					return c;
				}
				at++;
			}
		}
		return c;
	}
}

exports.isNumeric = function(n) {
	n=n.toString().replace(/[,.]*/g, "");
	return !isNaN(n);
}

exports.toNumber = (n)=>{
	return parseInt(n.toString().replace(/[,.]*/g, ""));
}

exports.toUser = (user)=>{
	return "**"+user.username+"#"+user.discriminator+"**";
}

// Gets all the ships being selected.
// Message, String Seletor, Ship type[] only
exports.getShips = function(m, str, opt)
{
	if(opt === undefined || opt === null){
		opt = {
			types: false,
			canMove: false
		};
	}
	if(opt.types === undefined){
		opt.types = false;
	}
	str=str.replaceAll(" ", "");
	var d = exports.userdata(m);
	var mode = 0;
	var reg1 = new RegExp(/^[\d\,]*$/);
	var reg3 = new RegExp(/^([0-9]*)$/);
	var reg4 = new RegExp(/^(type\:)([a-zA-Z\_\-]*)$/);
	var reg2 = new RegExp(/^(var\:)([0-9]*)$/);
	var reg5 = new RegExp(/^(division\:)([0-9\,]*)$/);
	var returnShips = [];
	if(str.toLowerCase() == "all"){
		for(var i in d.ships){
			if(d.ships[i] != null && d.ships[i] != undefined){
				returnShips.push(d.ships[i]);
			}
		}
	} else if(reg3.test(str)){
		if(d.ships[str] == undefined){
			return false;
		}
		returnShips = [d.ships[str]];
	} else if(reg1.test(str) == true){
		var s = str.split(",");
		var shp = [];
		for(var i in s){
			if(s[i] != "" && s[i]!= null){
				shp.push(s[i]);
			}
		}
		
		var ships2 = [];
		for(var i in shp){
			if(d.ships[shp[i]] != undefined && d.ships[shp[i]] != null){
				returnShips.push(d.ships[shp[i]]);
			}
		}
	} else if(reg4.test(str)){ //type:miner
		var s = str.split(":");
		for(var i in d.ships){
			var sh = exports.shipdata(d.ships[i].id)
			if(sh.type == s[1]){
				returnShips.push(d.ships[i]);
			}
		}
	} else if(reg2.test(str)){ // var:1
		var s = str.split(":");
		for(var i in d.ships){
			if(d.ships[i].id == s[1]){
				returnShips.push(d.ships[i]);
			} 
		}
	} else {
		return false;
	}
	var newReturn = [];
	for(var i in returnShips){
		var s = exports.shipdata(returnShips[i].id);
		if(s==undefined){
			console.log(returnShips[i], returnShips[i].id);
		}
		if((opt.types === false || opt.types.indexOf(s.type) > -1) && (opt.canMove === false || time_now() >= returnShips[i].move)){
			newReturn.push(returnShips[i]);
		}
	}
	return newReturn;
}

exports.shipVariantCount = function(m)
{
	var d = exports.userdata(m);
	var sh = {};
	for(var i in d.ships){
		var s = d.ships[i];
		if(sh[s.id] == undefined){
			sh[s.id] = 1;	
		} else {
			sh[s.id]++;	
		}
	}
	
	return sh;
}

exports.shipdata = function(sd)
{
	return _g.ships[sd];
}

// Calculates the amount of space taken with the inventory object.
exports.invSpace = function(inv)
{
	var total = 0;
	for(var i in inv){
		total+=_g.mining[i].size*inv[i];
	}
	return total;
}

exports.addToInventory = function(ship, item, amount)
{
	if(ship.inventory == undefined){
		ship.inventory = {};
	}
	var r = _g.mining[item];
	var normal = exports.shipdata(ship.id).space;
	var spaceleft = normal - exports.invSpace(ship.inventory);
	var isize = amount*r.size;
	if(spaceleft < isize){
		return 1;
	} else {
		if(ship.inventory[item] == undefined){
			ship.inventory[item] = amount;
		} else {
			ship.inventory[item] += amount;
		}
		return 0;
	}
}

// Calculates the colony inventory size.
exports.colonyInvSize = function(col)
{
	return 100;
}

// Calculates the colony module size.
exports.colonyModSize = function(col)
{
	return 20;
}

// Gets the current usage of module space on a colony.
exports.colonyModSpace = function(col)
{
	return 0;
}