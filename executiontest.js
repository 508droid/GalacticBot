var fork = require("child_process").spawn;
var noreply = true;
var args = ["--max-old-space-size=5"];

process.on("uncaughtException", (er)=>{
	console.log("Uncaught Error "+er);
});

function test1(){
	try {
		const cp = require('child_process');
		const n = cp.fork(`${__dirname}/pval.js`, {execArgv: args, silent: false});

		n.on('message', (m) => {
			if(m.timeout){
				console.log("Script timed out.");
			}
		  console.log('PARENT got message:', m);
		});

		n.on("error", (m)=>{
			console.log("Error");
		});

		n.on("exit", (err)=>{
			console.log("Test 1 Exited "+err);
		});

		n.send(["var r = \"lmao\".repeat(2312312);var l=[]; while(true){l.push(r);}", {}]);

	} catch(err){
		console.log(err);
	}	
}

function test2(){
	try {
		const cp = require('child_process');
		const n = cp.fork(`${__dirname}/pval.js`, {execArgv: args, silent: true});

		n.on('message', (m) => {
		  console.log('PARENT got message:', m);
		});

		n.on("error", (m)=>{
			console.log("Error");
		});

		n.on("exit", (err)=>{
			console.log("Test 2 Exited "+err);
		});

		n.send(["'test'", {}]);

	} catch(err){
		console.log(err);
	}	
}

test1();
test2();