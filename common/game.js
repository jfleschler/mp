(function ( exports ) {

	var Game = function () {
		this.state = {};
		this.oldState = {};

		this.lastId = 0;
		this.lastMId = 1000;
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

				if ( obj.type === 'missile' ) {
					if ( !this.inBounds_( obj ) ) {
						delete newState.objects[obj.id];
					}
					for ( var id in objects ) {
						var cObj = objects[id];
						if ( cObj.type === 'player' ) {
							if ( cObj.collides( obj ) && cObj.id != obj.firedBy ) {
								delete newState.objects[obj.id];
								cObj.HP -= 10;
								newObjects[cObj.id] = cObj;
								break;
							}
						}
					}
				} else if ( obj.type === 'player' ) {
					if ( obj.HP <= 5 ) {
						newObjects[obj.id].dead = true;
						this.callback_( 'dead', { id : obj.id, type: obj.type } );
					}
				}
			}
		}
		
		/* CHECK FOR COLLISIONS HERE */

		return newState;
	};

	Game.prototype.update = function ( timeStamp ) {
		var delta = timeStamp - this.state.timeStamp;
		if ( delta < 0 ) {
			console.log("Can't compute state in the past. Delta: " + delta);
			return;
		}
		if ( delta > Game.MAX_DELTA ) {
			console.log("Can't compute state so far in the future. Delta: " + delta);
			return;
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
			dir : 0,
			HP : 100
		});
		this.state.objects[player.id] = player;
		return player.id;
	};

	Game.prototype.leave = function ( playerId ) {
		delete this.state.objects[playerId];
	};

	Game.prototype.shoot = function ( id, timeStamp ) {
		var player = this.state.objects[id];

		if ( !player ) {
			return;
		}
		var ex = Math.cos( player.dir ) * 2;
		var ey = Math.sin( player.dir ) * 2;
		
		this.lastMId++;
		var m = new Missile( {
			x : player.x,
			y : player.y,
			vx : ex,
			vy : ey,
			id : this.lastMId,
			firedBy : player.id	
		} );
		this.state.objects[m.id] = m;
	};

	Game.prototype.move = function ( id, timeStamp ) {
		var player = this.state.objects[id];
		if ( !player ) {
			return;
		}
		var ex = Math.cos( player.dir );
		var ey = Math.sin( player.dir );
		var len = Math.sqrt( ex * ex + ey * ey );

		ex = ex / len;
		ey = ey / len;

		player.vx = ex * Game.PLAYER_SPEED_RATIO; 
		player.vy = ey * Game.PLAYER_SPEED_RATIO; 
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
		this.HP = params.HP;
	};

	Player.prototype.computeState = function ( delta ) {
		var newPlayer = new Player( this.toJSON() ); //this.constructor( this.toJSON() );
		newPlayer.x += this.vx * delta / 10;
		newPlayer.y += this.vy * delta / 10;
		newPlayer.vx = newPlayer.vx * 0.9;
		newPlayer.vy = newPlayer.vy * 0.9;
		return newPlayer;
	};

	Player.prototype.collides = function ( obj ) {
		var ex = ( obj.x - this.x ) * ( obj.x - this.x );
		var ey = ( obj.y - this.y ) * ( obj.y - this.y );
		var dist = Math.sqrt( ex + ey );
		return dist < 12;
	};

	Player.prototype.toJSON = function () {
		var obj = {};
		for ( var prop in this ) {
				obj[prop] = this[prop];
		}
		return obj;
	};

//	Player.prototype = new Player();
//	Player.prototype.constructor = Player;

	
	var Missile = function ( params ) {
		this.id = params.id;
		this.x = params.x;
		this.y = params.y;
		this.vx = params.vx;
		this.vy = params.vy;
		this.r = 2;
		this.type = 'missile';
		this.firedBy = params.firedBy;
	};

	Missile.prototype.toJSON = function () {
		var obj = {};
		for ( var prop in this ) {
			obj[prop] = this[prop];
		}
		return obj;
	};

	Missile.prototype.computeState = function ( delta ) {
		var newMissile = new Missile ( this.toJSON() );
		newMissile.x += this.vx * delta / 10;
		newMissile.y += this.vy * delta / 10;
		return newMissile;
	};


	exports.Game = Game;
	exports.Player = Player;
	exports.Missile = Missile;
})( typeof  global === "undefined" ? window : exports );
