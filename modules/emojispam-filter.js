exports.module = {
	name: "filter-emotes",
	requires: ["discordbot"],
	libraries: [],
	failed: false
};

var EmoteFilter = {
	name: "emotes",
	settings: {
		limit: "int"
	}
}

// Fired when a server recieves a filter request.
// Message Object, Server settings Object
EmoteFilter.OnMessage = (message, settings)=>{
	
};

EmoteFilter.SetOption = (settings, option, args)=>{
	
};

exports.module.init = ()=>{
	RegisterFilter(EmoteFilter);
}