exports.module = {
	name: "sqldb",
	requires: ["mysqlhook"],
	libraries: ["mysql"],
	failed: false
};
var sqlname = "nodedb";
var sql = null;
var dbdataloc = "data/db_data.json";
var fs = require("fs");
var dbdata = null;
var md5 = require("md5");
var bot = null;
global.last_error_result = null;
global.last_result = null;
global.logging = false;
exports.statistics = {
	chats: 0
};

exports.settings = {
	mysql: null
};

exports.dbData = function(){ return dbdata; }

exports.module.preinit = function(){
	var jss = require(global.directory+"data/db.json");
	exports.settings.mysql = jss;
	
	dbdata = require(global.directory+dbdataloc);
};

exports.module.init = function(){ 
	modules["mysqlhook"].create(sqlname, exports.settings.mysql);
	sql = modules["mysqlhook"].connections[sqlname];
	global.sqldb = sql;
	global.sqlcon = modules["mysqlhook"].connections[sqlname];

};

exports.addIgnoredUser = function(userID){ 
	if(dbdata.ignore_users.indexOf(userID) == -1){
		dbdata.ignore_users.push(userID); 
	}
};
exports.addIgnoredChannel = function(id){ 
	if(dbdata.ignore_channels.indexOf(id) == -1){
		dbdata.ignore_channels.push(id); 
	}
};
exports.addIgnoredServer = function(id){ 
	if(dbdata.ignore_servers.indexOf(id) == -1){
		dbdata.ignore_servers.push(id); 
	}
};

/*
 Array<moderation>
 Callback<function>
*/
exports.addModerationLogs = (d, cb)=>{

	var insval = [];
	for(var i in d){
		insval.push([
			d[i].user, d[i].server, d[i].reason, d[i].staff, d[i].type 
		]);
	}
	sql.query("insert into `user_moderation` (user_id,server_id,reason,staff_id,mod_type) VALUES ?", [insval], function(err, result) {
		if (err){
			cb(false, err);
			return;
		} else {
			var rowIds = [];
			for (var i = result.insertId; i < result.insertId + result.affectedRows; i++) {
				rowIds.push(i);
			}
			cb(true, rowIds);
			return;
		}
	});
};

exports.getModerationLogs = (userID, callback)=>{
	sql.query("SELECT * FROM `user_moderation` WHERE `user_id`=? ORDER BY `case_id` ASC LIMIT 100;", [userID], function(err, result) {
		if(err){
			callback(false);
		} else {
			callback(true, result);
		}
	});
};

exports.getModeration = (caseID, callback)=>{
	sql.query("select * from `user_moderation` where `case_id`=? limit 1;", [caseID], (err, result)=>{
		if(err || result.length === 0){
			callback(false);
		} else {
			callback(true, result[0]);
		}
	});
};

exports.updateModeration = (caseID, reason, callback)=>{
	sql.query("update `user_moderation` set `reason`=? where `case_id`=? limit 1;", [reason, caseID], (err)=>{
		if(err){
			callback(false);
		} else {
			callback(true);
		}
	});
};

exports.customQuery = function(query, cb){ 
	sql.query(query, function(err, result) {
		if (err){
			cb(false, err);
			global.last_error_result = err;
			return;
		} else {
			global.last_result = result;
			cb(true, result);
			return;
		}
	});
};

exports.getServersInfo = function(id, cb){ 
	sql.query("SELECT * FROM `servers` WHERE server_id IN ("+ id.join(",") +")", function(err, result) {
		if (err){
			console.log(err.stack);
			cb(false, err.code);
			return;
		} else {
			if(result[0] == undefined || result.length == 0){
				cb(true, false);
				return;
			}
			cb(true, result);
			return;
		}
	});
};

exports.saveDBData = function(){
	fs.writeFileSync(global.directory+"data/db_data.json", JSON.stringify(dbdata));
};

