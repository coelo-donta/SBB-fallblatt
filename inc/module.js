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
    this.loadMessagesMapping();
  }

  loadMessagesMapping() {
    this.messages = require('../config/modules-mapping/' + this.address + '.json');

    this.bladeCount = this.messages.length;
  }

  switchMode(mode) {
    this.mode = mode;

    global.server.io.emit('mode', {mode: this.mode});
  }

  message() {
    return this.messages[this.position];
  }

  list() {
    return this.messages;
  }

  find(target) {
    var found = false;
    var messageIndex = 0;

    this.random('stop');

    this.messages.forEach(function(message, index) {
      if (message.toLowerCase().search(target.toLowerCase()) > -1 && !found) {
        messageIndex = index;
        found = true;
      }
    });

    if (found) this.move(messageIndex);

    return found;
  }

  move(position) {
    this.random('stop');
    super.move(position);
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
};
