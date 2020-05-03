const vorpal = require('vorpal')();
const Actions = require('./inc/actions');
const Server = require('./inc/server');

global.server = new Server();

Actions.init().then(() => {
  vorpal.show();
});

vorpal
  .command('status')
  .description('reset module position')
  .action(function(args, callback) {
    Actions.status(server, true);
    callback();
  })

vorpal
  .command('reset')
  .description('reset module position')
  .action(function(args, callback) {
    Actions.reset();
    callback();
  })

vorpal
  .command('message')
  .description('get current message')
  .action(function(args, callback) {
    Actions.message();
    callback();
  })

vorpal
  .command('position')
  .description('get module position')
  .action(function(args, callback) {
    Actions.position();
    callback();
  })

vorpal
  .command('list <address>')
  .description('get module messages')
  .action(function(args, callback) {
    Actions.list(args.address);
    callback();
  })

vorpal
  .command('find <address> <string>')
  .description('move the module <address> to searched <string>')
  .action(function(args, callback) {
    Actions.find(args.address, args.string)
    callback();
  })

vorpal
  .command('step')
  .description('step the module 1 step ahead')
  .action(function(args, callback) {
    Actions.step()
    callback();
  })

vorpal
  .command('move <address> <position>')
  .description('move the module <address> to <position>')
  .action(function(args, callback) {
    Actions.move(args.address, args.position)
    callback();
  })

vorpal
  .command('turn <action> [duration] [variation]')
  .description('turn mode duration variation, use with start|stop, time in seconds')
  .action(function(args, callback) {
    Actions.turn(args.action, args.duration, args.variation);
    callback();
  });


vorpal
  .command('random <action> [duration] [variation]')
  .description('random mode duration variation, use with start|stop, time in seconds')
  .action(function(args, callback) {
    Actions.random(args.action, args.duration, args.variation);
    callback();
  });

vorpal
  .command('time <action>')
  .description('display the time')
  .action(function(args, callback) {
    Actions.time(args.action);
    callback();
  });

vorpal
  .command('timetable <action>')
  .description('get and display timetable')
  .action(function(args, callback) {
    Actions.timetable(args.action);
    callback();
  });

vorpal.delimiter('fallblatt >');