exports.reloadDBData = function(){
	delete require.cache[require.resolve(dbdataloc)]
	dbdata = require(dbdataloc);	
};

exports.updateStatistics = function(){
	sql.query("SELECT COUNT(*) FROM `chat_logs`", function(err, result) {
		if (err){
			return;
		} else {
			exports.statistics.chats = result[0]["COUNT(*)"];
			return;
		}
	});
};

exports.logchat = function(m, cb, iserr, isCommand){

	if(global.logging === false || global.logging === undefined){ return; }
	if(m == undefined || m.channel == undefined || m.channel.guild == undefined){
		return;	
	}
	var s = _s[m.channel.guild.id].settings;
	if(s.loglevel == undefined || s.loglevel == 0){
		return;
	}
	if(s.loglevel == 1 && isCommand == false){
		return;
	}
	exports.statistics.chats++;
	var n = Date.now() / 1000 | 0;
	var isbot = 0;
	if(m.author.bot){
		isbot = 1;
	}
	var data = {
		id: m.id,
		channel_id: m.channel.id,
		user_id: m.author.id,
		message: m.content,
		timestamp: time_now(),
		errored: iserr,
		bot: isbot
	};
	if(m.attachments.length > 0){
		data.attachment = m.attachments[0].url;
		data.has_attachment = 1;
	}
	sql.query("INSERT INTO `chat_logs` SET ?;", data, function(err, result) {
		if (err){
			console.log(err.stack);
			cb(false);
			return;
		} else {
			cb(true);
			return;
		}
	});
};

exports.logchatedit = function(m, m2, cb){
	if(global.logging === false || global.logging === undefined ){ return; }
	if(m == undefined || m.channel == undefined || m.channel.guild == undefined){
		return;	
	}
	if(dbdata.ignore_users.indexOf(m.author.id) > -1){
		return;	
	}
	if(dbdata.ignore_servers.indexOf(m.channel.guild.id) > -1){
		return;	
	}
	if(dbdata.ignore_channels.indexOf(m.channel.id) > -1){
		return;	
	}
	if(m2.author.id == global.dbot.user.id){
		return;
	}
	exports.statistics.chats++;
	var isbot = 0;
	if(m.author.bot){
		isbot = 1;
	}
	if(m.id === 0){
		console.log("Error logging.");
		return;
	}
	var ts = time_now() | 0;
	var data = {
		id: m.id,
		channel_id: m.channel.id,
		user_id: m.author.id,
		message: m2.content,
		timestamp: ts,
		bot: isbot,
		edit: 1
	};
	sql.query("INSERT INTO `chat_logs` SET ?;", data, function(err, result) {
		if (err){
			console.log(err.stack);
			cb(false);
			return;
		} else {
			cb(true);
			return;
		}
	});
};

exports.logchatRemoval = function(m, cb){
	if(m === undefined || m === null || m === false){
		return;
	}
	if(global.logging === false || global.logging === undefined ){ return; }
	if(m == undefined || m.channel == undefined || m.channel.guild == undefined){
		return;	
	}
	if(dbdata.ignore_users.indexOf(m.author.id) > -1){
		return;	
	}
	if(dbdata.ignore_servers.indexOf(m.channel.guild.id) > -1){
		return;	
	}
	if(dbdata.ignore_channels.indexOf(m.channel.id) > -1){
		return;	
	}
	if(m2.author.id == global.dbot.user.id){
		return;
	}
	exports.statistics.chats++;
	var isbot = 0;
	if(m.author.bot){
		isbot = 1;
	}
	if(m.id === 0){
		console.log("Error logging.");
		return;
	}
	var ts = time_now() | 0;
	var data = {
		id: m.id,
		channel_id: m.channel.id,
		user_id: m.author.id,
		message: m2.content,
		timestamp: ts,
		bot: isbot,
		edit: 1
	};
	sql.query("INSERT INTO `chat_logs` SET ?;", data, function(err, result) {
		if (err){
			console.log(err.stack);
			cb(false);
			return;
		} else {
			cb(true);
			return;
		}
	});
};

