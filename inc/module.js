const colors = require('colors');
const vorpal = require('vorpal')();
const fs = require('fs');
const ModuleController = require('./moduleController');
const path = require("path");
const https = require('https');
const Gpio = require('onoff').Gpio;
let config = require('../config/config.json');

let types = ["hour", "minute", "delay", "train", "via", "destination"];
let addr_hour = parseInt(config.modules.find(el => el.type === types[0]).module);
let addr_minute = parseInt(config.modules.find(el => el.type === types[1]).module);
let addr_delay = parseInt(config.modules.find(el => el.type === types[2]).module);
let addr_train = parseInt(config.modules.find(el => el.type === types[3]).module);
let addr_via = parseInt(config.modules.find(el => el.type === types[4]).module);
let addr_destination = parseInt(config.modules.find(el => el.type === types[5]).module);
let addr_clock_hour = parseInt(config.modules.find(el => el.type === "clock_hour").module);
let addr_clock_minute = parseInt(config.modules.find(el => el.type === "clock_minute").module);
let addrs = [addr_hour, addr_minute, addr_delay, addr_train, addr_via, addr_destination];

module.exports = class Module extends ModuleController {
  constructor(address, type) {
    super(address, 0);

    this.type = type;
    this.randomDuration = 10000
    this.randomVariation = 0;
    this.switchMode('static');
    this.loadMessagesMapping(address);
  }

  loadMessagesMapping(address) {
    this.messages = require('../config/modules-mapping/' + address.toString().padStart(2, '0') + '.json');

    this.bladeCount = this.messages.length;
  }

  switchMode(mode) {
    this.mode = mode;

    global.server.io.emit('mode', {mode: this.mode});
  }

  light(status) {
    if (Gpio.accessible) {
      toggle_gpio(status);
      toggle_icon(status);
    } else {
      toggle_icon(status);
    }

    function toggle_icon(status){
      if (status == 'on') {
        global.server.io.emit('light', {status: 'on'});
      } else if (status == 'off') {
        global.server.io.emit('light', {status: 'off'});
      } else {
        return
      }
    }

    function toggle_gpio(status){
      let illum = new Gpio(17, 'out');
      if (status == 'on') {
        illum.writeSync(0);
      } else if (status == 'off') {
        illum.writeSync(1);
      } else {
        return
      }
    }
  }

  message() {
    return this.messages[this.position];
  }

  list(address) {
    this.loadMessagesMapping(address);
    return this.messages;
  }

  find(address, target) {
    var found = false;
    var messageIndex = 0;

    this.random('stop');

    this.loadMessagesMapping(address);

    this.messages.forEach(function(message, index) {
      if (message == target && !found) {
        messageIndex = index;
        found = true;
      }
    });

    if (found) this.move(address, messageIndex);

    return found;
  }

  move(address, position) {
    this.random('stop');
    // send module type for client compatibility
    let type = types[addrs.indexOf(address)];
    super.move(address, type, position);
  }

  random(action, duration = 10000, variation = 0) {
    this.randomDuration = duration
    this.randomVariation = variation;

    switch (action) {
      case 'start':
        clearTimeout(this.randomTimeout);
        clearTimeout(this.turnTimeout);
        this.selectRandomPosition(duration, variation);
        this.switchMode('random');
        break;
      case 'stop':
        clearTimeout(this.randomTimeout);
        this.switchMode('static');
        break;
    }
  }

  selectRandomPosition() {
    this.randomTimeout = setTimeout(() => {
      for (var address of addrs) {
        let index = this.findRandomMessage();
        super.move(address, index);
      }
      this.selectRandomPosition();
    }, this.randomDuration + Math.floor(Math.random() * this.randomVariation));
  }

  findRandomMessage() {
    let isEmpty = true;
    let index = Math.floor(Math.random() * this.messages.length);

    while(isEmpty) {
      var message = this.messages[index].trim();

      if (message) {
        isEmpty = false;
      } else {
        index = Math.floor(Math.random() * this.messages.length);
      }
    }

    return index;
  }

  turn(action, duration = 10000, variation = 0) {
    this.turnDuration = duration
    this.turnVariation = variation;

    switch (action) {
      case 'start':
        clearTimeout(this.randomTimeout);
        clearTimeout(this.turnTimeout);
        this.turnPosition(duration, variation);
        this.switchMode('turn');
        break;
      case 'stop':
        clearTimeout(this.turnTimeout);
        this.switchMode('static');
        break;
    }
  }

  turnPosition() {
    this.turnTimeout = setTimeout(() => {
      super.step();

      this.turnPosition();
    }, this.turnDuration + Math.floor(Math.random() * this.turnVariation));
  }

  time(action) {
    switch (action) {
      case 'start':
        clearTimeout(this.randomTimeout);
        clearTimeout(this.turnTimeout);
        clearTimeout(this.timeTimeout);

        this.updateTime();

        // update on second 0
        let today = new Date()
        var diff = 60000-today.getSeconds()*1000-today.getMilliseconds();
        setTimeout(() => {
          this.displayTime();
        }, diff);

        this.switchMode('time');
        break;
      case 'stop':
        clearTimeout(this.timeTimeout);
        this.switchMode('static');
        break;
    }
  }

  displayTime() {
    this.updateTime();
    // then update every 60 seconds
    let today = new Date()
    var diff = 60005-today.getSeconds()*1000-today.getMilliseconds();
    this.timeTimeout = setTimeout(() => {
      this.displayTime();
    }, diff);
  }

  updateTime() {
    // display current time
    var today = new Date();
    var hour = today.getHours();
    var minutes = today.getMinutes();
    var min_position = this.minutesToPosition(minutes);
    // set position
    super.move(addr_clock_hour, [], hour);
    super.move(addr_clock_minute, [], min_position);
  }

  minutesToPosition(minutes) {
    // convert minute to module position
    var position = (minutes + 31)%62;
    if (minutes < 31) {
        position = position - 1;
    };
    return position;
  }

  date() {
    let today = new Date();
    super.move(addr_clock_hour, [], today.getMonth() + 1);
    super.move(addr_clock_minute, [], this.minutesToPosition(today.getDate()));
  }

  timetable(action) {
    switch (action) {
      case 'start':
        clearTimeout(this.timetableTimeout);

         // display timetable
        this.displayTimetable();
        // update on second 0
        var seconds = new Date().getSeconds();
        var diff = 60-seconds;
        setTimeout(() => {
          this.displayTimetable();
        }, diff*1000);
        this.switchMode('timetable');
        break;
      case 'stop':
        clearTimeout(this.timetableTimeout);
        this.switchMode('static');
        break;
    }

  }

  loadTimetable() {
    var timetable = require('../config/timetable.json');
    // delete module cache to reload updated file every time
    delete require.cache[require.resolve('../config/timetable.json')];

    return timetable;
  }

  displayTimetable() {
    // set timetable
    var interval = this.updateTimetable();

    // update timetable after every interval
    this.timetableTimeout = setTimeout(() => {
      interval = this.displayTimetable();
    }, interval*60000);
  }

  updateTimetable() {
    let today = new Date();
    let hour = today.getHours();
    let minute = today.getMinutes();

    // load and sort timetable by hour and minute
    let timetable = this.loadTimetable();
    timetable.timetable.sort(function (a, b) {
      let aSize = parseInt(a.hour);
      let bSize = parseInt(b.hour);
      let aLow = parseInt(a.minute);
      let bLow = parseInt(b.minute);

      if(aSize == bSize) { return (aLow < bLow) ? -1 : (aLow > bLow) ? 1 : 0;
      } else { return (aSize < bSize) ? -1 : 1; }
    });

    // get all hours an minutes of the schedule
    let schedule_minutes  = [];
    let schedule_hours = [];
    timetable.timetable.forEach(element => {
      schedule_minutes.push(element.minute);
      schedule_hours.push(element.hour);
    });

    let next_index_hour = -1;
    let next_index_hour_plus_one = -1;
    let next_index_minute = -1;
    let current_minutes;
    let hour_iter = hour;
    let next_index;
    let n_iter = 0;

    while(next_index_minute == -1 || next_index_hour == -1) {
      next_index_hour = schedule_hours.findIndex(element => element >= hour_iter);
      next_index_hour_plus_one = schedule_hours.findIndex(element => element > hour_iter);

      // if no hour found start new day
      if (hour_iter > 23) {
        hour_iter = 0;
        continue;
      }
      // if last hour of schedule slice at end
      if (next_index_hour_plus_one == -1) {
        next_index_hour_plus_one = schedule_hours.length;
      }
      // find minutes of current hour
      current_minutes = schedule_minutes.slice(next_index_hour, next_index_hour_plus_one)
      // find next minute
      if (hour_iter == hour) {
        next_index_minute = current_minutes.findIndex(element => element >= minute);
      } else {
        next_index_minute = current_minutes.findIndex(element => element >= 0);
      }
      // add hour index because we sliced
      if (next_index_minute > -1) {
        next_index = next_index_minute + next_index_hour
      }
      
      n_iter++;
      if (n_iter > 25) {break;}
      hour_iter++;
    }

    console.log(timetable.timetable[next_index]);

    // display timetable
    this.move(addr_minute, this.minutesToPosition(parseInt(timetable.timetable[next_index].minute)));
    this.find(addr_hour, timetable.timetable[next_index].hour);
    this.find(addr_delay, timetable.timetable[next_index].delay);
    this.find(addr_train, timetable.timetable[next_index].train);
    this.find(addr_via, timetable.timetable[next_index].via);
    this.find(addr_destination, timetable.timetable[next_index].destination);

    let next_schedule_minutes = timetable.timetable[next_index].minute;
    let next_schedule_hours = timetable.timetable[next_index].hour;

    // get time difference to next update
    let now = new Date(2000, 0, 1,  hour, minute);
    let next_schedule = new Date(2000, 0, 1, next_schedule_hours, next_schedule_minutes);
    // add one day if overnight
    if (next_schedule < now) {
      next_schedule.setDate(next_schedule.getDate() + 1);
    }
    let diff = next_schedule - now;

    // return time until next change in schedule + 1 minute
    return Math.floor(diff / 1000 / 60) + 1;
  }

  schedule(from, to) {

    let url = 'https://transport.opendata.ch' + '/v1/connections?' + 'from=' + from + '&to=' +
      to + '&datetime=' + '&transportations=train&limit=1';

    // get schedule
    let req = https.get(url, res => {
      res.setEncoding('utf8');
      let response = '';
      res.on('data', data => {
        response += data;
      });
      res.on('end', () => {
        response = JSON.parse(response);

        // handle response
        // reset if nothing found
        if (response.hasOwnProperty("errors")) {
          addrs.forEach(e => this.move(e, 0));
          return;
        } else if (response.connections.length == 0) {
          addrs.forEach(e => this.move(e, 0));
          vorpal.log(colors.red("No connection found"));
          return;
        };
        let connections = response.connections[0];
        let schedule = {};

        let departure = new Date(connections.from.departure);
        schedule.hour = departure.getHours();
        schedule.minute = departure.getMinutes();
        schedule.delay = connections.from.delay;
        schedule.train = connections.products[0].replace(/\s[0-9]*/g, '');;
        schedule.vias = [];
        if (connections.sections[0].journey != null) {
          connections.sections[0].journey.passList.forEach(e => schedule.vias.push(e.station.name))
        };
        schedule.destination = connections.to.station.name;
        
        console.log(schedule);
        let found = [];
        // display time
        found.push(this.find(0, schedule.hour));
        if (schedule.minute == 0) {
          found.push(this.move(addr_minute, 30));
        } else {
          found.push(this.find(addr_minute, schedule.minute));
        }
        // display delay
        // display delay in minute
        if (typeof(schedule.delay) == 'number') {
          schedule.delay = 'ca ' + schedule.delay + [(schedule.delay > 1) ? ' Minuten' : ' Minute'] + ' später';
          found.push(this.find(addr_delay, schedule.delay));
        // display cancellation
        } else if (false) {
          // todo
          found.push(this.find(2, 'Ausfall'));
        // display unknown delay
        } else if (false) {
          // todo
          found.push(this.find(2, 'Ausfall'));
        }else {
          this.move(addr_delay, 0);
          found.push(true);
        }
        // display train type (or connections.sections[0].journey.category)
        if (schedule.train.slice(0,2) == 'SN') {
          schedule.train = 'SN MIT ZUSCHLAG';
        } else if (schedule.train[0] == 'S') {
          let sbahns = ['S11', 'S12', 'S29'];
          if (sbahns.findIndex(e => e == schedule.train) >= 0) {
            schedule.train += ' S-Bahn';
          } else {
            schedule.train = 'S S-Bahn schwarz';
          }
        } else if (schedule.train.slice(0,2) == 'RE') {
          schedule.train += ' RegioExpress';
        } else if (schedule.train.slice(0,1) == 'R') {
          schedule.train += ' Regio';
        } else if (connections.sections[0].journey != null && connections.sections[0].journey.category == 'B') {
          schedule.train == 'Autobus ab';
        }
        // display change of platforms
        if (connections.from.platform != null && connections.from.platform.indexOf('!') >= 0) {
          schedule.train = 'Gleisänderung';
        }
        found.push(this.find(addr_train, schedule.train));
        // display via
        this.loadMessagesMapping(addr_via);
        schedule.via = this.messages.filter(e => schedule.vias.includes(e));
        found.push(this.find(addr_via, schedule.via[0]));
        // display destination
        found.push(this.find(addr_destination, schedule.destination));
        // set all modules to 0 where nothing found
        for (let i = 0; i <= found.length; i++) {
          if (found[i] == false) {
            this.move(addrs[i], 0)
          };
        };

      });
    });
    req.on('error', (err) => {
      vorpal.log(colors.red('schedule request connection error ' + err));
    });
    req.end();
    return ;
  }

};
