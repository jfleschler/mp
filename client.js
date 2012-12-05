var socket = io.connect();

socket.on( 'onconnected', function ( data ) {
	console.log( 'Connected successfully to the socket.io server.\n' +
		'My server ID is ' + data.id );
});