exports.countlogs = function(qset, cb){
	qset = qset.replace("\\", " ");
	sql.query("SELECT COUNT(*) FROM `chat_logs` "+qset, function(err, result) {
		if (err){
			cb(false, err.code);
			return;
		} else {
			cb(true, result);
			return;
		}
	});
};

exports.indexServer = function(server, cb){
	sql.query("SELECT * FROM `servers` WHERE `server_id`=?", [server.id], function(err, result) {
		if (err){
			cb(false, err.code);
			return;
		} else {
			if(result.length == 0){
				// no server
				console.log("No server found");
				var data = {
					server_id: server.id,
					owner_id: server.ownerID,
					server_name: server.name
				};
				sql.query("INSERT INTO `servers` SET ?", data, function(err2, result2){
					if(err2){ cb(false, err2.code); } else {
						cb(true);	
					}
				});
			} else {
				console.log("Server was found.");	
				cb(true);
			}
			return;
		}
	});
};

exports.setInvite = function(server, invite, cb){
	sql.query("UPDATE `servers` SET `invite`=? WHERE `server_id`=? LIMIT 1;", [invite, server.id], function(err, result){
		if(err){ cb(false); } else { cb(true); }
	});
};

exports.setServerInformation = function(server, set, cb){
	if(cb == undefined){
		cb = function(){};
	}
	if(set.settings != undefined){
		if(set.settings == "{}"){
			cb(false);
			return;
		}
	}
	sql.query("REPLACE INTO `servers` SET ? WHERE `server_id`=?", [set, server.id], function(err, result){
		if(err){ cb(false); } else { cb(true); }
	});
};

exports.createServerData = function(server, cbFunc)
{
	function precb(d)
	{
		if(cbFunc != undefined){
			cbFunc(d);
		}
	}
	sqlcon.query("select * from `servers` where `server_id`=? limit 1;", [server.id], (err, rows)=>{
		if(err){
			console.log("createServerData SQL Error ",err.stack);
			precb(false);
		} else {
			if(rows.length == 0){
				var serverdata = {
					server_id: server.id,
					server_name: server.name,
					owner_id: server.ownerID,
					settings: "{}"
				}
				sqlcon.query("insert into `servers` set ?", [serverdata], function(err2){
					if(err2){
						console.log("createServerData SQL Error ",err2.stack);
						precb(false);
					} else {
						precb(true);
					}
				});
			} else {
				var serverdata = rows[0];
				try {
					var j = JSON.stringify(serverdata.settings);
					_s[server.id].settings = j;
				} catch(err3){
					console.log("Error parsing Json");
				}
				
				precb(true);
			}
		}
	})
}

exports.updateServerInformation = function(server, set, cb){
	if(cb == undefined){
		cb = function(){};
	}
	if(set.settings != undefined){
		if(set.settings == "{}"){
			cb(false);
			return;
		}
	}
	sql.query("UPDATE `servers` SET ? WHERE server_id=?", [set, server], function(err, result){
		if(err){ cb(false); } else { cb(true); }
	});
};

exports.createSettingsRevision = function(server, settings)
{
	sql.query("insert into `settings_backup` (`server_id`, `time`, `settings`) values (?,?,?)", [server, time_now(), settings]);
};

exports.logError = function(err, m, ispriv){
	var hashm = md5(err.stack);
	var t = time_now();
	var serverid = m.channel.guild.id;
	console.log("Error caught "+hashm+" : "+m.content);
	global.dbot.reply(m, "There was an internal error, the error is automatically logged, and should be fixed. MD5 "+hashm);
	sql.query("INSERT INTO `errors` SET md5=?,count=1,error=?,timestamp=?,is_private=? ON DUPLICATE KEY UPDATE count=count+1, timestamp=?;", 
		[hashm,err.stack,t,hashm,ispriv,t], function(err, result){
			if(err){
				console.log("MAJOR ERROR: "+err.stack);
				return;
			}
			sql.query("INSERT INTO `server_errors` SET server_id=?,count=1 ON DUPLICATE KEY UPDATE count=count+1;", [serverid], function(err2, res2){});
	});
};

