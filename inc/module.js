const colors = require('colors');
const vorpal = require('vorpal')();
const fs = require('fs');
const ModuleController = require('./moduleController');
const path = require('path');
const https = require('https');
const Gpio = require('onoff').Gpio;
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(path.resolve(__dirname, '../config/modules.db'));
let api_secrets = require('../config/api_secrets.json');

// find all types
let types = [];
let addrs = [];
db.all(`SELECT DISTINCT address, type FROM modules WHERE is_used == true`, [], (err, rows) => {
  if (err) { throw err; }
  rows.forEach((row) => {types.push(row.type); addrs.push(row.address);});
});

module.exports = class Module extends ModuleController {
  constructor(config) {
    super(config.serial_address);
    this.module = config;
  }

  switchMode(mode) {
    this.mode = mode;

    if (mode != "timetable") {
      clearTimeout(this.timetableTimeout);
      clearTimeout(this.timetableTimeoutFirst);
    }
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

  find(address, target) {
    var found = false;
    var messageIndex = 0;

    this.module.messages.forEach(function(message, index) {
      if (message == target && !found) {
        messageIndex = index;
        found = true;
      }
    });

    if (found) this.move(address, messageIndex);

    return found;
  }

  step() {

    function sql(address, bladeId) { return `
      SELECT moduleData.moduleAddress, moduleData.bladeId, moduleData.text, modules.type,
      moduleData.textColor, moduleData.backgroundColor, txtColor.hexCode AS txtColor,
      bgColor.hexCode AS bgColor
      FROM moduleData
      LEFT JOIN modules ON moduleData.moduleAddress = modules.address
      LEFT JOIN colors AS txtColor ON moduleData.textColor = txtColor.description
      LEFT JOIN colors AS bgColor ON moduleData.backgroundColor = bgColor.description
      WHERE is_used = 1 AND moduleAddress = ` + address + ' AND bladeId = ' + bladeId;
    }

    this.module.forEach(e => {
      e.module.position++;
      if (e.module.position >= e.module.bladeCount) {
        e.module.position = 0;
      }

      db.get(sql(e.module.address,e.module.position), [], (err, row) => {
        if (err) { throw err; }
        global.server.io.emit('position', {data: row});
      });
    });

    super.step()
  }

  move(address, position) {
    let sql = `
    SELECT moduleData.moduleAddress, moduleData.bladeId, moduleData.text, modules.type,
    moduleData.textColor, moduleData.backgroundColor, txtColor.hexCode AS txtColor,
    bgColor.hexCode AS bgColor
    FROM moduleData
    LEFT JOIN modules ON moduleData.moduleAddress = modules.address
    LEFT JOIN colors AS txtColor ON moduleData.textColor = txtColor.description
    LEFT JOIN colors AS bgColor ON moduleData.backgroundColor = bgColor.description
    WHERE moduleAddress = ` + address + ' AND bladeId = ' + position;

    let index = addrs.indexOf(address)
    db.get(sql, [], (err, row) => {
      if (err) { throw err; }
      row.index = index;
      super.move(row);
    });
  }

  time(action) {
    switch (action) {
      case 'start':
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
    this.module[types.indexOf("clock_hour")].module.position = hour;
    this.module[types.indexOf("clock_minute")].module.position = min_position;
    this.module[types.indexOf("clock_hour")].move(addrs[types.indexOf("clock_hour")], hour);
    this.module[types.indexOf("clock_minute")].move(addrs[types.indexOf("clock_minute")], min_position);
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
    this.module[types.indexOf("clock_hour")].module.position = today.getMonth() + 1;
    this.module[types.indexOf("clock_minute")].module.position = this.minutesToPosition(today.getDate());
    this.module[types.indexOf("clock_hour")].move(addrs[types.indexOf("clock_hour")], today.getMonth() + 1);
    this.module[types.indexOf("clock_minute")].move(addrs[types.indexOf("clock_minute")], this.minutesToPosition(today.getDate()));
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
        this.timetableTimeoutFirst = setTimeout(() => {
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
    this.module[types.indexOf("minute")].move(addrs[types.indexOf("minute")], this.minutesToPosition(parseInt(timetable.timetable[next_index].minute)));
    this.module[types.indexOf("hour")].find(addrs[types.indexOf("hour")], timetable.timetable[next_index].hour);
    this.module[types.indexOf("delay")].find(addrs[types.indexOf("delay")], timetable.timetable[next_index].delay);
    this.module[types.indexOf("train")].find(addrs[types.indexOf("train")], timetable.timetable[next_index].train);
    this.module[types.indexOf("via")].find(addrs[types.indexOf("via")], timetable.timetable[next_index].via);
    this.module[types.indexOf("destination")].find(addrs[types.indexOf("destination")], timetable.timetable[next_index].destination);

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
    this.switchMode('schedule');

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
          addrs.forEach(e => this.module[addrs.indexOf(e)].move(e, 0));
          vorpal.log(colors.red(response.errors[0].message));
          return;
        } else if (response.connections.length == 0) {
          addrs.forEach(e => this.module[addrs.indexOf(e)].move(e, 0));
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
        found.push(this.module[types.indexOf("hour")].find(addrs[types.indexOf("hour")], schedule.hour));
        if (schedule.minute == 0) {
          found.push(this.module[types.indexOf("minute")].move(addrs[types.indexOf("minute")], 30));
        } else {
          found.push(this.module[types.indexOf("minute")].find(addrs[types.indexOf("minute")], schedule.minute));
        }
        // display delay
        // display delay in minute
        if (typeof(schedule.delay) == 'number') {
          schedule.delay = 'ca ' + schedule.delay + [(schedule.delay > 1) ? ' Minuten' : ' Minute'] + ' später';
          found.push(this.module[types.indexOf("delay")].find(addrs[types.indexOf("delay")], schedule.delay));
        // display cancellation
        } else if (false) {
          // todo
          found.push(this.find(2, 'Ausfall'));
        // display unknown delay
        } else if (false) {
          // todo
          found.push(this.find(2, 'Ausfall'));
        }else {
          this.module[types.indexOf("delay")].move(addrs[types.indexOf("delay")], 0);
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
        found.push(this.module[types.indexOf("train")].find(addrs[types.indexOf("train")], schedule.train));
        // display via
        schedule.via = this.module[types.indexOf("via")].module.messages.filter(e => schedule.vias.includes(e));
        found.push(this.module[types.indexOf("via")].find(addrs[types.indexOf("via")], schedule.via[0]));
        // display destination
        found.push(this.module[types.indexOf("destination")].find(addrs[types.indexOf("destination")], schedule.destination));
        // set all modules to 0 where nothing found
        for (let i = 0; i <= found.length; i++) {
          if (found[i] == false) {
            this.module[addrs.indexOf(i)].move(addrs[i], 0)
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

  weather(location) {

    let url = 'https://api.openweathermap.org/data/2.5/weather?q=' + location + '&appid=' +
      api_secrets.api_keys.openweathermap;

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
        if (response.cod != 200) {
          addrs.forEach(e => this.move(e, 0));
          vorpal.log(colors.red(response.message));
          return;
        }

        let weather = {};
        weather.temperature = response.main.temp - 273.15;
        weather.type = response.weather[0].id;

        if (weather.temperature >= 0) {
          this.module[types.indexOf("hour")].find(addrs[types.indexOf("hour")], "+");
        } else {
          this.module[types.indexOf("hour")].find(addrs[types.indexOf("hour")], "-");
        }

        this.module[types.indexOf("minute")].find(addrs[types.indexOf("minute")], Math.round(Math.abs(weather.temperature)));
        this.module[types.indexOf("delay")].find(addrs[types.indexOf("delay")], "&#176")

        let weather_symbol = "";
        if (weather.type < 300) { // thunderstorm
          weather_symbol = "&#127785";
        } else if (weather.type < 505 && weather.type >= 500) { // rain
          weather_symbol = "&#127782";
        } else if (weather.type < 600) { // drizzle & shower
          weather_symbol = "&#127783";
        } else if (weather.type < 700) { // snow
          weather_symbol = "&#10052";
        } else if (weather.type < 800) { // athmosphere
          weather_symbol = "&#127787";
        } else if (weather.type == 800) { // clear
          weather_symbol = "&#9728";
        } else if (weather.type == 801) { // few clouds
          weather_symbol = "&#127780";
        } else if (weather.type == 802) { // scattered clouds
          weather_symbol = "&#127781";
        } else if (weather.type > 802) { // clouds
          weather_symbol = "&#9729";
        }
        this.module[types.indexOf("via")].find(addrs[types.indexOf("via")], weather_symbol);

        // set all modules to 0 where nothing found
        this.module[types.indexOf("train")].move(addrs[types.indexOf("train")], 0);
        this.module[types.indexOf("destination")].move(addrs[types.indexOf("destination")], 0);

        let city = response.name + ", " + response.sys.country;
        vorpal.log(colors.magenta('displaying live weather of ' + city));
        global.server.io.emit('weather-city', {city: city});
      });
    });
    req.on('error', (err) => {
      vorpal.log(colors.red('schedule request connection error ' + err));
    });
    req.end();
    return ;
  }

};
