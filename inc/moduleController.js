const fs = require('fs');
const UARTController = require('./uartController');

module.exports = class ModuleController extends UARTController {
  constructor(address, bladeCount) {
    super();

    this.position = 0;
    this.address = address;
    this.bladeCount = bladeCount;
  }

  reset() {
    this.position = 0;

    let data = new Buffer.from([0xFF, 0xC5, this.address]);
    UARTController.send(data);

    global.server.io.emit('position', {moduleAddress: -1, bladeId: 0, txtColor: "fff", bgColor: "2d327d"});
  }

  manual(command, address, value) {
    if (typeof value == 'undefined') {
      var data = new Buffer.from([0xFF, command, address]);
    } else {
      var data = new Buffer.from([0xFF, command, address, value]);
    }

    UARTController.send(data);

    UARTController.port.on('open', function() {
      console.log("open");
    });
    UARTController.port.on('data', function(data) {
      console.log(data);
    });
    UARTController.port.on('close', function () {
      console.log('closed');
    });
    //global.server.io.emit('position', {position: 0});
  }

  step() {
    this.position++;

    if (this.position >= this.bladeCount) this.position = 0;

    let data = new Buffer.from([0xFF, 0xC6, this.address]);
    UARTController.send(data);
    // address 100 = send to all
    global.server.io.emit('position', {address: 100});
  }

  move(to) {
    this.position = to.bladeId;

    let data = new Buffer.from([0xFF, 0xC0, to.moduleAddress, to.bladeId]);
    UARTController.send(data);

    global.server.io.emit('position', {data: to});
  }
};
