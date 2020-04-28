const colors = require('colors');
const Module = require('./module');
const vorpal = require('vorpal')();

module.exports = class Actions {

  constructor() { }

  static init() {
    this.isReady = false;

    let config = require('../config/config.json');

    let isReadyPromise = new Promise((resolve, reject) => {
      this.moduleInstance = new Module(config.module, config.type);

      Module.connectionPromise.then(() => {
        this.initMessage();

        setTimeout(() => {

          let stepCount = 0;
          let stepInterval = setInterval(() => {
            this.moduleInstance.step();
            stepCount++

            if (stepCount == this.moduleInstance.messages.length) {
              clearTimeout(stepInterval);

              setTimeout(() => {
                clearInterval(this.initMessageInterval);

                this.moduleInstance.reset();
                this.isReady = true;

                global.server.io.emit('status', Actions.status(global.server.isConnected));

                vorpal.ui.redraw(colors.green('system is ready'));

                resolve();
              }, 1000);
            }
          }, 260);
        }, 1000);
      });
    });

    return isReadyPromise;
  }

  static initMessage() {
    let steps = Math.floor((this.moduleInstance.messages.length * 250 + 1000) / 1000);

    this.initStep = 0;
    this.initMessageInterval = setInterval(() => {
      vorpal.ui.redraw(colors.yellow('module initialisation\t' + (steps - this.initStep)));

      this.initStep++;
    }, 1000);
  }

  static status(serverStatus, echo = false) {
    if (!this.moduleInstance) return;

    if (echo) {
      vorpal.log(colors.magenta('status\t\t') + ((this.isReady) ? colors.green('ready') : colors.red('not ready')));
      vorpal.log(colors.magenta('serial\t\t') + ((Module.status()) ? colors.green('connected') : colors.red('not connected')));
      vorpal.log(colors.magenta('network\t\t') + ((server.isConnected) ? colors.green('connected') : colors.red('not connected')));
      vorpal.log(colors.magenta('address\t\t') + this.moduleInstance.address);
      vorpal.log(colors.magenta('type\t\t') + this.moduleInstance.type);
      vorpal.log(colors.magenta('mode\t\t') + this.moduleInstance.mode);
      vorpal.log(colors.magenta('duration\t') + ((this.moduleInstance.mode == 'turn') ? this.moduleInstance.turnDuration : this.moduleInstance.randomDuration) / 1000);
      vorpal.log(colors.magenta('variation\t') + ((this.moduleInstance.mode == 'turn') ? this.moduleInstance.turnVariation : this.moduleInstance.randomVariation) / 1000);
      vorpal.log(colors.magenta('position\t') + this.moduleInstance.position);
    } else {
      let status = {
        isReady: this.isReady,
        serial: Module.status(),
        network: server.isConnected,
        ipAddress: server.ipAddress,
        type: this.moduleInstance.type,
        mode: this.moduleInstance.mode,
        position: this.moduleInstance.position,
        address: this.moduleInstance.address,
        turnDuration: this.moduleInstance.turnDuration / 1000,
        turnVariation: this.moduleInstance.turnVariation / 1000,
        randomDuration: this.moduleInstance.randomDuration / 1000,
        randomVariation: this.moduleInstance.randomVariation / 1000
      };

      return status;
    }
  }

  static reset() {
    if (!this.isReady) return;

    this.moduleInstance.reset();
    vorpal.log(colors.magenta('module set to position 0'));
  }

  static position() {
    if (!this.isReady) return;

    vorpal.log(colors.magenta('module position is: ' + this.moduleInstance.position));

    return this.moduleInstance.position;
  }

  static message(echo = true) {
    if (!this.isReady) return;

    let message = this.moduleInstance.message();

    if (echo) {
      vorpal.log(colors.magenta('current message is: "' + message +'"'));
    } else {
      return message;
    }
  }

  static list(echo = true) {
    let messages = this.moduleInstance.list();

    if (echo) {
      messages.forEach(function(message, index) {
        if (message) vorpal.log(colors.magenta(index + "\t\t" + message));
      });
    } else {
      return messages;
    }
  }

  static find(string) {
    if (!this.isReady) return;

    let found = this.moduleInstance.find(string);

    if (found) {
      vorpal.log(colors.magenta('module moved to "' + string + '"'));
    } else {
      vorpal.log(colors.red('no message containing "' + string + '" found'));
    }

    return found;
  }

  static move(position) {
    if (!this.isReady) return;

    this.moduleInstance.move(position);

    vorpal.log(colors.magenta('module moved to "' + position + '"'));
  }

  static step() {
    if (!this.isReady) return;

    this.moduleInstance.step();

    vorpal.log(colors.magenta('module moved 1 step ahead'));
  }

  static random(action, duration = 10, variation = 0) {
    if (!this.isReady) return;

    this.moduleInstance.random(action, duration * 1000, variation * 1000);

    vorpal.log(colors.magenta('random mode set to "' + action + '"'));
  }

  static turn(action, duration = 10, variation = 0) {
    if (!this.isReady) return;

    this.moduleInstance.turn(action, duration * 1000, variation * 1000);

    vorpal.log(colors.magenta('turn mode set to "' + action + '"'));
  }
}
