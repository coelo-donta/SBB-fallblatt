const colors = require('colors');
const vorpal = require('vorpal')();
const fs = require('fs');
const ModuleController = require('./moduleController');

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
    super.move(address, position);
  }

  random(action, duration = 10000, variation = 0) {
    this.randomDuration = duration
    this.randomVariation = variation;

    switch (action) {
      case 'start':
        clearTimeout(this.randomTimeout);
        clearTimeout(this.turnTimeout);
        clearTimeout(this.timeTimeout);
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
      let index = this.findRandomMessage();
      super.move(index);

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
        clearTimeout(this.timeTimeout);
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
        clearTimeout(this.timetableTimeout);

        this.updateTime();

        // update on second 0
        var seconds = new Date().getSeconds();
        var diff = 60-seconds;
        setTimeout(() => {
          this.displayTime();
        }, diff*1000);

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
    this.timeTimeout = setTimeout(() => {
      this.displayTime();
    }, 60000);
  }

  updateTime() {
    // display current time
    var today = new Date();
    var hour = today.getHours();
    var minutes = today.getMinutes();
    var min_position = this.minutesToPosition(minutes);
    // set position
    super.move(0x00, hour);
    setTimeout(() => { super.move(0x01, min_position); }, 1);
  }

  minutesToPosition(minutes) {
    // convert minute to module position
    var position = (minutes + 31)%62;
    if (minutes < 31) {
        position = position - 1;
    };
    return position;
  }

  timetable(action) {
    switch (action) {
      case 'start':
        clearTimeout(this.timeTimeout);

         // display timetable
        this.displayTimetable();
        // clear first timeout to avoid multiple same timeouts
        clearTimeout(this.timetableTimeout);
        var seconds = new Date().getSeconds();
        var diff = 60-seconds;
        // update on second 0
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
    var today = new Date();
    var hour = today.getHours();
    var minutes = today.getMinutes();

    var timetable = this.loadTimetable();

    // get all hours an minutes of the schedule
    var schedule_minutes  = [];
    var minutes_sorted  = [];
    var schedule_hours = [];
    timetable.timetable.forEach(element => schedule_minutes.push(element.minute));
    timetable.timetable.forEach(element => minutes_sorted.push(element.minute));
    timetable.timetable.forEach(element => schedule_hours.push(element.hour));

    // get next departure minute
    minutes_sorted.sort(function(a, b) { return a - b; });
    var next_schedule = minutes_sorted.find(element => element > minutes);

    // if nothing found restart looking from 0
    if (typeof next_schedule == "undefined") {
      next_schedule = minutes_sorted.find(element => element > -1);
    }

    // get index of entry of next departure
    var next_index = schedule_minutes.indexOf(String(next_schedule));

    // display timetable
    this.find(0, timetable.timetable[next_index].hour);
    this.find(1, timetable.timetable[next_index].minute);
    this.find(2, timetable.timetable[next_index].delay);
    this.find(3, timetable.timetable[next_index].train);
    this.find(4, timetable.timetable[next_index].via);
    this.find(11, timetable.timetable[next_index].destination);

    // return time until next change in schedule + 1 minute
    return (60 + next_schedule - minutes) % 60 + 1;
  }

};
