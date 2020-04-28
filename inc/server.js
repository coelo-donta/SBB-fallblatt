const express = require('express');
const colors = require('colors');
const vorpal = require('vorpal')();
const Actions = require('./actions');
const bootstrap = require('bootstrap-styl');
const stylus = require('stylus');
const nib = require('nib');
const server = require('http')
const io = require('socket.io');

module.exports = class Server {

  constructor() {
    this.isConnected = false;
    this.app = express();

    this.server = server.createServer(this.app);
    this.io = require('socket.io')(this.server);

    this.io.on('connection', (client) => {
      client.on('status', (data) => {
        client.emit('status', Actions.status(this));
      });

      client.on('message', (data) => {
        client.emit('message', {message: Actions.message(false)});
      });

      client.on('list', (data) => {
        client.emit('list', Actions.list(false));
      });

      client.on('position', (data) => {
        client.emit('position', Actions.position());
      });

      client.on('reset', (data) => {
        Actions.reset();

        client.emit('reset', {success: true, status: Actions.status()});
      });

      client.on('move', (data) => {
        Actions.move(data.destination);

        client.emit('move', {success: true, status: Actions.status()});
      });

      client.on('step', (data) => {
        Actions.step();

        client.emit('step', {success: true, status: Actions.status()});
      });

      client.on('find', (data) => {
        let found = Actions.find(request[2]);

        client.emit('find', {success: found, status: Actions.status()});
      });

      client.on('random', (data) => {
        Actions.random(data.action, data.duration, data.variation);

        client.emit('random', {success: true, status: Actions.status()});
      });

      client.on('turn', (data) => {
        Actions.turn(data.action, data.duration, data.variation);

        client.emit('turn', {success: true, status: Actions.status()});
      });
    });

    this.app.set('views', __dirname + '/../views');
    this.app.set('view engine', 'pug');
    this.app.use(stylus.middleware({
      src: __dirname + '/../public',
      compile: this.compile
    }));

    this.app.use(express.static(__dirname + '/../public'));

    this.app.use(function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'X-Requested-With');
      next();
    });

    this.app.get('/', function (req, res) {
      res.setHeader('Content-Type', 'text/html');
      res.render('index', {page: 'index'});
    });

    this.app.get('/information', function (req, res) {
      res.setHeader('Content-Type', 'text/html');
      res.render('information', {page: 'information'});
    });

    this.app.get('/status', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(Actions.status(this)));
    });

    this.app.get('/message', function (req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({message: Actions.message(false)}));
    });

    this.app.get('/list', function (req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(Actions.list(false)));
    });

    this.app.post('/position', function (req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({position: Actions.position()}));
    });

    this.app.post('/reset', function (req, res) {
      Actions.reset();

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({success: true, status: Actions.status()}));
    });

    this.app.post('/move/*', function (req, res) {
      let request = req.url.split('/');
      Actions.move(request[2]);

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({success: true, status: Actions.status()}));
    });

    this.app.post('/step', function (req, res) {
      Actions.step();

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({success: true, status: Actions.status()}));
    });

    this.app.post('/find/*', function (req, res) {
      let request = req.url.split('/');

      let found = Actions.find(request[2]);

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({success: found, status: Actions.status()}));
    });

    this.app.post('/random/*', function (req, res) {
      let request = req.url.split('/');

      Actions.random(request[2], request[3], request[4]);

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({success: true, status: Actions.status()}));
    });

    this.app.post('/turn/*', function (req, res) {
      let request = req.url.split('/');

      Actions.turn(request[2], request[3], request[4]);

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({success: true, status: Actions.status()}));
    });

    let port = process.env.PORT || 3000;

    this.server.listen(port, (connection) => {
      require('dns').lookup(require('os').hostname(), (err, add, fam) => {
        if (!err) {
          this.isConnected = true;
          this.ipAddress = add;
          vorpal.log(colors.green('frontend is ready: http://' + add + ':' + port + ' or http://127.0.0.1:' + port));
        } else {
          vorpal.log(colors.red(err));
        }
      });
    });
  }

  status() {
    return this.isConnected;
  }

  compile(str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib())
      .use(bootstrap());
  }
}
