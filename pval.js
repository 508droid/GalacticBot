const vm = require("vm");
var alreadyrun = false;

process.on("uncaughtException", (er)=>{
	console.log("ERROR");
});
var ms = 100;
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

var consolelog = "";
const sandbox = {};
sandbox.user = {};
sandbox.callbacks = {};
sandbox.console = {};
sandbox.console.log = (str)=>{console.log(str.toString());}
sandbox.getUserById = (userId, callback)=>{
	var randid = getRandomInt(100000,999999);
	process.send({type: "command", cmd: "getUser", uid: randid, args: userId});
	sandbox.callbacks[randid] = callback;
}
sandbox.done = (output)=>{
	process.send({error: false, output: output});
	process.exit();
}

const context = new vm.createContext(sandbox);
process.on('message', function(data) {
	if(data.type == "script"){
		var str = data.code;
		sandbox.user = data.user;
		try {
			const script = new vm.Script(str);
			var out = script.runInContext(context, {
				filename: "userscript",
				timeout: ms
			});
			console.log(out);
		} catch(err){
			process.send({error: true, 
				err: err.toString(), 
				timeout: err.toString().includes("Script execution timed out"), 
				ms: ms
			});
			process.exit();
		}
	} else if(data.type == "command"){
		if(sandbox.callbacks[data.uid] !== undefined){
			sandbox.callbacks[data.uid](data.result);
			delete sandbox.callbacks[data.uid];
		}
	}
});
