/*
	Name: Remotes
	Description:
		Handles networking between server and clients.
	Last Update: May 28th
	Version: 0.1.1
*/
exports.module = {
	name: "remotes",
	requires: [],
	libraries: ["ws"],
	failed: false
};

var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;
var time_now = function(){ return Math.floor(Date.now() / 1000); }
exports.module.preinit = function()
{
	
}

exports.module.init = function()
{

}

exports.Server = function(name, port, opt)
{
	var server = {
		name: name,
		socket: null,
		Clients: {},
		ClientNum: 1,
		Events: {},
		Functions: {},
		port: port,
		Auth: false
	};
	if(opt !== undefined){
		if(opt.Auth !== undefined){ server.Auth = opt.Auth; }
	}

	server.CreateEvent = function(ename, callback){
		var newEvent = {};
		newEvent.Callback = callback;
		newEvent.Fire = function(client, data, flags)
		{
			var np = {
				a: ename,
				d: data
			}
			if(client.socket.readyState == WebSocket.OPEN){
				client.socket.send(JSON.stringify(np));
			}
		}

		newEvent.FireAllClients = function(data, flags)
		{
			for(var i in server.Clients){
				newEvent.Fire(server.Clients[i], data, flags);
			}
		}

		server.Events[ename] = newEvent;
	}

	server.OnServerReceive = function(client, data, flags)
	{
		try {
			var j = JSON.parse(data);
			if(j.headers !== undefined){
				client.headers = j.headers;
				if(client.headers.Auth !== server.Auth && server.Auth !== false){
					client.socket.terminate();
					delete client;
					return;
				} else {

				}
			}
			if(client.headers === false){
				return;
			}
			if(server.Events[j.a] !== undefined && server.Events[j.a].Callback !== undefined){
				server.Events[j.a].Callback(client, j.d, flags);
			}
		} catch(err){
			if(client.headers === false){
				client.socket.terminate();
				delete client;
			}
		}
	}

	server.ClientTimer = setInterval(function(){
		for(var i in server.Clients){
			if(server.Auth !== false && (server.Clients[i].headers === false || server.Clients[i].headers.Auth !== server.Auth)){
				if(server.Clients[i].start + 2 <= time_now()){
					console.log("Closing client "+server.Clients[i].socket.address)
					server.Clients[i].socket.terminate();
					delete server.Clients[i];
				}
			}
		}
	}, 100);

	server.socket = CreateServerSocket(server);
	return server;
}

function CreateServerSocket(server)
{
	server.socket = new WebSocketServer({ port: server.port });
	server.socket.on('connection', function connection(clientSock) {
		server.ClientNum++;
		console.log("New connection from "+clientSock.upgradeReq.connection.remoteAddress);
		clientSock.on('message', function(msg, flags){
			server.OnServerReceive(server.Clients[server.ClientNum], msg, flags);
		});
		clientSock.on('close', function(msg){
			try {
				//server.Clients[server.ClientNum].socket.terminate();
			} catch(err){

			}
			delete server.Clients[server.ClientNum];
		});

		server.Clients[server.ClientNum] = {socket: clientSock, headers: false, start: time_now()}
	});

	server.socket.on('error', function(err){
		console.log(err.stack);
	});
}

exports.Client = function(name, location, flags)
{
	var client = {
		name: name,
		socket: null,
		Events: {},
		Funtions: {},
		l: location,
		logging: false
	};


	client.OnEvent = function(name, callback)
	{
		client.Events[name] = callback;
	}

	client.OnClientReceive = function(data, flags)
	{
		try {
			if(flags.binary){
				// Handle binary
			} else {
				var j = JSON.parse(data)
				if(client.Events[j.a] != undefined){
					client.Events[j.a].Callback(j.d, flags);
				}
			}
		} catch(err){
			if(client.logging){
				console.log(err.stack);
			}
		}
	}

	client.CreateEvent = function(name, callback)
	{
		var event = {
			Name: name,
			Callback: callback,
			Attempts: 0
		};

		event.Fire = function(data, flags)
		{
			var np = {
				a: event.Name,
				d: data
			}
			if(client.socket.readyState == WebSocket.OPEN){
				client.socket.send(JSON.stringify(np));
			} else {
				event.Attempts++;
				if(event.Attempts >= 10){
					console.log("Web socket is not in its OPEN state");
					event.Attempts = 0;
				}
			}
		}
		client.Events[name] = event;
	}

	client.socket = CreateSocket(client);
	return client;
}

exports.reconnect = function(obj)
{
	obj.socket = CreateSocket(obj);
}

function CreateSocket(obj, objheaders)
{
	var packet = {headers: false};
	if(objheaders !== undefined){
		packet.headers = objheaders;
	}
	if(obj.l == undefined){
		console.log("Can't open socket, location missing.");
		return;
	}
	var socket = new WebSocket(obj.l);
	socket.on('open', function open() {
		socket.send(JSON.stringify(packet));
	});

	socket.on('message', function(data, flags) {
		obj.OnClientReceive(data, flags);
	});

	socket.on("error", function(err){
		if(socket.readyState == WebSocket.CLOSED || socket.readyState == WebSocket.CLOSING){
			setTimeout(function(){
				exports.reconnect(obj)
			}, 5000);
			console.log("Socket has errored, reconnecting. "+err.stack);
		} else {
			console.log(err.stack);
		}
	
	});

	socket.on("close", function(err, msg){
		console.log(obj.name +" socket has closed.");
		setTimeout(function(){
			exports.reconnect(obj)
		}, 10000);
	});

	return socket;
}