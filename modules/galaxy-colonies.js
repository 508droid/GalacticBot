exports.module = {
	name: "galaxycolonymodules",
	requires: [],
	libraries: [],
	failed: false
};

var _g = null;
var _u = null;
var glib = null;

exports.module.preinit = function(){
	
};

exports.module.init = function(){
	glib = modules.galaxylib;
	_g = glib._g;
	_u = glib._u;

	glib.ColonyModules = ColonyModule;
	glib.ColonySpecials = ColonySpecial;
}

var ColonyModule = {};

ColonyModule.jumpgate = {};

var ColonySpecial = {};

// Gives an unlimited supply of a random resource to a planet, making it valuable.
ColonySpecial.Resource = {
	chance: [8],
	stackable: false,
	resources: ["iron","diamond","plutonium","spice"]
}

// Multiplys the colonies module space and max population
ColonySpecial.Size = {
	chance: [15],
	stackable: true
}

// Allows the planet to have a refinery
ColonySpecial.Refinery = {
	
}


