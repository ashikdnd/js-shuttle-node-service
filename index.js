var socket  = require( './node_modules/socket.io' );
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var client = [];
var valet = [];
var vsock = [];
var pendingrequest = [];

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){

	/*web*/
	socket.on('dashboard',function(){
		socket.join('dashboard');
	});

	socket.on('usercount',function(callback){
		callback({client:client.length,valet:valet.length});
	});
	/*end web*/

	/*mobile*/
		socket.on('newuser',function(data){
			console.log(data);
			if(client.indexOf(data.userid) > -1 || valet.indexOf(data.userid) > -1) return false;
			var type = data.type;
			var userid = data.userid;
			socket.usertype = type;
			socket.userid = userid;
			if(type == 'valet'){
				socket.valetname = data.valetname;
				socket.valetphone = data.valetphone;
				data.valetname = socket.valetname;
				valet.push(socket.userid);
				var x = {id: socket.userid, sid: socket.id};
				vsock.push(x);
				addValet(data);
				emitUserCount();
			} else if(type == 'admin'){
				socket.join('admins');
			}
		});

		function addValet(data){
			io.to('admins').emit('addValet',{userid:data.userid,valetname:data.valetname,valetphone:data.valetphone,latitude:data.latitude,longitude:data.longitude,socketid:socket.id});
		}
		
		function removeValet(userid){
			io.to('admins').emit('removeValet',{userid:userid});
		}

		socket.on('valetLocation',function(data){
			data.socketid = socket.id;
			io.to('admins').emit('moveMarker',data);
		});


		socket.on('getdriverlocation',function(data,callback){
			var valetid = data.valetid;
			for(var i=0;i < vsock.length; i++){
				if(vsock[i].id == valetid){
					var tracksocketid = vsock[i].sid;				
					callback(tracksocketid);
					return false;
				}
			}
		});

		function emitUserCount(){
			io.to('dashboard').emit('usercount',{client:client.length,valet:valet.length});
		}

		socket.on('disconnect',function(){
		    if(socket.userid){
				if(socket.usertype == 'valet'){
			    	valet.splice(valet.indexOf(socket.userid),1);
			    	removeValet(socket.userid);
			    	emitUserCount();
					for(var i=0; i < vsock.length; i++){
						if(vsock[i].id == socket.userid){
							vsock.splice(i,1);
							return false;
						}
					}					
			    }
			}
		});
	/*end mobile*/
});

http.listen(3010, function(){
  console.log('listening on *:3010');
});
