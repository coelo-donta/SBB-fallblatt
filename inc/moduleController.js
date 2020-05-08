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

    let data = new Buffer([0xFF, 0xC5, this.address]);
    UARTController.send(data);

    global.server.io.emit('position', {position: 0});
  }

  step() {
    this.position++;

    if (this.position >= this.bladeCount) this.position = 0;

    let data = new Buffer([0xFF, 0xC6, this.address]);
    UARTController.send(data);
    // address 100 = send to all
    global.server.io.emit('position', {address: 100});
  }

  move(address, index) {
    if (index > this.bladeCount) return;

    this.position = index;

    let data = new Buffer([0xFF, 0xC0, address, index]);
    UARTController.send(data);

    global.server.io.emit('position', {address: address, position: this.position});
  }
};
