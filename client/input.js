(function ( exports ) {
	
	function DesktopInput ( game ) {
		this.game = game;
		var ctx = this;

		var keyMap = { 87: false, 65: false, 68: false };

		var canvas = document.getElementById( 'canvas' );
		canvas.addEventListener('click', function ( e ) {
			ctx.onclick.call( ctx, e );
		});

		window.addEventListener( 'keydown', function ( e ) {
			keyMap = ctx.onmove.call( ctx, e, keyMap );
		});

		window.addEventListener( 'keyup', function ( e ) {
			keyMap = ctx.canclemove.call( ctx, e, keyMap );
		});

		canvas.addEventListener('mousemove', function ( e ) {
			ctx.onrotate.call( ctx, e );
		});

		var join = document.getElementById( 'join' );
		join.addEventListener( 'click', function( e ) {
			ctx.onjoin.call( ctx, e );
		});
		
		setInterval( function () {
			if ( keyMap[87] ) {
				socket.emit( 'move', {} );
			}
			if ( keyMap[65] ) {
				var p = this.game.state.objects[playerId];
				socket.emit( 'rotate', { direction : p.dir - 0.2 } );
			}
			if ( keyMap[68] ) {
				var p = this.game.state.objects[playerId];
				socket.emit( 'rotate', { direction : p.dir + 0.2 } );
			}
		}, 1);
	};

	DesktopInput.prototype.onjoin = function () {
		if ( !playerId ) {
			var name = prompt( 'What is your name?' );
			if ( name ) {
				console.log( 'Your name is ' + name );
				socket.emit( 'join', { name : name } );
				document.querySelector( '#join' ).style.display = 'none';
			}
		}
	};

	DesktopInput.prototype.onleave = function () {
		socket.emit( 'leave', { name : playerId } );
	};

	DesktopInput.prototype.canclemove = function ( event, map ) {
		if ( event.keyCode == 32 ) {
			var p = this.game.state.objects[playerId];
			socket.emit( 'shoot', { direction : p.dir } );
		}
		map[event.keyCode] = false;
		return map;
	};

	DesktopInput.prototype.onmove = function ( event, map ) {
		var player = this.game.state.objects[playerId];
		if ( !player ) {
			return;
		}
		map[event.keyCode] = true;
		return map;
	};

	DesktopInput.prototype.onrotate = function ( event ) {
		var cx = event.clientX - event.target.getBoundingClientRect().left;
		var cy = event.clientY - event.target.getBoundingClientRect().top;

		if ( !this.game.state.objects ) {
			return;
		}

		var player = this.game.state.objects[playerId];

		if ( !player ) {
			return;
		}

		var px = player.x;
		var py = player.y;

		var angle = Math.atan2( cy - py, cx - px );
//		socket.emit( 'rotate', { direction : angle }  );
	};

	DesktopInput.prototype.onclick = function ( event ) {
		var cx = event.clientX - event.target.getBoundingClientRect().left;
		var cy = event.clientY - event.target.getBoundingClientRect().top;

		var player = this.game.state.objects[playerId];

		if ( !player ) {
			return;
		}

		var px = player.x;
		var py = player.y;

		var angle = Math.atan2( cy - py, cx - px );
		socket.emit( 'shoot', { direction : angle } );
	};

	exports.Input = DesktopInput;

})( window );
