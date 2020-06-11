import {autocomplete} from './autocompleter.js';
$(function () {
  var socket = io.connect();
  socket.on('connect', function(data) {
    socket.emit('update');
  });

  socket.on('position', function(data) {
    if (typeof data.address == 'undefined') {
      // if no module is specified, e.g reset
      for (let address of [0,1,2,3,4,5]) {
        let id = '#module' + address;
        $(id).val(data.position);
        cellStyle(id);
      }
    } else if (data.address == 100) {
      // if all modules are targetted, e.g. step
      for (let address of [0,1,2,3,4,5]) {
        // create module id
        let id = '#module' + address;
        // get current position
        let current = parseInt($(id).val());
        // set number of blades
        let blades = (address == 0 | address == 2) ? 40 : 62;
        $(id).val((current+1)%blades);
        cellStyle(id);
      }
    } else {
      // if one module is targeted, eg. static
      var id = '#module' + data.address;
      $(id).val(data.position);
      cellStyle(id);
    }

    function cellStyle(id) {
      // styling of cells
      let train = $(id);
      if (id == "#module3") {
        let train_style1 = ["EC","EN","IC","ICE","IR","CIS","ICN","Messe-Extrazug","Dampfextrazug","Militär-Extrazug ","Extrazug","Ersatzzug","Entlastungszug","Eilzug"];
        let train_style2 = ["Ausfall","Zug fällt aus","Autobus ab","Bahnersatz - Bus","Streckenunterbruch","Bitte nicht einsteigen","Gleis ausser Betrieb","Betriebsstörung","Gleisänderung"];
        let train_style3 = ["R Regio", "S S-Bahn schwarz","S12 S-Bahn","S29 S-Bahn","S12 KURZZUG SEKTOR B","S12 SEKTOR A B","S12 SEKTOR B C","S11 S-Bahn","S11 KURZZUG SEKTOR B","S11 SEKTOR A B","S11 SEKTOR B C"];
        let train_style4 = ["SN MIT ZUSCHLAG", "SN"];
        let train_style5 = ["RE RegioExpress", "S S-Bahn rot"];
        if (train_style1.includes(train[0][$(id).val()].textContent)) {
          document.getElementById(id.slice(1)).style.color = "#fff";
          document.getElementById(id.slice(1)).style.background = "#eb0000";
        } else if (train_style2.includes(train[0][$(id).val()].textContent)) {
          document.getElementById(id.slice(1)).style.color = "#fce319";
          document.getElementById(id.slice(1)).style.background = "#2d327d";
        } else if (train_style3.includes(train[0][$(id).val()].textContent)) {
          document.getElementById(id.slice(1)).style.color = "#2d327d";
          document.getElementById(id.slice(1)).style.background = "#fff";
        } else if (train_style4.includes(train[0][$(id).val()].textContent)) {
          document.getElementById(id.slice(1)).style.color = "#fce319";
          document.getElementById(id.slice(1)).style.background = "#000";
        } else if (train_style5.includes(train[0][$(id).val()].textContent)) {
          document.getElementById(id.slice(1)).style.color = "#eb0000";
          document.getElementById(id.slice(1)).style.background = "#fff";
        } else {
          document.getElementById(id.slice(1)).style.color = "#fff";
          document.getElementById(id.slice(1)).style.background = "#2d327d";
        }
      }
      if (id == "#module4") {
        let via_style1 = ["Bitte nicht","UNBESTIMMTE VERSPÄTUNG","LAUTSPRECHER-DURCHSAGEN BEACHTEN","RESERVATION OBLIGATORISCH","MIT HALT AUF ALLEN STATIONEN","ABFAHRT AUF DEM BAHNHOFPLATZ","Ohne Halt bis","VERKEHRT NICHT VIA ZÜRICH HB"];
        if (via_style1.includes(train[0][$(id).val()].textContent)) {
          document.getElementById(id.slice(1)).style.color = "#fce319";
        } else {
          document.getElementById(id.slice(1)).style.color = "#fff";
        }
      }
      if (id == "#module5") {
        let destination_style1 = ["einsteigen"];
        if (destination_style1.includes(train[0][$(id).val()].textContent)) {
          document.getElementById(id.slice(1)).style.color = "#fce319";
        } else {
          document.getElementById(id.slice(1)).style.color = "#fff";
        }
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

  socket.on('status', function(data) {
    if ($('body').hasClass('index')) {
      $('#mode').val(data.mode);
      $('#module').val(data.position);

      $('#scheduleForm').hide()

      if (data.mode == 'schedule') {
        $('#scheduleForm').show();
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
    var input = $('<select class="module" id="module' + data.address + '"></select>');
    $.each(data.data, function (index, message) {
      var select = $('<option value="' + index + '">' + ((message.length == 0) ? '–' : message) + '</option>');
      input.append(select);
    });

    $('#modules').append(input);
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

      if (mode == 'time') {
        targetFields = $('');
        socket.emit('time', {action: action});
      } else if (mode == 'timetable') {
        targetFields = $('');
        socket.emit('timetable', {action: action});
      } else if (mode == 'schedule') {
        targetFields = $('#scheduleForm');
      } else if (mode == 'reset') {
        targetFields = $('');
        socket.emit('reset', {});
      } else {
        socket.emit('turn', {action: 'stop'});
        socket.emit('random', {action: 'stop'});
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

    // autocomplete for schedule
    $('body').on('keydown', function () {
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

    $('body').on('change', '#module0, #module1, #module2, #module3, #module4, #module5', function () {
      let address = this.id;
      socket.emit('move', {address: address.slice(6), destination: $(this).val()});
    });
  } else {
    socket.emit('status');
  }
});
