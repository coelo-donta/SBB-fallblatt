const colors = require('colors');
const Module = require('./module');
const vorpal = require('vorpal')();
const path = require('path');
const ModuleElement = require('./module');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(path.resolve(__dirname, '../config/modules.db'));

module.exports = class Actions {

  constructor() { }

  static init() {
    this.isReady = false;

    let isReadyPromise = new Promise((resolve, reject) => {

      let sql = 'SELECT * FROM modules WHERE is_used = 1';
      let addrs = [];
      let modules = [];
      this.moduleInstance = new Module([],"");

      // query available modules from db
      let queryDB = (sql) => {
        return new Promise(function (resolve, reject) {
          db.all(sql, function (err, rows) {
            if (err) {
              vorpal.log(colors.cyan(reject(err)));
            } else {
              resolve(rows);
            }
          });
        });
      }

      // create new module class for available modules
      let createModules = (modules, config) => {
        return new Promise(function (resolve, reject) {
          config.forEach((row) => {
            modules.push(new Module(row));
            addrs.push(row.address);
          });
          resolve(modules);
        });
      }

      // query messages from db
      let queryMessages = (address) => {
        return new Promise(function (resolve, reject) {
          let sql_msg = 'SELECT text FROM moduleData WHERE ModuleAddress = ' + address;
          let messages = [];
          queryDB(sql_msg).then((rows) => {
            rows.forEach((row) => messages.push(row.text));
            resolve(messages);
          });
        });
      }

      // query and messages to module class and connect
      let addMessages = (modules, addrs) => {
        const promises = [];
        this.moduleInstance.module = modules;

        for (let i = 0; i < addrs.length; i++) {
          promises.push(queryMessages(addrs[i]))
        }

        Promise.all(promises).then((result) => {
          for (let i = 0; i < addrs.length; i++) {
            this.moduleInstance.module[i].module.messages = result[i];
            this.moduleInstance.module[i].module.position = 0;
          }

          this.moduleInstance.switchMode('static');
          Module.connectionPromise.then(() => {
          this.initMessage();

          clearInterval(this.initMessageInterval);
          this.moduleInstance.reset();
          this.isReady = true;
          global.server.io.emit('status', Actions.status(global.server.isConnected));
          vorpal.ui.redraw(colors.green('system is ready'));
          resolve();
          });
        }
        )
      }

      queryDB(sql)
        .then((rows) => createModules(modules, rows))
        .then((modules) => addMessages(modules, addrs))
        .catch((err) => vorpal.log(colors.red(err)))
      });

    return isReadyPromise;
  }

  static initMessage() {
    let steps = 10;

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
      vorpal.log(colors.magenta('address\t\t') + this.moduleInstance.module.map(e => e.module.address));
      vorpal.log(colors.magenta('type\t\t') + this.moduleInstance.module.map(e => e.module.type));
      vorpal.log(colors.magenta('mode\t\t') + this.moduleInstance.mode);
      vorpal.log(colors.magenta('position\t') + this.moduleInstance.module.map(e => e.module.position));
    } else {
      let status = {
        isReady: this.isReady,
        serial: Module.status(),
        network: server.isConnected,
        ipAddress: server.ipAddress,
        type: this.moduleInstance.module.map(e => e.module.type),
        mode: this.moduleInstance.mode,
        position: this.moduleInstance.module.map(e => e.module.position),
        address: this.moduleInstance.module.map(e => e.module.address),
      };

      return status;
    }
  }

  static addressToIndex(address) {
    let index = this.moduleInstance.module.map(e => e.module.address).indexOf(address)
    if (index < 0) {
      vorpal.log(colors.red('module ' + address + ' not found'));
    }
    return index;
  }

  static light(status) {
    if (!this.isReady) return;

    this.moduleInstance.light(status);
    vorpal.log(colors.magenta('turned the light to ' + status));
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

  static position(address, echo = true) {
    if (!this.isReady) return;

    if (typeof address == 'undefined') {
      let positions = this.moduleInstance.module.map(e => e.module.position);
      if (echo) {
        vorpal.log(colors.magenta('module positions are: ' + positions));
      }
      return positions;
    } else {
      let index = this.moduleInstance.module.map(e => e.module.address).indexOf(address);
      if (index < 0) {
        vorpal.log(colors.red('module ' + address + ' not found'));
      }
      let positions = this.moduleInstance.module[index].module.position;
      if (echo) {
        vorpal.log(colors.magenta('position of module ' + address + ' is: ' + positions));
      }
      return positions;
    }
  }

  static message(address, echo = true) {
    if (!this.isReady) return;

    let position = this.position(address, false);
    if (echo) {
      if (typeof address == 'undefined') {
        let messages = [];
        this.moduleInstance.module.forEach((el, ind) => messages.push(el.module.messages[position[ind]]));
        vorpal.log(colors.magenta('module messages are: ' + messages ));
      } else {
        let index = this.moduleInstance.module.map(e => e.module.address).indexOf(address);
        if (index < 0) {
          vorpal.log(colors.red('module ' + address + ' not found'));
        }
        vorpal.log(colors.magenta('message of module ' + address + ' is: ' + this.moduleInstance.module[index].module.messages[position]));
      }
    } else {
      return message;
    }
  }

  static list(address, echo=true) {
    let index = this.addressToIndex(address)
    if (index == -1) { return; }

    let messages = this.moduleInstance.module[index].module.messages;

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

    let index = this.addressToIndex(address)
    if (index == -1) { return; }

    let found = this.moduleInstance.module[index].find(address, string);

    if (found) {
      vorpal.log(colors.magenta('module "' + address + '" moved to "' + string + '"'));
    } else {
      vorpal.log(colors.red('no message containing "' + string + '" found in module "' + address +'"'));
    }

    return found;
  }

  static move(address, position) {
    if (!this.isReady) return;

    let index = this.addressToIndex(address)
    if (index == -1) { return; }
    if (this.moduleInstance.module[index].module.bladeCount <= position) {
      vorpal.log(colors.red('module ' + address + ' has only ' + this.moduleInstance.module[index].module.bladeCount + ' blades'));
      return;
    }

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

  static date() {
    if (!this.isReady) return;

    this.moduleInstance.date();

    vorpal.log(colors.magenta('displaying date'));
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
