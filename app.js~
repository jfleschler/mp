var
		gameport			= 8080,
		
		express				= require('express');
		app						= express(),
		server				= require('http').createServer(app),
		io						= require('socket.io').listen(server),

		UUID					= require('node-uuid'),
		verbose				= true,
		gamejs				= new require( './common/game.js'),
		Game					= gamejs.Game,
		game					= new Game();

/* Set up Express Server */

server.listen( gameport );

console.log( '\t :: Express :: Listening on port ' + gameport );

app.configure( function () {
	app.use(express.favicon());
});

app.get( '/', function ( req, res ) {
	res.sendfile( __dirname + '/client/index.html' );
});

app.get( '/*', function ( req, res, next ) {
	var file = req.params[0];

	if(verbose) console.log( '\t :: Express :: file requested : ' + file );

	res.sendfile( __dirname + '/' + file );
});

/* Set up Game */

game.updateEvery( Game.UPDATE_INTERVAL );
var observerCount = 0;

game.load( { objects : {}, timeStamp : new Date() });

/* Set up Socket.IO */

io.configure('development',  function(){
	    io.set('transports', ['xhr-polling']);
});

io.configure( function () {
	io.set( 'log level', 0 );

	io.set( 'authorization', function ( handshakeData, callback ) {
		callback( null, true );
	});
});

io.sockets.on( 'connection', function ( client ) {

	observerCount++;
	client.userid = UUID();
	var playerId = null;

	client.emit( 'start', { state : game.save() } );

	console.log( '\t :: Socket.IO :: player ' + client.userid + ' connected' );

	client.on( 'state', function ( data ) {
		client.emit( 'state', { state : game.save() } );
	});

	client.on( 'join', function ( data ) {
		playerId = game.join( data.name );
		data.timeStamp = new Date();

		console.log( '\t :: Socket.IO :: player ' + client.userid + ' :: playerId ' + playerId );

		client.broadcast.emit( 'join', data );
		data.isme = true;
		client.emit( 'join', data );
	});

	client.on ( 'disconnect', function ( data ) {
		observerCount--;
		if ( playerId ) {
			game.leave(playerId);
		}
		client.broadcast.emit( 'leave', { name : playerId, timeStamp : new Date() } );
		console.log( '\t :: Socket.IO :: client disconnected ' + client.userid );
	});

	client.on( 'move', function ( data ) {
		game.move( playerId ); //, data.direction );
		data.playerId = playerId;

		data.timeStamp = ( new Date() ).valueOf();
		io.sockets.emit( 'move', data );
	});

	client.on( 'rotate', function ( data ) {
		game.rotate( playerId, data.direction );
		data.playerId = playerId;

		data.timeStamp = ( new Date() ).valueOf;
		io.sockets.emit( 'rotate', data );
	});

	client.on( 'leave', function ( data ) {
		observerCount--;
		game.leave( data.playerId );
		data.timeStamp = new Date();

		client.broadcast.emit( 'leave', data );
	});

	var timeSyncTimer = setInterval( function () {
		client.emit( 'time', {
			timeStamp : ( new Date() ).valueOf(),
			lastUpdate : game.state.timeStamp,
			updateCount : game.updateCount,
			observerCount : observerCount
		});
	}, 2000 );

});
