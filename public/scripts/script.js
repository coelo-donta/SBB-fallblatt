import {autocomplete} from './autocompleter.js';

let addrs = ["hour", "minute", "delay", "train", "via", "destination"];

$(function () {
  var socket = io.connect();
  socket.on('connect', function(data) {
    socket.emit('update');
  });

  socket.on('position', function(data) {
    if (data.moduleAddress == -1) {
      // if no module is specified, e.g reset
      for (let address of addrs) {
        let id = "#module_" + address;
        $(id).val(data.bladeId);
        document.getElementById(id.slice(1)).style.color = '#' + data.txtColor;
        document.getElementById(id.slice(1)).style.background = '#' + data.bgColor;
      }
    } else {
      // if one module is targeted, eg. static
      if (addrs.indexOf(data.data.type) != -1) {
        let id = "#module_" + data.data.type;
        $(id).val(data.data.bladeId);
        document.getElementById(id.slice(1)).style.color = '#' + data.data.txtColor;
        document.getElementById(id.slice(1)).style.background = '#' + data.data.bgColor;
      }
    }

  });

  socket.on('mode', function(data) {
    $('#mode').val(data.mode);
  });

  socket.on('light', function(data) {
    if (data.status == "on") {
      $('#lightswitch')[0].innerText = "\uD83C\uDF1E";
      $('#lightswitch').val(1);
    } else {
      $('#lightswitch')[0].innerText = "\uD83C\uDF1A";
      $('#lightswitch').val(0);
    }
  });

  socket.on('weather-city', function(data) {
    console.log(data);
    $('#weatherLocation').val(data.city);
  });

  socket.on('status', function(data) {
    if ($('body').hasClass('index')) {
      $('#mode').val(data.mode);
      //$('#module').val(data.position);

      $('#scheduleForm').hide()
      $('#weatherForm').hide()

      if (data.mode == 'schedule') {
        $('#scheduleForm').show();
      } else if (data.mode == 'weather') {
        $('#weatherForm').show();
      }

    } else if ($('body').hasClass('information')) {
      $('#info-status, #info-serial, #info-network').removeClass('text-success, text-danger');

      $('#info-status').text((data.isReady) ? 'ready' : 'not ready').addClass((data.isReady) ? 'text-success' : 'text-danger');
      $('#info-serial').text((data.serial) ? 'connected' : 'not connected').addClass((data.serial) ? 'text-success' : 'text-danger');
      $('#info-network').text((data.network) ? 'connected (' + data.ipAddress + ')'  : 'not connected').addClass((data.network) ? 'text-success' : 'text-danger');

      $('#info-type').text(data.type);
      $('#info-mode').text(data.mode);
      $('#info-position').text(data.position);
    }

    $('.info-address').text(data.address);
  });

  socket.on('list', function(data) {
    var input = $('<select class="module" id="module_' + data.type + '"></select>');
    $.each(data.data, function (index, message) {
      var select = $('<option value="' + index + '">' + ((message.length == 0) ? '–' : message) + '</option>');
      input.append(select);
    });

    $('#modules').append(input);
  });

  socket.on('load_positions', function(data) {
    for (let i = 0; i < data.type.length; i++) {
      if (addrs.indexOf(data.type[i]) != -1) {
        socket.emit('move', {address: data.type[i], destination: data.position[i], echo: false});
      }
    }
  });

  if ($('body').hasClass('index')) {
    socket.emit('status');
    $('#modules').append('<div class="track-number"><span class="track-title">Gleis</span>1</div>');
    socket.emit('list');

    $('body').on('load', '#lightswitch', function () {
      socket.emit('light', {status: "off"});
    });
    $('body').on('click', '#lightswitch', function () {
      let switcher = document.getElementById("lightswitch");
      if (switcher.value == 0) {
        socket.emit('light', {status: "on"});
        switcher.value = 1;
      } else {
        socket.emit('light', {status: "off"});
        switcher.value = 0;
      }
    });

    $('body').on('change', '#mode', function () {
      var mode = $('#mode').val();
      var action = (mode == 'static') ? 'stop' : 'start';
      var targetFields;

      $('#scheduleForm').hide()
      $('#weatherForm').hide()

      if (mode == 'time') {
        targetFields = $('');
        socket.emit('time', {action: action});
      } else if (mode == 'timetable') {
        targetFields = $('');
        socket.emit('timetable', {action: action});
      } else if (mode == 'schedule') {
        targetFields = $('#scheduleForm');
      } else if (mode == 'weather') {
        targetFields = $('#weatherForm');
      } else if (mode == 'reset') {
        targetFields = $('');
        socket.emit('reset', {});
      } else {
        socket.emit('time', {action: 'stop'});
        socket.emit('timetable', {action: 'stop'});
      }

      if (action == 'start') {
        targetFields.show();
      }
    });

    $('body').on('click', '#scheduleButton', function () {
      socket.emit('schedule', {from: $('#inputFrom').val(), to: $('#inputTo').val()});
    });

    $('body').on('click', '#oppositeButton', function () {
      let fromField = document.getElementById("inputFrom");
      let toField = document.getElementById("inputTo");
      let temp = fromField.value;
      fromField.value = toField.value;
      toField.value = temp;
    });

    $('body').on('click', '#weatherButton', function () {
      socket.emit('weather', {location: $('#weatherLocation').val()});
    });

    // autocomplete for schedule
    $('body').on('keydown', '#inputFrom, #inputTo', function () {
      var field = document.activeElement.value;
      let url = 'https://transport.opendata.ch' + '/v1/locations?query=' + field + '&type=station';
      httpGetAsync (url, autocompleter)
    });

    function autocompleter(response) {
      let stations = [];
      response.stations.forEach(e => stations.push(e.name));
      autocomplete(document.activeElement, stations);
    }

    function httpGetAsync(url, callback) {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() {
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
              callback(JSON.parse(xmlHttp.responseText));
      }
      xmlHttp.open("GET", url, true);
      xmlHttp.send(null);
    }

    $('body').on('change', '#module_' + addrs.join(', #module_'), function () {
      let address = this.id;
      socket.emit('move', {address: address.slice(7), destination: $(this).val()});
    });
  } else {
    socket.emit('status');
  }
});
