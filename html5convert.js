var MediaConverter = require("html5-media-converter");
var request = require("request");
var mc = new MediaConverter({videoFormats: ['webm']});
var converter = mc.asStream("1920x1080");

var randint =(a)=>{
	return Math.floor((Math.random() * a) + 1);
}

var http = require('http');
var fs = require('fs');
var child_process = require('child_process');
var spawn = child_process.spawn;
var sys = require('sys');
var parse = require('url').parse;

function download(file_url , targetPath, done){
    var req = request({
        method: 'GET',
        uri: file_url
    });
    var out = fs.createWriteStream(targetPath);
    req.pipe(out);

    req.on('response', function ( data ) {
    });

    req.on('data', function(chunk) {

    });

    req.on('end', function() {
    	done();
    });
}

process.on('message', function(data) {
	var media = '/home/media/tmp/'+data.name+".wmv";
	download(data.url, media, ()=>{
		var args = ['-i', ''+media+'', '-vcodec', 'libvpx', '-crf', '20', '/home/media/'+data.name+'.webm'];
		var ffmpeg = spawn('ffmpeg', args);
		console.log('Spawning ffmpeg ' + args.join(' '));
		ffmpeg.on('exit', ()=>{
			process.send({status: 200});

			ffmpeg.kill();
		});
	});
});
