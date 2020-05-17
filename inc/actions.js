const colors = require('colors');
const Module = require('./module');
const vorpal = require('vorpal')();

module.exports = class Actions {

  constructor() { }

  static init() {
    this.isReady = false;

    let config = require('../config/config.json');
    //let isReadyPromise = [];
    //for (var i = 0; i <= config.modules.length; i++) {
    //let isReadyPromiseTemp = new Promise((resolve, reject) => {
    //  this.moduleInstance = new Module(config.modules[i].module, config.modules[i].type);
    let isReadyPromise = new Promise((resolve, reject) => {
      this.moduleInstance = new Module(config.modules[0].module, config.modules[0].type);

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
    //isReadyPromise.push(isReadyPromiseTemp);
    //}
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
      };

      return status;
    }
  }

  static reset() {
    if (!this.isReady) return;

    this.moduleInstance.reset();
    vorpal.log(colors.magenta('reset modules to position 0'));
  }

  static manual(command, address, value) {
    if (!this.isReady) return;

    this.moduleInstance.manual(command, address, value);
    vorpal.log(colors.magenta('execute command ' + command + ' ' + address + ' ' + value));
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

  static list(address, echo=true) {
    let messages = this.moduleInstance.list(address);

    if (echo) {
      messages.forEach(function(message, index) {
        if (message) vorpal.log(colors.magenta(index + "\t\t" + message));
      });
    } else {
      return messages;
    }
  }

  static find(address, string) {
    if (!this.isReady) return;

    let found = this.moduleInstance.find(address, string);

    if (found) {
      vorpal.log(colors.magenta('module "' + address + '" moved to "' + string + '"'));
    } else {
      vorpal.log(colors.red('no message containing "' + string + '" found in module "' + address +'"'));
    }

    return found;
  }

  static move(address, position) {
    if (!this.isReady) return;

    this.moduleInstance.move(address, position);

    vorpal.log(colors.magenta('module "' + address +'" moved to "' + position + '"'));
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

  static turn(action, duration = 5, variation = 0) {
    if (!this.isReady) return;

    this.moduleInstance.turn(action, duration * 1000, variation * 1000);

    vorpal.log(colors.magenta('turn mode set to "' + action + '"'));
  }

  static time(action) {
    if (!this.isReady) return;

    this.moduleInstance.time(action);

    vorpal.log(colors.magenta(action + ' displaying time'));
  }

  static timetable(action) {
    if (!this.isReady) return;

    this.moduleInstance.timetable(action);

    vorpal.log(colors.magenta(action + ' displaying timetable'));
  }

  static schedule(from, to) {
    if (!this.isReady) return;

    this.moduleInstance.schedule(from, to);

    vorpal.log(colors.magenta('displaying live schedule'));
  }

}
