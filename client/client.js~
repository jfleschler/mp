document.addEventListener( 'DOMContentLoaded', function () {

	socket = io.connect();
	game = new Game();
	playerId = null;
	totalSkew = 0;

	var renderer = new Renderer( game );
	var input = new Input( game );


	socket.on( 'start', function( data ) {
		
		game.load( data.state );

		var startDelta = new Date().valueOf() - data.state.timeStamp;

		game.updateEvery( Game.UPDATE_INTERVAL, startDelta );

		// START THE RENDERER
		renderer.render();

		if ( window.location.hash) {
			var name = window.location.hash.slice( 1 );
			socket.emit( 'join', { name : name } );
			document.querySelector( '#join' ).style.display = 'none';
		}
	});

	socket.on( 'state', function ( data ) {
		game.load( data.state );
	});

	socket.on( 'join', function ( data ) {
		game.join( data.name );
		if ( data.isme ) {
			playerId = data.name;

			window.location.hash = '#' + data.name;
		}
	});

	socket.on( 'leave', function ( data ) {
		game.leave( data.name );
	});

	socket.on( 'move', function ( data ) {
		if ( !game.playerExists( data.playerId ) ) {
			return;
		}
		game.move( data.playerId, data.direction, data.timeStamp );
	});

	socket.on( 'rotate', function ( data ) {
		if ( !game.playerExists( data.playerId ) ) {
			return;
		}
		game.rotate( data.playerId, data.direction, data.timeStamp );
	});
		
	socket.on( 'time', function ( data ) {
		var updateDelta = data.lastUpdate - game.state.timeStamp;

		totalSkew += updateDelta;

		if ( Math.abs( totalSkew ) > Game.TARGET_LATENCY ) {
			socket.emit( 'state' );
			totalSkew = 0;
		}

		document.getElementById( 'observer-count' ).innerText =	Math.max( data.observerCount - game.getPlayerCount(), 0);
		document.getElementById( 'player-count' ).innerText = game.getPlayerCount();
		document.getElementById( 'average-lag' ).innerText = Math.abs( updateDelta );
	});

});
