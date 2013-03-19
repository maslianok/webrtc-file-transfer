var express = require('express')
  , app = express()
  , fs = require('fs')
  , crypto = require('crypto')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , File = {}
  , token;


app.use(express.static(__dirname + '/public'));


server.listen(8080); 



app.get('/', function(req, res, next){
  fs.readFile(__dirname + '/sender.html', function (err, data) {
    if (err) next();
    res.writeHead(200);
    res.end(data);
  });
});


app.get('/download/:secure', function(req, res){
  if (req.params.secure == File.secureUrl) {
    res.send('<a href="/file/' + File.Name + '">Скачать файл '+ File.Name + '</a>');

  }

  /*if (File['isLoaded']) {
    res.end(); 
  } else {
    res.writeHead(500);
    return res.end('Error loading file');
  }*/
});


app.get('/file/:name', function(req, res){
  io.sockets.emit('MoreData', { 'Place' : 0, Percent : 0 });

  res.setHeader('Content-disposition', 'attachment; filename=' + File.Name);
  res.setHeader('Content-Length', File.FileSize);

  var intervalID = setInterval(function(){
    
    if (File['Data'].length){
      console.log('send!!!!!')
      res.write(File['Data'], 'binary');
      File['Data'] = '';
    }

    if (File['isLoaded']) {  
      console.log('clear!!!!!')
      res.end(); 
      clearInterval(intervalID)
    }
  }, 1000);

  /*if (File['isLoaded']) {
    
    
    res.end(); 
  } else {
    res.writeHead(500);
    return res.end('Error loading file');
  }*/
});


io.sockets.on('connection', function (socket) {

  socket.on('Start', function (data) {
    console.log('start')
    File = {
      Name : data['Name'],
      FileSize : data['Size'],
      Data   : "",
      Downloaded : 0,
      secureUrl : '',
      isLoaded : false
    }

    crypto.randomBytes(12, function(ex, buf) {
      token = buf.toString('hex');
      File.secureUrl = token;
      socket.emit('url', {'token' : token});
    });
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
