
# fallblatt-module
A software to controll SBB split flap display via serial port (RS485).

## General
fallblatt-module is a node JS application that allows you to controll SBB split flap display via serial port. It offers a webinterface, and two API (Websocket and REST).

## Hardware
The split flap display need to be connected to the a computer via a RS-485 serial port. Please refert to documentation du see how to proceed with serial and power supply.

### Material list

 - [SparkFun USB to RS-485 Converter](https://www.sparkfun.com/products/9822)
 - Any computer (Raspberry PI 3 is a good option)
 - 30VDC power supply

## Installation
To install the software run npm install in command line.

    npm install

Then you have to do some configuration

     mv config/config-sample.json config/config.json

In config.json

 - set your serial port path
 - set the module address (generaly written on the module itself
 - set a type for the module (any name)

Then you will have to map the messages. In config/module-mapping create a json file named after the module address (i.e 53.json) . Just enter all the messages you have on your split flap display.

## Usage
You can run the software in command line via

    node server.js

### Command line
You can control the module via command line by taping any command in command list.

### Webinterface
You can access a web app via your browser. The adresse is http://&lt;ipAddress&gt;:3000/.

### Websocket
A socket.io API is available at http://&lt;ipAddress&gt;:3000/. Use any command in command list.

### REST API
You can control the module via a REST API available at http://&lt;ipAddress&gt;:3000/&lt;command&gt;/. Any command that change module status is a POST request. All parameter are passed directly in the URL, i.e:

    http://<ipAddress>/random/start/10/5

### Mobile App
An ionic app is available to controll multiple module on the same network. Please see [fallblatt-mobile](https://github.com/harkle/fallblatt-mobile) for more information.

### Command list

 - **status**: return the status of the software
 - **message**: return the current message
 - **list**: return a list of all available messages
 - **position**: return the current position
 - **reset**: move the module to initial position
 - **move &lt;destination&gt;**: move the module to a specific position
 - **step**: move the module one step forward
 - **find &lt;message&gt;**: move to string (can be partial)
 - **random &lt;action&gt; [duration] [variation]**: set random mode (action start|stop duration/variation in seconds)
 - **turn &lt;action&gt; [duration] [variation]**: set turn mode (action start|stop duration/variation in seconds)

## Documentation
The documentation has been written by # [eni23](https://github.com/eni23)/**[sbb-fallblatt](https://github.com/eni23/sbb-fallblatt)** (Thank you very much to him to create a comprenhensive documentation for the communication protocol). Please be aware this documentation is under GPL licence (and not MIT as the rest of this repo).

-  [Electrical details](https://github.com/harkle/fallblatt-module/blob/master/doc/electrical_new_module.md)
-  [Communication protocol](https://github.com/harkle/fallblatt-module/blob/master/doc/protocol_new_modules.md)
-  [Char<->Blade mapping](https://github.com/harkle/fallblatt-module/blob/master/doc/char_mapping.md)
