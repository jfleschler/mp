(function ( exports ) {
	
	function DesktopInput ( game ) {
		this.game = game;
		var ctx = this;

		var canvas = document.getElementById( 'canvas' );
		canvas.addEventListener('click', function ( e ) {
			ctx.onclick.call( ctx, e );
		});

		window.addEventListener( 'keydown', function ( e ) {
			ctx.onmove.call( ctx, e );
		});

		canvas.addEventListener('mousemove', function ( e ) {
			ctx.onrotate.call( ctx, e );
		});

		var join = document.getElementById( 'join' );
		join.addEventListener( 'click', function( e ) {
			ctx.onjoin.call( ctx, e );
		});
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

	DesktopInput.prototype.onmove = function ( event ) {
		var player = this.game.state.objects[playerId];
		if ( !player ) {

			return;
		}
		if ( event.keyCode == 87 ) {
			socket.emit( 'move', {} );
		}
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
		socket.emit( 'rotate', { direction : angle }  );
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