exports.logErrorRaw = function(err){
	var hashm = md5(err.stack);
	var t = time_now();
	console.log(err.stack);
	console.log("Error caught "+hashm);
	sql.query("INSERT INTO `errors` SET md5=?,count=1,error=?,timestamp=?,is_private=? ON DUPLICATE KEY UPDATE count=count+1, timestamp=?;", 
		[hashm,err.stack,t,hashm,false,t], function(err, result){
			if(err){
				console.log("MAJOR ERROR: "+err.stack);
				return;
			}
	});
};

exports.setDesc = function(server, d, cb){
	sql.query("UPDATE `servers` SET `description`=? WHERE `server_id`=? LIMIT 1;", [d, server.id], function(err, result){
		if(err){ cb(false); } else { cb(true); }
	});
};

exports.getlogs = function(qset, cb){
	qset = qset.replace("\\", " ");
	sql.query("SELECT `id`,`user_id`,`message`,`timestamp`,`has_attachment` FROM `chat_logs` "+qset, function(err, result) {
		if (err){
			cb(false, err.code);
			return;
		} else {
			cb(true, result);
			return;
		}
	});
};

exports.getLogsSafe = function(qset, param, cb){
	sql.query("SELECT * FROM `chat_logs` "+qset, param, function(err, result) {
		if (err){
			cb(false, err.code);
			return;
		} else {
			cb(true, result);
			return;
		}
	});
};

exports.getServerInfo = function(serverid, cb){
	sql.query("SELECT * FROM `servers` WHERE server_id=?", [serverid], function(err, result) {
		if (err){
			cb(false, err.code);
			return;
		} else {
			if(result.length == 0 || result[0] == undefined){
				cb(true, null);
				return;
			}
			cb(true, result[0]);
			return;
		}
	});
};

exports.getTags = function(server, cb){
	sql.query("SELECT tags FROM `servers` WHERE server_id=?",[server.id], function(err, result) {
		if (err){
			cb(false, err.code);
			return;
		} else {
			if(result[0] == undefined){
				cab(true, []);
				return;
			}
			cb(true, result[0].tags);
			return;
		}
	});	
};

exports.setTags = function(server, tags, cb){
	sql.query("UPDATE `servers` SET `tags`=? WHERE `server_id`=?",[tags, server.id], function(err, result) {
		if (err){
			cb(false, err.code);
			return;
		} else {
			cb(true, result);
			return;
		}
	});			
};

exports.clearTags = function(server, cb){
	sql.query("UPDATE `servers` SET `tags`=NULL WHERE `server_id`=?;",[server.id], function(err, result) {
		if (err){
			cb(false, err.code);
			return;
		} else {
			cb(true, result);
			return;
		}
	});		
};

exports.clearlogs = function(qset, cb){
	qset = qset.replace("\\", " ");
	var qr = "DELETE FROM `chat_logs` WHERE "+qset;
	try {
		sql.query(qr, function(err, result) {
			if (err){
				cb(false, err.code);
				return;
			} else {
				cb(true, result);
				return;
			}
		});
	} catch(e){
		cb(false);	
	}
};

exports.searchWithTags = function(tags, page, cb){
	var qs = [];
	var q = [];
	for(var i in tags){
		qs.push("tags LIKE ?");
		q.push("%"+tags[i]+"%");
	}
	
	qs = qs.join(" AND ");
	
	sql.query("SELECT server_id, invite, description FROM `servers` WHERE "+qs+" LIMIT 25",q, function(err, result) {
		if (err){
			throw err;
			cb(false, err.code);
		} else {
			cb(true, result);
		}
	});	
};