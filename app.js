var app = require('express')() 
  , fs = require('fs')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , File = {};

server.listen(8080);

app.get('/', function(req, res, next){
  fs.readFile(__dirname + '/sender.html', function (err, data) {
    if (err) next();
    res.writeHead(200);
    res.end(data);
  });
});

app.get('/receiver', function(req, res, next){
  fs.readFile(__dirname + '/receiver.html', function (err, data) {
    if (err) next();
    res.writeHead(200);
    res.end(data);
  });
});

app.get('/*', function(req, res){
  if (File['isLoaded']) {
    res.writeHead(200, {'Content-Type': 'application/octet-stream'});
    res.write(File['Data'], 'binary');
    res.end(); 
  } else {
    res.writeHead(500);
    return res.end('Error loading file');
  }
});


io.sockets.on('connection', function (socket) {
  socket.on('Start', function (data) {
    File = {
      Name : data['Name'],
      FileSize : data['Size'],
      Data	 : "",
      Downloaded : 0,
      isLoaded : false
    }
    io.sockets.emit('MoreData', { 'Place' : 0, Percent : 0 });
  });
	
  socket.on('Upload', function (data){
    File['Downloaded'] += data['Data'].length;
    File['Data'] += data['Data'];
    
    if(File['Downloaded'] == File['FileSize']) {
      File['isLoaded'] = true;
      io.sockets.emit('Done', { 'Name' : File['Name']});
    } else {
      var Place = File['Downloaded'] / 524288;
      var Percent = (File['Downloaded'] / File['FileSize']) * 100;
      io.sockets.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
    }
  });
});
