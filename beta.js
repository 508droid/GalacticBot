/*
	ModuleLoader v0.1
		Loads modules from the module directory.
*/
var fs = require("fs"), path = require('path');
global.modules = {};
global.mod = function(){ return "yo"; };
var dirString = path.dirname(fs.realpathSync(__filename));
global.directory = dirString +"/";
fs.readdir("./modules", function(err, bitems) {
	var items = [];
	fs.readdir("../modules", function(err, bitems2) {
		for(var i in bitems){
			items.push("./modules/"+bitems[i]);
		}
		for(var i in bitems2){
			items.push("../modules/"+bitems2[i]);
		}
	    for (var i in items) {
	        console.log(items[i]);
			var ext = items[i].substring(items[i].length - 3);
			if(ext == ".js"){
				var m = require(items[i]);
				if(m.module == undefined || m.module.name == undefined){
					console.log(items[i] +" module does not have a name.");
				} else {
					//console.log("Loaded module "+m.module.name);
					global.modules[m.module.name] = m;
				}
			}
	    }
		for(var m in global.modules){
			var mod = global.modules[m].module;
			var re = "";
			var missing = false;
			for(var m in mod.libraries){
				try {
					require.resolve(mod.libraries[m])
				} catch(e) {
					console.error(mod.name+": Missing node library: "+ mod.libraries[m]);
					process.exit(e.code);
				}
			}

			for(var m in mod.requires){
				if(global.modules[mod.requires[m]] == undefined){
					missing = true;
					re = re + "\n - "+mod.requires[m];
				}
			}

			if(missing == true){
				console.log(mod.name+" is missing libraries:"+re);
				mod.failed = true;
			}
		}
		
		for(var m in global.modules){
			if(global.modules[m].module.preinit !== undefined){
				global.modules[m].module.preinit();
			}
		}
		
		for(var m in global.modules){
			if(global.modules[m].module.init !== undefined){
				global.modules[m].module.init();
			}
		}
		
		process.on('SIGINT', function() {
			for(var m in global.modules){
				if(global.modules[m].module.close !== undefined){
					global.modules[m].module.close();
				}
			}
		  	process.exit();
		});
	});
});
