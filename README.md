# SBB-fallblatt

This project builds up on the great work done by [@harkle](https://github.com/harkle/fallblatt-module) for controlling a single split-flap module and expands it to control an entire display with several modules.


## Background
Some time ago, I took over an old split-flap display from the Swiss federal railways SBB. Based on the available flaps, I concluded that it used to hang on platform 1 of the Seuzach station. The display came as dismounted and includes 12 split-flap modules (six per side) with the entire electronics. Lights, ventilation, temperature sensor, and heating are all intact. Also 15 years worth of dead spiders, flies, bugs, and dirt came with it. The thing weighs about 150kg and measures 208 x 47 x 58 cm.

<img src=doc/img/display.jpg width=100%>

## Hardware

I used the following hardware.

To run from a computer:

- USB to RS485 adapter [https://www.digitec.ch/de/s1/product/oem-yf-usb-zu-rs485-adapter-diverse-elektronikmodul-5999133](https://www.digitec.ch/de/s1/product/oem-yf-usb-zu-rs485-adapter-diverse-elektronikmodul-5999133)

To run independently:

- Raspberry Pi 4 [https://www.digitec.ch/de/s1/product/raspberry-pi-4-4g-model-b-full-starter-kit-armv8-entwicklungsboard-kit-11764848](https://www.digitec.ch/de/s1/product/raspberry-pi-4-4g-model-b-full-starter-kit-armv8-entwicklungsboard-kit-11764848)
- Raspberry Pi 4 ventilated case [https://www.digitec.ch/de/s1/product/joy-it-acryl-gehaeuse-mit-luefter-fuer-raspberry-pi-4-gehaeuse-elektronikzubehoer-gehaeuse-11621552#gallery-open](https://www.digitec.ch/de/s1/product/joy-it-acryl-gehaeuse-mit-luefter-fuer-raspberry-pi-4-gehaeuse-elektronikzubehoer-gehaeuse-11621552#gallery-open)
- Relay (to control the light) [https://www.digitec.ch/de/s1/product/sertronics-relais-modul-stromkomponente-elektronikmodul-8194039](https://www.digitec.ch/de/s1/product/sertronics-relais-modul-stromkomponente-elektronikmodul-8194039)
- Jumper Cables [https://www.digitec.ch/de/s1/product/play-zone-jumperkabel-elektronikkabel-stecker-5997953](https://www.digitec.ch/de/s1/product/play-zone-jumperkabel-elektronikkabel-stecker-5997953)

## Electronics

**⚠️⚠️⚠️ Attention: Playing with high voltage electronics can be dangerous and lead to death. Make sure to exactly understand what you are doing.**

<img src=doc/img/electronics.jpg width=100%>

The data cable coming from the station was cut, otherwise everything remained in there. It took a while figuring out what the individual components do and tracking down every cable. 

#### Serial Port
I connected the serial output of the Raspi (GPIO 14/15 = pins 8/10) to the old data output, from where it is conducted to all modules in series. Each side is served through a separate channel, i.e. every module of one side sees all the signals, but only reacts on the signal that is preceded by its address (see the doc for a detailed explanation on the commands).

Instead of using the serial ports of the Raspi, you can also use a USB-RS485 converter plugged directly to your computer. You might need to unlock your serial device (see Debugging section below).

#### Power Supply
There is a 12 V power supply for the ventilation. The modules get 35 V over a transformer. A 230 V power socket next to the fuses can be used to power the Raspi. 

#### Light
The lights are directly connected to the main 230 V supply. I bridged the supply of the lights over a relay (normally open) that is controlled by the GPIO 17 (pin 11, pins 1 and 9 for power).

#### Ventilation
A heat sensor switch is located on both sides in the center top. If the temperature inside the display gets too high, the four ventilators are turned on. They consume around 135 W.

#### Heating
A resistance heating surrounds the glass on both sides. It consumes around 250 W.

## Software

The software from [@harkle](https://github.com/harkle/fallblatt-module) is a Node JS application that allows to control a split-flap display consisting of several modules via serial port. It offers a webinterface, and two API (Websocket and REST). I extended the existing code to communicate to all modules and added new modes to play with it.

## Installation
The easiest way to deal with node and npm is via nvm.

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

Restart your terminal and run

```
nvm install 10.20.1
npm install
```

This should install node version `10.20.1` and npm version `6.14.4`.

The configuration of the modules is read from the database in `config/modules.db`. Change the configuration of your modules in the database to reflect your setup. There are three tables:
-  `modules` with columns `address, type, bladeCount, moduleWidth, moduleColor, textLanguage, is_used, serial_address`

    e.g. `3|train|62|3|blue|de|1|/dev/ttyUSB0`
- `moduleData` with columns `moduleAddress, bladeId, text, textColor, backgroundColor`

    e.g. `3|4|ICE|white|red`
- `colors` with columns `colorId, description, hexCode, redDec, greenDec, blueDec`

    e.g. `2|blue|2d327d|45|50|125`

> The module address is usually written with pencil on top of the module.
> Set `is_used` to `1` if you want to control it.
> Possible types are `hour`, `minute`, `delay`, `train`, `via`, `destination`, `clock_hour`, `clock_minute`, `alphanumeric`.

Start the application by running

```
node server.js
```

The interface is served on `http://localhost:3000`, accessible from a browser with any device connected to the same network.

## Usage
You can control the display either through the web interface or via command line.

```
Commands:

    help [command...]                       Provides help for a given command.
    exit                                    Exits application.
    status                                  show module status
    light <status>                          turn the light on/off
    reset                                   reset module position
    manual <command> <address> [value]      send manual commands
    message [address]                       get current message
    position [address]                      get module position
    list <address>                          get module messages
    find <address> <string>                 move the module <address> to searched <string>
    step                                    step the module 1 step ahead
    move <address> <position>               move the module <address> to <position>
    turn <action> [duration] [variation]    turn mode duration variation, use with start|stop, time in seconds
    random <action> [duration] [variation]  random mode duration variation, use with start|stop, time in seconds
    time <action>                           display the time
    date                                    display the date
    timetable <action>                      get and display timetable
    schedule <from> <to>                    get live schedule
```

```
Examples:

> light on				% turn on the light
> manual 0xC0 0x03 0x13			% move module 3 to position 19
> list 4				% list texts of module 4
> find 3 ICN				% find and display ICN on module 3
> move 2 20				% move module 2 to position 20
> time start				% start displaying the time
> timetable stop			% stop displaying the timetable
> schedule romanshorn zürich		% show next connection from romanshorn to zurich
```

You can find the documentation how to send commands [here](doc/protocol_new_modules.md).

The `time` and `date` command send to the additional modules that I have ontop of the display.
The command `timetable` displays and updates the predefined timetable from the file `config/timetable.json`. The command `schedule` makes an API request to [https://transport.opendata.ch/](https://transport.opendata.ch/) and displays the time, delay, train types, via stations, and destination using the available flaps.


## Debugging

- Problem when running `node server.js`

Check that you use node and npm versions compatible with the code. Latest version do not work (yet).

- Problems running `npm install`

Try: `npm audit fix` then `npm rebuild`

- Connect serial device with USB adapter

Follow [https://www.fir3net.com/UNIX/Linux/how-do-i-connect-to-a-serial-device-using-a-usb-to-serial-convertor-in-linux.html](https://www.fir3net.com/UNIX/Linux/how-do-i-connect-to-a-serial-device-using-a-usb-to-serial-convertor-in-linux.html)

Summary

```
lsusb
sudo modprobe usbserial vendor=0x<vendor id> product=0x<product id>
dmesg
```

- Serial device is locked

```
sudo su
cd /dev
chown username /dev/ttyUSB0
```
or

```
sudo usermod -a -G dialout your_user_name
followed by a proper logout.
```

- g++ required for module onoff

Run `apt-get install gcc-c++`

- Turn on serial hardware on Raspi

Run `sudo raspi-config`
Choose `5 Interfacing Options` &rarr; P6 Serial &rarr; No (shell) &rarr; Yes (hardware) &rarr; OK, then run `reboot`


## Licence
This work is licensed under the MIT license. Feel free to do whatever you want with it.

The documentation for controlling the modules is the result of hard work and reverse engineering by [@eni23](https://github.com/eni23/) and licensed under GPL-3.0.

The station clock used in the web interface is generated using the tool from Rüdiger Apple [http://www.3quarks.com/de/Bahnhofsuhr/](http://www.3quarks.com/de/Bahnhofsuhr/) and licensed under [CC BY 3.0 DE](https://creativecommons.org/licenses/by/3.0/de/legalcode).

The autocomplete code is taken with courtesy from @kasperite [https://stackoverflow.com/questions/53603611](https://stackoverflow.com/questions/53603611).


<hr>
This project is work in progress and a lot of trial-and-error. Don't hesitate to ask if you have any question, simply drop me a message at wi828ker38sg@opayq.com or open an issue. I hope that I can help.
