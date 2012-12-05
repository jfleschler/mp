(function ( exports ) {

	var Game = function () {
		this.state = {};
		this.oldState = {};

		this.lastId = 0;
		this.callbacks = {};

		this.updateCount = 0;
		this.timer = null;
	};

	Game.UPDATE_INTERVAL = Math.round( 1000 / 60 );
	Game.MAX_DELTA = 10000;
	Game.WIDTH = 1000;
	Game.HEIGHT = 400;
	Game.PLAYER_SPEED_RATIO = 1;
	Game.SHOT_AREA_RATIO = 0.02;
	Game.TARGET_LATENCY = 1000;
	Game.RESTART_DELAY = 1000;

	Game.prototype.computeState = function ( delta ) {
		var newState = {
			objects : {},
			timeStamp : this.state.timeStamp + delta
		};
		var newObjects = newState.objects;
		var objects = this.state.objects;

		for ( var objId in objects ) {
			var obj = objects[objId];
			if ( !obj.dead ) {
				newObjects[obj.id] = obj.computeState( delta );
			}
		}
		
		/* CHECK FOR COLLISIONS HERE */

		return newState;
	};

	Game.prototype.update = function ( timeStamp ) {
		var delta = timeStamp - this.state.timeStamp;
		if ( delta < 0 ) {
			throw "Can't compute state in the past. Delta: " + delta;
		}
		if ( delta > Game.MAX_DELTA ) {
			throw "Can't compute state so far in the future. Delta: " + delta;
		}
		this.state = this.computeState( delta );
		this.updateCount++;
	};

	Game.prototype.updateEvery = function ( interval, skew ) {
		if ( !skew ) {
			skew = 0;
		}
		var lastUpdate = ( new Date() ).valueOf() - skew;
		var ctx = this;
		this.timer = setInterval( function () {
			var date = ( new Date() ).valueOf() - skew;
			if ( date - lastUpdate >= interval ) {
				ctx.update( date );
				lastUpdate += interval;
			}
		}, 1);
	};

	Game.prototype.over = function () {
		clearInterval( this.timer );
	};

	Game.prototype.join = function ( id ) {
		var x, y, vx, vy;

		x = 50; y = 50; vx = 0; vy = 0;

		var player = new Player( {
			id : id,
			x : x,
			y : y,
			vx : vx,
			vy : vy,
			r : 20,
			dir : 0
		});
		this.state.objects[player.id] = player;
		return player.id;
	};

	Game.prototype.leave = function ( playerId ) {
		delete this.state.objects[playerId];
	};

	Game.prototype.move = function ( id, timeStamp ) {
		var player = this.state.objects[id];

		var ex = Math.cos( player.dir );
		var ey = Math.sin( player.dir );
		var len = Math.sqrt( ex * ex + ey * ey );

		ex = ex / len;
		ey = ey / len;

		player.vx = ex * Game.PLAYER_SPEED_RATIO; 
		player.vy = ey * Game.PLAYER_SPEED_RATIO; 

		if ( player.vx < -1 ) player.vx = -1;
		if ( player.vx >  1 ) player.vx =  1;
		if ( player.vy < -1 ) player.vy = -1;
		if ( player.vy >  1 ) player.vy =  1;
	}; 
	
	Game.prototype.rotate = function ( id, direction, timeStamp ) {
		var player = this.state.objects[id];
		if ( !player || !direction ) {
			return;
		}
		player.dir = direction;
	};

	Game.prototype.getPlayerCount = function () { var count = 0;
		var objects = this.state.objects;
		for ( var id in objects ) {
			if ( objects[id].type == 'player' ) {
				count++;
			}
		}
		return count;
	};

	Game.prototype.save = function () {
		var serialized = {
			objects : {},
			timeStamp : this.state.timeStamp
		};
		for ( var id in this.state.objects ) {
			var obj = this.state.objects[id];
			serialized.objects[id] = obj.toJSON();
		}

		return serialized;
	};

	Game.prototype.load = function ( savedState ) {
		var objects = savedState.objects;
		this.state = {
			objects : {},
			timeStamp : savedState.timeStamp.valueOf()
		};
		for ( var id in objects ) {
			var obj = objects[id];

			if ( obj.type == 'player' ) {
				this.state.objects[obj.id] = new Player( obj );
			}
			if ( obj.id > this.lastID ) {
				this.lastId = obj.id;
			}
		}
	};

	// HELPER FUNTIONS
	
	Game.prototype.inBounds_ = function ( o ) {
		return o.r < o.x && o.x < ( Game.WIDTH - o.r) && 
			o.r < o.y && o.y < ( Game.HEIGHT - o.r);
	};

	Game.prototype.callback_ = function ( event, data ) {
		var callback = this.callbacks[event];
		if ( callback ) {
			callback(data);
		} else {
			throw "Warning: No callback defined!";
		}
	};

	Game.prototype.newId_ = function () {
		return ++this.lastId;
	};

	Game.prototype.on = function ( event, callback ) {
		this.callbacks[event] = callback;
	};

	Game.prototype.playerExists = function ( playerId ) {
		return this.state.objects[playerId] !== undefined;
	};

	var Player = function ( params ) {
		if ( !params ) {
			return;
		}

		this.name = params.name;
		this.id = params.id;
		this.x = params.x;
		this.y = params.y;
		this.r = params.r;
		this.vx = params.vx;
		this.vy = params.vy;
		this.type = 'player';
		this.dir = params.dir;
	};

	Player.prototype.computeState = function ( delta ) {
		var newPlayer = new Player( this.toJSON() ); //this.constructor( this.toJSON() );
		newPlayer.x += this.vx * delta / 10;
		newPlayer.y += this.vy * delta / 10;
		newPlayer.vx = newPlayer.vx * 0.9;
		newPlayer.vy = newPlayer.vy * 0.9;
		return newPlayer;
	};

	Player.prototype.toJSON = function () {
		var obj = {};
		for ( var prop in this ) {
		//	if ( this.hasOwnProperty( prop ) ) {
				obj[prop] = this[prop];
		//	}
		}
		return obj;
	};

//	Player.prototype = new Player();
//	Player.prototype.constructor = Player;

	exports.Game = Game;
	exports.Player = Player;

})( typeof  global === "undefined" ? window : exports );
