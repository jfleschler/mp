(function ( exports ) {

	window.requestAnimFrame = ( function () {
		return window.requestAnimationFrame					||
					 window.webkitRequestAnimationFrame		||
					 window.mozRequestAnimationFrame			||
					 window.oRequestAnimationFrame				||
					 window.msRequestAnimationFrame				||
					 function ( callback, element ) {
						 window.setTimeout( callback, 1000 / 60 );
					 };
	})();

	var CanvasRenderer = function ( game ) {
		this.game = game;
		this.canvas = document.getElementById( 'canvas' );
		this.context = this.canvas.getContext( '2d' );
	};

	CanvasRenderer.prototype.render = function () {
		this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
		var objects = this.game.state.objects;

		for ( var i in objects ) {
			var o = objects[i];
			if ( o.dead ) {
				console.log( 'player', o.id, 'died' );
			}

			this.renderObject_( o );
		}
	
		var ctx = this;
		requestAnimFrame( function () {
			ctx.render.call( ctx );
		});
	};

	CanvasRenderer.prototype.renderObject_ = function ( obj ) {
		var ctx = this.context;

		ctx.fillStyle = 'black';
		ctx.strokeStyle = 'black';

		ctx.save();
		ctx.translate( obj.x, obj.y );
		ctx.rotate( obj.dir );
		ctx.beginPath();
//		ctx.fillRect( obj.x, obj.y, obj.r, obj.r );
		ctx.moveTo( -10, -6 );
		ctx.lineTo(  12,  0 );
		ctx.lineTo( -10,  6 );
		ctx.lineTo(  -6,  0 );
		ctx.closePath();
//		ctx.fill();
		ctx.stroke();
		ctx.restore();

		ctx.font = "8pt monospace";
		ctx.fillStyle = 'black';
		ctx.textAlign = 'center';
		ctx.fillText( obj.id, obj.x, obj.y - 8 );
	};

	exports.Renderer = CanvasRenderer;

})( window );
