const vorpal = require('vorpal')();
const colors = require('colors');
const fs = require('fs');
const SerialPort = require('serialport');

module.exports = class UARTController {
  constructor(serial_address) {
    UARTController.connect(serial_address);
  }

  static status() {
    return this.isConnected;
  }

  static connect(serial_address) {
    if (this.isConnecting) return;
    this.commandList = [];
    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      // get serial of first module element (all modules have the same)
      this.port = new SerialPort(serial_address, {
        baudRate: 19200
      }, (err) => {
        if (err) {
          this.isConnected = false;
          vorpal.log(colors.red(err.message));
        } else {
          this.isConnected = true;
          vorpal.log(colors.green('serial is connected'));
        }

        resolve();
      });

      setInterval(() => {
        if (this.commandList.length > 0 && this.isConnected) {
          let command = this.commandList.shift();

          UARTController.break().then(() => {
            UARTController.port.write(command, function (err) { });
          });
        }
      }, 250)
    });
  }

  static break() {
    return new Promise((resolve, reject) => {
      UARTController.port.set({brk: true}, () => {
        setTimeout(() => {
          UARTController.port.set({brk: false}, () => {
            resolve();
          });
        }, 50);
      });
    });
  }

  static send(data) {
    this.commandList.push(data);
  }
};
