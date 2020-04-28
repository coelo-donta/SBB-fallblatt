$(function () {
  var socket = io.connect();
  socket.on('connect', function(data) {
    socket.emit('update');
  });

  socket.on('position', function(data) {
    $('#module').val(data.position);
  });

  socket.on('mode', function(data) {
    $('#mode').val(data.mode);
  });

  socket.on('status', function(data) {
    if ($('body').hasClass('index')) {
      $('#mode').val(data.mode);
      $('#module').val(data.position);

      $('#turnVariationLine, #turnDurationLine, #randomVariationLine, #randomDurationLine').hide()

      console.log(data);
      if (data.mode == 'turn') {
        $('#turnDurationLine, #turnVariationLine').show();
        $('#turnDuration').val(data.turnDuration);
        $('#turnVariation').val(data.turnVariation);
      }

      if (data.mode == 'random') {
        $('#randomDurationLine, #randomVariationLine').show();
        $('#randomDuration').val(data.randomDuration);
        $('#randomVariation').val(data.randomVariation);
      }
    } else if ($('body').hasClass('information')) {
      $('#info-status, #info-serial, #info-network').removeClass('text-success, text-danger');

      $('#info-status').text((data.isReady) ? 'ready' : 'not ready').addClass((data.isReady) ? 'text-success' : 'text-danger');
      $('#info-serial').text((data.serial) ? 'connected' : 'not connected').addClass((data.serial) ? 'text-success' : 'text-danger');
      $('#info-network').text((data.network) ? 'connected (' + data.ipAddress + ')'  : 'not connected').addClass((data.network) ? 'text-success' : 'text-danger');

      $('#info-type').text(data.type);
      $('#info-mode').text(data.mode);
      $('#info-position').text(data.position);
      $('#info-duration').text((data.mode == 'turn') ? data.turnDuration : data.randomDuration);
      $('#info-variation').text((data.mode == 'turn') ? data.turnVariation : data.randomVariation);
    }

    $('.info-address').text(data.address);
  });

  socket.on('list', function(data) {
    var input = $('<select id="module"></select>');

    $.each(data, function (index, message) {
      var select = $('<option value="' + index + '">' + ((message.length == 0) ? '–' : message) + '</option>');
      input.append(select);
    });

    $('#modules').append(input);
  });

  if ($('body').hasClass('index')) {
    socket.emit('status');
    socket.emit('list');

    $('body').on('change', '#mode, #turnDuration, #turnVariation, #randomDuration, #randomVariation', function () {
      var mode = $('#mode').val();
      var action = (mode == 'static') ? 'stop' : 'start';
      var targetFields;

      $('#turnVariationLine, #turnDurationLine, #randomVariationLine, #randomDurationLine').hide()

      if (mode == 'turn') {
        targetFields = $('#turnVariationLine, #turnDurationLine');
        socket.emit('turn', {action: action, duration: $('#turnDuration').val(), variation: $('#turnVariation').val()});
      } else if (mode == 'random') {
        targetFields = $('#randomVariationLine, #randomDurationLine');
        socket.emit('random', {action: action, duration: $('#randomDuration').val(), variation: $('#randomVariation').val()});
      } else {
        socket.emit('turn', {action: 'stop'});
        socket.emit('random', {action: 'stop'});
      }

      if (action == 'start') {
        targetFields.show();
      }
    });

    $('body').on('change', '#module', function () {
      socket.emit('move', {destination: $(this).val()});
    });
  } else {
    socket.emit('status');
  }
});
