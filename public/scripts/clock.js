/*!
 * station-clock.js
 *
 * Copyright (c) 2010 Ruediger Appel
 * ludi at mac dot com
 *
 * Date: 2016-02-16
 * Version: 1.0.1
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Known Issues:
 *
 *   Shadows for some second hands is not on one layer
 * 
 * Thanks to Paul Schröfl for the Wiener Würfeluhr
 */

// clock body (Uhrgehäuse)
StationClock.NoBody         = 0;
StationClock.SmallWhiteBody = 1;
StationClock.RoundBody      = 2;
StationClock.RoundGreenBody = 3;
StationClock.SquareBody     = 4;
StationClock.ViennaBody     = 5;

// stroke dial (Zifferblatt)
StationClock.NoDial               = 0;
StationClock.GermanHourStrokeDial = 1;
StationClock.GermanStrokeDial     = 2;
StationClock.AustriaStrokeDial    = 3;
StationClock.SwissStrokeDial      = 4;
StationClock.ViennaStrokeDial     = 5;

//clock hour hand (Stundenzeiger)
StationClock.PointedHourHand = 1;
StationClock.BarHourHand     = 2;
StationClock.SwissHourHand   = 3;
StationClock.ViennaHourHand  = 4;

//clock minute hand (Minutenzeiger)
StationClock.PointedMinuteHand = 1;
StationClock.BarMinuteHand     = 2;
StationClock.SwissMinuteHand   = 3;
StationClock.ViennaMinuteHand  = 4;

//clock second hand (Sekundenzeiger)
StationClock.NoSecondHand            = 0;
StationClock.BarSecondHand           = 1;
StationClock.HoleShapedSecondHand    = 2;
StationClock.NewHoleShapedSecondHand = 3;
StationClock.SwissSecondHand         = 4;

// clock boss (Zeigerabdeckung)
StationClock.NoBoss     = 0;
StationClock.BlackBoss  = 1;
StationClock.RedBoss    = 2;
StationClock.ViennaBoss = 3;

// minute hand behavoir
StationClock.CreepingMinuteHand        = 0;
StationClock.BouncingMinuteHand        = 1;
StationClock.ElasticBouncingMinuteHand = 2;

// second hand behavoir
StationClock.CreepingSecondHand        = 0;
StationClock.BouncingSecondHand        = 1;
StationClock.ElasticBouncingSecondHand = 2;
StationClock.OverhastySecondHand       = 3;


function StationClock(clockId) {
  this.clockId = clockId; 
  this.radius  = 0;

  // hour offset
  this.hourOffset = 0;
  
  // clock body
  this.body              = StationClock.RoundBody;
  this.bodyShadowColor   = "rgba(0,0,0,0.5)";
  this.bodyShadowOffsetX = 0.03;
  this.bodyShadowOffsetY = 0.03;
  this.bodyShadowBlur    = 0.06;
  
  // body dial
  this.dial              = StationClock.GermanStrokeDial;
  this.dialColor         = 'rgb(60,60,60)';
  
  // clock hands
  this.hourHand          = StationClock.PointedHourHand;
  this.minuteHand        = StationClock.PointedMinuteHand;
  this.secondHand        = StationClock.HoleShapedSecondHand;
  this.handShadowColor   = 'rgba(0,0,0,0.3)';
  this.handShadowOffsetX = 0.03;
  this.handShadowOffsetY = 0.03;
  this.handShadowBlur    = 0.04;
	
	// clock colors
	this.hourHandColor     = 'rgb(0,0,0)';
	this.minuteHandColor   = 'rgb(0,0,0)';
	this.secondHandColor   = 'rgb(200,0,0)';
  
  // clock boss
  this.boss              = StationClock.NoBoss;
  this.bossShadowColor   = "rgba(0,0,0,0.2)";
  this.bossShadowOffsetX = 0.02;
  this.bossShadowOffsetY = 0.02;
  this.bossShadowBlur    = 0.03;
  
  // hand behavoir
  this.minuteHandBehavoir = StationClock.CreepingMinuteHand;
  this.secondHandBehavoir = StationClock.OverhastySecondHand;
  
  // hand animation
  this.minuteHandAnimationStep = 0;
  this.secondHandAnimationStep = 0;
  this.lastMinute = 0;
  this.lastSecond = 0;
};

StationClock.prototype.draw = function() {
  var clock = document.getElementById(this.clockId);
  if (clock) {
    var context = clock.getContext('2d');
    if (context) {
      this.radius = 0.75 * (Math.min(clock.width, clock.height) / 2);
      
      // clear canvas and set new origin
      context.clearRect(0, 0, clock.width, clock.height);
      context.save();
      context.translate(clock.width / 2, clock.height / 2);
      
      // draw body
      if (this.body != StationClock.NoStrokeBody) {
        context.save();
        switch (this.body) {
    		  case StationClock.SmallWhiteBody:
    		    this.fillCircle(context, "rgb(255,255,255)", 0, 0, 1);
    		    break;
          case StationClock.RoundBody:
            this.fillCircle(context, "rgb(255,255,255)", 0, 0, 1.1);
            context.save();
            this.setShadow(context, this.bodyShadowColor, this.bodyShadowOffsetX, this.bodyShadowOffsetY, this.bodyShadowBlur);
            this.strokeCircle(context, "rgb(0,0,0)", 0, 0, 1.1, 0.07);
            context.restore();
            break;
          case StationClock.RoundGreenBody:
            this.fillCircle(context, "rgb(235,236,212)", 0, 0, 1.1);
            context.save();
            this.setShadow(context, this.bodyShadowColor, this.bodyShadowOffsetX, this.bodyShadowOffsetY, this.bodyShadowBlur);
            this.strokeCircle(context, "rgb(180,180,180)", 0, 0, 1.1, 0.2);
            context.restore();
            this.strokeCircle(context, "rgb(29,84,31)", 0, 0, 1.15, 0.1);
            context.save();
            this.setShadow(context, "rgba(235,236,212,100)", -0.02, -0.02, 0.09);
            this.strokeCircle(context, 'rgb(76,128,110)', 0, 0, 1.1, 0.08);
            context.restore();
            break;
    		  case StationClock.SquareBody:
            context.save();
            this.setShadow(context, this.bodyShadowColor, this.bodyShadowOffsetX, this.bodyShadowOffsetY, this.bodyShadowBlur);
            this.fillSquare(context, 'rgb(237,235,226)', 0, 0, 2.4);
            this.strokeSquare(context, 'rgb(38,106,186)', 0, 0, 2.32, 0.16);
            context.restore();
      			context.save();
      			this.setShadow(context, this.bodyShadowColor, this.bodyShadowOffsetX, this.bodyShadowOffsetY, this.bodyShadowBlur);
            this.strokeSquare(context, 'rgb(42,119,208)', 0, 0, 2.24, 0.08);
      			context.restore();
      			break;
          case StationClock.ViennaBody:
            context.save();
            this.fillSymmetricPolygon(context, 'rgb(156,156,156)', [[-1.2,1.2],[-1.2,-1.2]],0.1);
            this.fillPolygon(context, 'rgb(156,156,156)', 0,1.2 , 1.2,1.2 , 1.2,0);
            this.fillCircle(context, 'rgb(255,255,255)', 0, 0, 1.05, 0.08);
            this.strokeCircle(context, 'rgb(0,0,0)', 0, 0, 1.05, 0.01);
            this.strokeCircle(context, 'rgb(100,100,100)', 0, 0, 1.1, 0.01);
            this.fillPolygon(context, 'rgb(100,100,100)', 0.45,1.2 , 1.2,1.2 , 1.2,0.45);
            this.fillPolygon(context, 'rgb(170,170,170)', 0.45,-1.2 , 1.2,-1.2 , 1.2,-0.45);
            this.fillPolygon(context, 'rgb(120,120,120)', -0.45,1.2 , -1.2,1.2 , -1.2,0.45);
            this.fillPolygon(context, 'rgb(200,200,200)', -0.45,-1.2 , -1.2,-1.2 , -1.2,-0.45);
            this.strokeSymmetricPolygon(context, 'rgb(156,156,156)', [[-1.2,1.2],[-1.2,-1.2]],0.01);
            this.fillPolygon(context, 'rgb(255,0,0)', 0.05,-0.6 , 0.15,-0.6 , 0.15,-0.45 , 0.05,-0.45);
            this.fillPolygon(context, 'rgb(255,0,0)', -0.05,-0.6 , -0.15,-0.6 , -0.15,-0.45 , -0.05,-0.45);
            this.fillPolygon(context, 'rgb(255,0,0)', 0.05,-0.35 , 0.15,-0.35 , 0.15,-0.30 ,  0.10,-0.20 , 0.05,-0.20);
            this.fillPolygon(context, 'rgb(255,0,0)', -0.05,-0.35 , -0.15,-0.35 , -0.15,-0.30 ,  -0.10,-0.20 , -0.05,-0.20);
            context.restore();
            break;
            }
          context.restore();
      }
      
      // draw dial
      for (var i = 0; i < 60; i++) {
        context.save();
        context.rotate(i * Math.PI / 30);
        switch (this.dial) {
          case StationClock.SwissStrokeDial:
            if ((i % 5) == 0) {
              this.strokeLine(context, this.dialColor, 0.0, -1.0, 0.0, -0.75, 0.07);
            } else {
              this.strokeLine(context, this.dialColor, 0.0, -1.0, 0.0, -0.92, 0.026);
            }
            break;
          case StationClock.AustriaStrokeDial:
            if ((i % 5) == 0) {
              this.fillPolygon(context, this.dialColor, -0.04, -1.0, 0.04, -1.0, 0.03, -0.78, -0.03, -0.78);
            } else {
              this.strokeLine(context, this.dialColor, 0.0, -1.0, 0.0, -0.94, 0.02);
            }
            break;
          case StationClock.GermanStrokeDial:
          	if ((i % 15) == 0) {
              this.strokeLine(context, this.dialColor, 0.0, -1.0, 0.0, -0.70, 0.08);
          	} else if ((i % 5) == 0) {
              this.strokeLine(context, this.dialColor, 0.0, -1.0, 0.0, -0.76, 0.08);
          	} else {
          	  this.strokeLine(context, this.dialColor, 0.0, -1.0, 0.0, -0.92, 0.036);
          	}
          	break;
          case StationClock.GermanHourStrokeDial:
          	if ((i % 15) == 0) {
              this.strokeLine(context, this.dialColor, 0.0, -1.0, 0.0, -0.70, 0.10);
          	} else if ((i % 5) == 0) {
              this.strokeLine(context, this.dialColor, 0.0, -1.0, 0.0, -0.74, 0.08);
          	}
          	break;
         case StationClock.ViennaStrokeDial:
            if ((i % 15) == 0) {
              this.fillPolygon(context, this.dialColor, 0.7,-0.1, 0.6,0, 0.7,0.1,  1,0.03,  1,-0.03);
            } else if ((i % 5) == 0) {
              this.fillPolygon(context, this.dialColor, 0.85,-0.06, 0.78,0, 0.85,0.06,  1,0.03,  1,-0.03);
            }
            this.fillCircle(context, this.dialColor, 0.0, -1.0, 0.03);
            break;
        }
        context.restore();
      }

      // get current time
      var time    = new Date();
      var millis  = time.getMilliseconds() / 1000.0;
      var seconds = time.getSeconds();
      var minutes = time.getMinutes();
      var hours   = time.getHours() + this.hourOffset;

      // draw hour hand
      context.save();
      context.rotate(hours * Math.PI / 6 + minutes * Math.PI / 360);
      this.setShadow(context, this.handShadowColor, this.handShadowOffsetX, this.handShadowOffsetY, this.handShadowBlur);
      switch (this.hourHand) {
        case StationClock.BarHourHand:
          this.fillPolygon(context, this.hourHandColor, -0.05, -0.6, 0.05, -0.6, 0.05, 0.15, -0.05, 0.15);
      	  break;
        case StationClock.PointedHourHand:
          this.fillPolygon(context, this.hourHandColor, 0.0, -0.6,  0.065, -0.53, 0.065, 0.19, -0.065, 0.19, -0.065, -0.53);
          break;
        case StationClock.SwissHourHand:
          this.fillPolygon(context, this.hourHandColor, -0.05, -0.6, 0.05, -0.6, 0.065, 0.26, -0.065, 0.26);
          break;
        case StationClock.ViennaHourHand:
          this.fillSymmetricPolygon(context, this.hourHandColor, [[-0.02,-0.72],[-0.08,-0.56],[-0.15,-0.45],[-0.06,-0.30],[-0.03,0],[-0.1,0.2],[-0.05,0.23],[-0.03,0.2]]);
      }
      context.restore();
      
      // draw minute hand
      context.save();
      switch (this.minuteHandBehavoir) {
        case StationClock.CreepingMinuteHand:
          context.rotate((minutes + seconds / 60) * Math.PI / 30);
  	      break;
        case StationClock.BouncingMinuteHand:
          context.rotate(minutes * Math.PI / 30);
  	      break;
        case StationClock.ElasticBouncingMinuteHand:
          if (this.lastMinute != minutes) {
            this.minuteHandAnimationStep = 3;
            this.lastMinute = minutes;
          }
          context.rotate((minutes + this.getAnimationOffset(this.minuteHandAnimationStep)) * Math.PI / 30);
          this.minuteHandAnimationStep--;
          break;
      }
      this.setShadow(context, this.handShadowColor, this.handShadowOffsetX, this.handShadowOffsetY, this.handShadowBlur);
      switch (this.minuteHand) {
        case StationClock.BarMinuteHand:
          this.fillPolygon(context, this.minuteHandColor, -0.05, -0.9, 0.035, -0.9, 0.035, 0.23, -0.05, 0.23);
      	  break;
        case StationClock.PointedMinuteHand:
          this.fillPolygon(context, this.minuteHandColor, 0.0, -0.93,  0.045, -0.885, 0.045, 0.23, -0.045, 0.23, -0.045, -0.885);
        	break;
        case StationClock.SwissMinuteHand:
        	this.fillPolygon(context, this.minuteHandColor, -0.035, -0.93, 0.035, -0.93, 0.05, 0.25, -0.05, 0.25);
        	break;
        case StationClock.ViennaMinuteHand:
          this.fillSymmetricPolygon(context, this.minuteHandColor, [[-0.02,-0.98],[-0.09,-0.7],[-0.03,0],[-0.05,0.2],[-0.01,0.4]]);
      }
      context.restore();
      
      // draw second hand
      context.save();
      switch (this.secondHandBehavoir) {
        case StationClock.OverhastySecondHand:
          context.rotate(Math.min((seconds + millis) * (60.0 / 58.5), 60.0) * Math.PI / 30);
          break;
        case StationClock.CreepingSecondHand:
          context.rotate((seconds + millis) * Math.PI / 30);
          break;
        case StationClock.BouncingSecondHand:
          context.rotate(seconds * Math.PI / 30);
          break;
        case StationClock.ElasticBouncingSecondHand:
          if (this.lastSecond != seconds) {
            this.secondHandAnimationStep = 3;
            this.lastSecond = seconds;
          }
          context.rotate((seconds + this.getAnimationOffset(this.secondHandAnimationStep)) * Math.PI / 30);
          this.secondHandAnimationStep--;
          break;
      }
      this.setShadow(context, this.handShadowColor, this.handShadowOffsetX, this.handShadowOffsetY, this.handShadowBlur);
      switch (this.secondHand) {
        case StationClock.BarSecondHand:
      	  this.fillPolygon(context, this.secondHandColor, -0.006, -0.92, 0.006, -0.92, 0.028, 0.23, -0.028, 0.23);
      	  break;
        case StationClock.HoleShapedSecondHand:
          this.fillPolygon(context, this.secondHandColor, 0.0, -0.9, 0.011, -0.889, 0.01875, -0.6, -0.01875, -0.6, -0.011, -0.889);
          this.fillPolygon(context, this.secondHandColor, 0.02, -0.4, 0.025, 0.22, -0.025, 0.22, -0.02, -0.4);
          this.strokeCircle(context, this.secondHandColor, 0, -0.5, 0.083, 0.066);
      	  break;
        case StationClock.NewHoleShapedSecondHand:
          this.fillPolygon(context, this.secondHandColor, 0.0, -0.95, 0.015, -0.935, 0.0187, -0.65, -0.0187, -0.65, -0.015, -0.935);
          this.fillPolygon(context, this.secondHandColor, 0.022, -0.45, 0.03, 0.27, -0.03, 0.27, -0.022, -0.45);
          this.strokeCircle(context, this.secondHandColor, 0, -0.55, 0.085, 0.07);
      	  break;
        case StationClock.SwissSecondHand:
      	  this.strokeLine(context, this.secondHandColor, 0.0, -0.6, 0.0, 0.35, 0.026);
      	  this.fillCircle(context, this.secondHandColor, 0, -0.64, 0.1);
          break;
        case StationClock.ViennaSecondHand:
          this.strokeLine(context, this.secondHandColor, 0.0, -0.6, 0.0, 0.35, 0.026);
          this.fillCircle(context, this.secondHandColor, 0, -0.64, 0.1);
          break;
      }
      context.restore();
      
      // draw clock boss
      if (this.boss != StationClock.NoBoss) {
        context.save();
        this.setShadow(context, this.bossShadowColor, this.bossShadowOffsetX, this.bossShadowOffsetY, this.bossShadowBlur);
        switch (this.boss) {
    		  case StationClock.BlackBoss:
    		    this.fillCircle(context, 'rgb(0,0,0)', 0, 0, 0.1);
    		    break;
    		  case StationClock.RedBoss:
    		    this.fillCircle(context, 'rgb(220,0,0)', 0, 0, 0.06);
    		    break;
          case StationClock.ViennaBoss:
            this.fillCircle(context, 'rgb(0,0,0)', 0, 0, 0.07);
            break;
        }
        context.restore();
      }
      
      context.restore();
    }
  }
};

StationClock.prototype.getAnimationOffset = function(animationStep) {
  switch (animationStep) {
    case 3: return  0.2;
    case 2: return -0.1;
    case 1: return  0.05;
  }
  return 0;
};

StationClock.prototype.setShadow = function(context, color, offsetX, offsetY, blur) {
  if (color) {
  	context.shadowColor   = color;
  	context.shadowOffsetX = this.radius * offsetX;
  	context.shadowOffsetY = this.radius * offsetY;
  	context.shadowBlur    = this.radius * blur;
  }
};

StationClock.prototype.fillCircle = function(context, color, x, y, radius) {
  if (color) {
    context.beginPath();
    context.fillStyle = color;
    context.arc(x * this.radius, y * this.radius, radius * this.radius, 0, 2 * Math.PI, true);
    context.fill();
  }
};

StationClock.prototype.strokeCircle = function(context, color, x, y, radius, lineWidth) {
  if (color) {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth * this.radius;
    context.arc(x * this.radius, y * this.radius, radius * this.radius, 0, 2 * Math.PI, true);
    context.stroke();
  }
};

StationClock.prototype.fillSquare = function(context, color, x, y, size) {
  if (color) {
    context.fillStyle = color;
    context.fillRect((x - size / 2) * this.radius, (y -size / 2) * this.radius, size * this.radius, size * this.radius);
  }
};

StationClock.prototype.strokeSquare = function(context, color, x, y, size, lineWidth) {
  if (color) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth * this.radius;
    context.strokeRect((x - size / 2) * this.radius, (y -size / 2) * this.radius, size * this.radius, size * this.radius);
  }
};

StationClock.prototype.strokeLine = function(context, color, x1, y1, x2, y2, width) {
  if (color) {
	  context.beginPath();
	  context.strokeStyle = color;
	  context.moveTo(x1 * this.radius, y1 * this.radius);
	  context.lineTo(x2 * this.radius, y2 * this.radius);
	  context.lineWidth = width * this.radius;
	  context.stroke();
  }
};

StationClock.prototype.fillPolygon = function(context, color, x1, y1, x2, y2, x3, y3, x4, y4, x5, y5) {
  if (color) {
	  context.beginPath();
	  context.fillStyle = color;
	  context.moveTo(x1 * this.radius, y1 * this.radius);
	  context.lineTo(x2 * this.radius, y2 * this.radius);
	  context.lineTo(x3 * this.radius, y3 * this.radius);
	  context.lineTo(x4 * this.radius, y4 * this.radius);
	  if ((x5 != undefined) && (y5 != undefined)) {
	    context.lineTo(x5 * this.radius, y5 * this.radius);
	  }
	  context.lineTo(x1 * this.radius, y1 * this.radius);
	  context.fill();
  }
};

StationClock.prototype.fillSymmetricPolygon = function(context, color, points) {
    context.beginPath();
    context.fillStyle = color;
    context.moveTo(points[0][0] * this.radius, points[0][1] * this.radius);
    for (var i = 1; i < points.length; i++) {
      context.lineTo(points[i][0] * this.radius, points[i][1] * this.radius);
    }
    for (var i = points.length - 1; i >= 0; i--) {
      context.lineTo(0 - points[i][0] * this.radius, points[i][1] * this.radius);
    }
    context.lineTo(points[0][0] * this.radius, points[0][1] * this.radius);
    context.fill();
};

StationClock.prototype.strokeSymmetricPolygon = function(context, color, points, width) {
    context.beginPath();
    context.strokeStyle = color;
    context.moveTo(points[0][0] * this.radius, points[0][1] * this.radius);
    for (var i = 1; i < points.length; i++) {
      context.lineTo(points[i][0] * this.radius, points[i][1] * this.radius);
    }
    for (var i = points.length - 1; i >= 0; i--) {
      context.lineTo(0 - points[i][0] * this.radius, points[i][1] * this.radius);
    }
    context.lineTo(points[0][0] * this.radius, points[0][1] * this.radius);
    context.lineWidth = width * this.radius;
    context.stroke();
};

// Copyright 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Known Issues:
//
// * Patterns are not implemented.
// * Radial gradient are not implemented. The VML version of these look very
//   different from the canvas one.
// * Clipping paths are not implemented.
// * Coordsize. The width and height attribute have higher priority than the
//   width and height style values which isn't correct.
// * Painting mode isn't implemented.
// * Canvas width/height should is using content-box by default. IE in
//   Quirks mode will draw the canvas using border-box. Either change your
//   doctype to HTML5
//   (http://www.whatwg.org/specs/web-apps/current-work/#the-doctype)
//   or use Box Sizing Behavior from WebFX
//   (http://webfx.eae.net/dhtml/boxsizing/boxsizing.html)
// * Non uniform scaling does not correctly scale strokes.
// * Optimize. There is always room for speed improvements.

// Only add this code if we do not already have a canvas implementation
if (!document.createElement('canvas').getContext) {

    (function() {
    
      // alias some functions to make (compiled) code shorter
      var m = Math;
      var mr = m.round;
      var ms = m.sin;
      var mc = m.cos;
      var abs = m.abs;
      var sqrt = m.sqrt;
    
      // this is used for sub pixel precision
      var Z = 10;
      var Z2 = Z / 2;
    
      /**
       * This funtion is assigned to the <canvas> elements as element.getContext().
       * @this {HTMLElement}
       * @return {CanvasRenderingContext2D_}
       */
      function getContext() {
        return this.context_ ||
            (this.context_ = new CanvasRenderingContext2D_(this));
      }
    
      var slice = Array.prototype.slice;
    
      /**
       * Binds a function to an object. The returned function will always use the
       * passed in {@code obj} as {@code this}.
       *
       * Example:
       *
       *   g = bind(f, obj, a, b)
       *   g(c, d) // will do f.call(obj, a, b, c, d)
       *
       * @param {Function} f The function to bind the object to
       * @param {Object} obj The object that should act as this when the function
       *     is called
       * @param {*} var_args Rest arguments that will be used as the initial
       *     arguments when the function is called
       * @return {Function} A new function that has bound this
       */
      function bind(f, obj, var_args) {
        var a = slice.call(arguments, 2);
        return function() {
          return f.apply(obj, a.concat(slice.call(arguments)));
        };
      }
    
      var G_vmlCanvasManager_ = {
        init: function(opt_doc) {
          if (/MSIE/.test(navigator.userAgent) && !window.opera) {
            var doc = opt_doc || document;
            // Create a dummy element so that IE will allow canvas elements to be
            // recognized.
            doc.createElement('canvas');
            doc.attachEvent('onreadystatechange', bind(this.init_, this, doc));
          }
        },
    
        init_: function(doc) {
          // create xmlns
          if (!doc.namespaces['g_vml_']) {
            doc.namespaces.add('g_vml_', 'urn:schemas-microsoft-com:vml',
                               '#default#VML');
    
          }
          if (!doc.namespaces['g_o_']) {
            doc.namespaces.add('g_o_', 'urn:schemas-microsoft-com:office:office',
                               '#default#VML');
          }
    
          // Setup default CSS.  Only add one style sheet per document
          if (!doc.styleSheets['ex_canvas_']) {
            var ss = doc.createStyleSheet();
            ss.owningElement.id = 'ex_canvas_';
            ss.cssText = 'canvas{display:inline-block;overflow:hidden;' +
                // default size is 300x150 in Gecko and Opera
                'text-align:left;width:300px;height:150px}' +
                'g_vml_\\:*{behavior:url(#default#VML)}' +
                'g_o_\\:*{behavior:url(#default#VML)}';
    
          }
    
          // find all canvas elements
          var els = doc.getElementsByTagName('canvas');
          for (var i = 0; i < els.length; i++) {
            this.initElement(els[i]);
          }
        },
    
        /**
         * Public initializes a canvas element so that it can be used as canvas
         * element from now on. This is called automatically before the page is
         * loaded but if you are creating elements using createElement you need to
         * make sure this is called on the element.
         * @param {HTMLElement} el The canvas element to initialize.
         * @return {HTMLElement} the element that was created.
         */
        initElement: function(el) {
          if (!el.getContext) {
    
            el.getContext = getContext;
    
            // Remove fallback content. There is no way to hide text nodes so we
            // just remove all childNodes. We could hide all elements and remove
            // text nodes but who really cares about the fallback content.
            el.innerHTML = '';
    
            // do not use inline function because that will leak memory
            el.attachEvent('onpropertychange', onPropertyChange);
            el.attachEvent('onresize', onResize);
    
            var attrs = el.attributes;
            if (attrs.width && attrs.width.specified) {
              // TODO: use runtimeStyle and coordsize
              // el.getContext().setWidth_(attrs.width.nodeValue);
              el.style.width = attrs.width.nodeValue + 'px';
            } else {
              el.width = el.clientWidth;
            }
            if (attrs.height && attrs.height.specified) {
              // TODO: use runtimeStyle and coordsize
              // el.getContext().setHeight_(attrs.height.nodeValue);
              el.style.height = attrs.height.nodeValue + 'px';
            } else {
              el.height = el.clientHeight;
            }
            //el.getContext().setCoordsize_()
          }
          return el;
        }
      };
    
      function onPropertyChange(e) {
        var el = e.srcElement;
    
        switch (e.propertyName) {
          case 'width':
            el.style.width = el.attributes.width.nodeValue + 'px';
            el.getContext().clearRect();
            break;
          case 'height':
            el.style.height = el.attributes.height.nodeValue + 'px';
            el.getContext().clearRect();
            break;
        }
      }
    
      function onResize(e) {
        var el = e.srcElement;
        if (el.firstChild) {
          el.firstChild.style.width =  el.clientWidth + 'px';
          el.firstChild.style.height = el.clientHeight + 'px';
        }
      }
    
      G_vmlCanvasManager_.init();
    
      // precompute "00" to "FF"
      var dec2hex = [];
      for (var i = 0; i < 16; i++) {
        for (var j = 0; j < 16; j++) {
          dec2hex[i * 16 + j] = i.toString(16) + j.toString(16);
        }
      }
    
      function createMatrixIdentity() {
        return [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1]
        ];
      }
    
      function matrixMultiply(m1, m2) {
        var result = createMatrixIdentity();
    
        for (var x = 0; x < 3; x++) {
          for (var y = 0; y < 3; y++) {
            var sum = 0;
    
            for (var z = 0; z < 3; z++) {
              sum += m1[x][z] * m2[z][y];
            }
    
            result[x][y] = sum;
          }
        }
        return result;
      }
    
      function copyState(o1, o2) {
        o2.fillStyle     = o1.fillStyle;
        o2.lineCap       = o1.lineCap;
        o2.lineJoin      = o1.lineJoin;
        o2.lineWidth     = o1.lineWidth;
        o2.miterLimit    = o1.miterLimit;
        o2.shadowBlur    = o1.shadowBlur;
        o2.shadowColor   = o1.shadowColor;
        o2.shadowOffsetX = o1.shadowOffsetX;
        o2.shadowOffsetY = o1.shadowOffsetY;
        o2.strokeStyle   = o1.strokeStyle;
        o2.globalAlpha   = o1.globalAlpha;
        o2.arcScaleX_    = o1.arcScaleX_;
        o2.arcScaleY_    = o1.arcScaleY_;
        o2.lineScale_    = o1.lineScale_;
      }
    
      function processStyle(styleString) {
        var str, alpha = 1;
    
        styleString = String(styleString);
        if (styleString.substring(0, 3) == 'rgb') {
          var start = styleString.indexOf('(', 3);
          var end = styleString.indexOf(')', start + 1);
          var guts = styleString.substring(start + 1, end).split(',');
    
          str = '#';
          for (var i = 0; i < 3; i++) {
            str += dec2hex[Number(guts[i])];
          }
    
          if (guts.length == 4 && styleString.substr(3, 1) == 'a') {
            alpha = guts[3];
          }
        } else {
          str = styleString;
        }
    
        return {color: str, alpha: alpha};
      }
    
      function processLineCap(lineCap) {
        switch (lineCap) {
          case 'butt':
            return 'flat';
          case 'round':
            return 'round';
          case 'square':
          default:
            return 'square';
        }
      }
    
      /**
       * This class implements CanvasRenderingContext2D interface as described by
       * the WHATWG.
       * @param {HTMLElement} surfaceElement The element that the 2D context should
       * be associated with
       */
      function CanvasRenderingContext2D_(surfaceElement) {
        this.m_ = createMatrixIdentity();
    
        this.mStack_ = [];
        this.aStack_ = [];
        this.currentPath_ = [];
    
        // Canvas context properties
        this.strokeStyle = '#000';
        this.fillStyle = '#000';
    
        this.lineWidth = 1;
        this.lineJoin = 'miter';
        this.lineCap = 'butt';
        this.miterLimit = Z * 1;
        this.globalAlpha = 1;
        this.canvas = surfaceElement;
    
        var el = surfaceElement.ownerDocument.createElement('div');
        el.style.width =  surfaceElement.clientWidth + 'px';
        el.style.height = surfaceElement.clientHeight + 'px';
        el.style.overflow = 'hidden';
        el.style.position = 'absolute';
        surfaceElement.appendChild(el);
    
        this.element_ = el;
        this.arcScaleX_ = 1;
        this.arcScaleY_ = 1;
        this.lineScale_ = 1;
      }
    
      var contextPrototype = CanvasRenderingContext2D_.prototype;
      contextPrototype.clearRect = function() {
        this.element_.innerHTML = '';
      };
    
      contextPrototype.beginPath = function() {
        // TODO: Branch current matrix so that save/restore has no effect
        //       as per safari docs.
        this.currentPath_ = [];
      };
    
      contextPrototype.moveTo = function(aX, aY) {
        var p = this.getCoords_(aX, aY);
        this.currentPath_.push({type: 'moveTo', x: p.x, y: p.y});
        this.currentX_ = p.x;
        this.currentY_ = p.y;
      };
    
      contextPrototype.lineTo = function(aX, aY) {
        var p = this.getCoords_(aX, aY);
        this.currentPath_.push({type: 'lineTo', x: p.x, y: p.y});
    
        this.currentX_ = p.x;
        this.currentY_ = p.y;
      };
    
      contextPrototype.bezierCurveTo = function(aCP1x, aCP1y,
                                                aCP2x, aCP2y,
                                                aX, aY) {
        var p = this.getCoords_(aX, aY);
        var cp1 = this.getCoords_(aCP1x, aCP1y);
        var cp2 = this.getCoords_(aCP2x, aCP2y);
        bezierCurveTo(this, cp1, cp2, p);
      };
    
      // Helper function that takes the already fixed cordinates.
      function bezierCurveTo(self, cp1, cp2, p) {
        self.currentPath_.push({
          type: 'bezierCurveTo',
          cp1x: cp1.x,
          cp1y: cp1.y,
          cp2x: cp2.x,
          cp2y: cp2.y,
          x: p.x,
          y: p.y
        });
        self.currentX_ = p.x;
        self.currentY_ = p.y;
      }
    
      contextPrototype.quadraticCurveTo = function(aCPx, aCPy, aX, aY) {
        // the following is lifted almost directly from
        // http://developer.mozilla.org/en/docs/Canvas_tutorial:Drawing_shapes
    
        var cp = this.getCoords_(aCPx, aCPy);
        var p = this.getCoords_(aX, aY);
    
        var cp1 = {
          x: this.currentX_ + 2.0 / 3.0 * (cp.x - this.currentX_),
          y: this.currentY_ + 2.0 / 3.0 * (cp.y - this.currentY_)
        };
        var cp2 = {
          x: cp1.x + (p.x - this.currentX_) / 3.0,
          y: cp1.y + (p.y - this.currentY_) / 3.0
        };
    
        bezierCurveTo(this, cp1, cp2, p);
      };
    
      contextPrototype.arc = function(aX, aY, aRadius,
                                      aStartAngle, aEndAngle, aClockwise) {
        aRadius *= Z;
        var arcType = aClockwise ? 'at' : 'wa';
    
        var xStart = aX + mc(aStartAngle) * aRadius - Z2;
        var yStart = aY + ms(aStartAngle) * aRadius - Z2;
    
        var xEnd = aX + mc(aEndAngle) * aRadius - Z2;
        var yEnd = aY + ms(aEndAngle) * aRadius - Z2;
    
        // IE won't render arches drawn counter clockwise if xStart == xEnd.
        if (xStart == xEnd && !aClockwise) {
          xStart += 0.125; // Offset xStart by 1/80 of a pixel. Use something
                           // that can be represented in binary
        }
    
        var p = this.getCoords_(aX, aY);
        var pStart = this.getCoords_(xStart, yStart);
        var pEnd = this.getCoords_(xEnd, yEnd);
    
        this.currentPath_.push({type: arcType,
                               x: p.x,
                               y: p.y,
                               radius: aRadius,
                               xStart: pStart.x,
                               yStart: pStart.y,
                               xEnd: pEnd.x,
                               yEnd: pEnd.y});
    
      };
    
      contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
        this.moveTo(aX, aY);
        this.lineTo(aX + aWidth, aY);
        this.lineTo(aX + aWidth, aY + aHeight);
        this.lineTo(aX, aY + aHeight);
        this.closePath();
      };
    
      contextPrototype.strokeRect = function(aX, aY, aWidth, aHeight) {
        var oldPath = this.currentPath_;
        this.beginPath();
    
        this.moveTo(aX, aY);
        this.lineTo(aX + aWidth, aY);
        this.lineTo(aX + aWidth, aY + aHeight);
        this.lineTo(aX, aY + aHeight);
        this.closePath();
        this.stroke();
    
        this.currentPath_ = oldPath;
      };
    
      contextPrototype.fillRect = function(aX, aY, aWidth, aHeight) {
        var oldPath = this.currentPath_;
        this.beginPath();
    
        this.moveTo(aX, aY);
        this.lineTo(aX + aWidth, aY);
        this.lineTo(aX + aWidth, aY + aHeight);
        this.lineTo(aX, aY + aHeight);
        this.closePath();
        this.fill();
    
        this.currentPath_ = oldPath;
      };
    
      contextPrototype.createLinearGradient = function(aX0, aY0, aX1, aY1) {
        var gradient = new CanvasGradient_('gradient');
        gradient.x0_ = aX0;
        gradient.y0_ = aY0;
        gradient.x1_ = aX1;
        gradient.y1_ = aY1;
        return gradient;
      };
    
      contextPrototype.createRadialGradient = function(aX0, aY0, aR0,
                                                       aX1, aY1, aR1) {
        var gradient = new CanvasGradient_('gradientradial');
        gradient.x0_ = aX0;
        gradient.y0_ = aY0;
        gradient.r0_ = aR0;
        gradient.x1_ = aX1;
        gradient.y1_ = aY1;
        gradient.r1_ = aR1;
        return gradient;
      };
    
      contextPrototype.drawImage = function(image, var_args) {
        var dx, dy, dw, dh, sx, sy, sw, sh;
    
        // to find the original width we overide the width and height
        var oldRuntimeWidth = image.runtimeStyle.width;
        var oldRuntimeHeight = image.runtimeStyle.height;
        image.runtimeStyle.width = 'auto';
        image.runtimeStyle.height = 'auto';
    
        // get the original size
        var w = image.width;
        var h = image.height;
    
        // and remove overides
        image.runtimeStyle.width = oldRuntimeWidth;
        image.runtimeStyle.height = oldRuntimeHeight;
    
        if (arguments.length == 3) {
          dx = arguments[1];
          dy = arguments[2];
          sx = sy = 0;
          sw = dw = w;
          sh = dh = h;
        } else if (arguments.length == 5) {
          dx = arguments[1];
          dy = arguments[2];
          dw = arguments[3];
          dh = arguments[4];
          sx = sy = 0;
          sw = w;
          sh = h;
        } else if (arguments.length == 9) {
          sx = arguments[1];
          sy = arguments[2];
          sw = arguments[3];
          sh = arguments[4];
          dx = arguments[5];
          dy = arguments[6];
          dw = arguments[7];
          dh = arguments[8];
        } else {
          throw Error('Invalid number of arguments');
        }
    
        var d = this.getCoords_(dx, dy);
    
        var w2 = sw / 2;
        var h2 = sh / 2;
    
        var vmlStr = [];
    
        var W = 10;
        var H = 10;
    
        // For some reason that I've now forgotten, using divs didn't work
        vmlStr.push(' <g_vml_:group',
                    ' coordsize="', Z * W, ',', Z * H, '"',
                    ' coordorigin="0,0"' ,
                    ' style="width:', W, 'px;height:', H, 'px;position:absolute;');
    
        // If filters are necessary (rotation exists), create them
        // filters are bog-slow, so only create them if abbsolutely necessary
        // The following check doesn't account for skews (which don't exist
        // in the canvas spec (yet) anyway.
    
        if (this.m_[0][0] != 1 || this.m_[0][1]) {
          var filter = [];
    
          // Note the 12/21 reversal
          filter.push('M11=', this.m_[0][0], ',',
                      'M12=', this.m_[1][0], ',',
                      'M21=', this.m_[0][1], ',',
                      'M22=', this.m_[1][1], ',',
                      'Dx=', mr(d.x / Z), ',',
                      'Dy=', mr(d.y / Z), '');
    
          // Bounding box calculation (need to minimize displayed area so that
          // filters don't waste time on unused pixels.
          var max = d;
          var c2 = this.getCoords_(dx + dw, dy);
          var c3 = this.getCoords_(dx, dy + dh);
          var c4 = this.getCoords_(dx + dw, dy + dh);
    
          max.x = m.max(max.x, c2.x, c3.x, c4.x);
          max.y = m.max(max.y, c2.y, c3.y, c4.y);
    
          vmlStr.push('padding:0 ', mr(max.x / Z), 'px ', mr(max.y / Z),
                      'px 0;filter:progid:DXImageTransform.Microsoft.Matrix(',
                      filter.join(''), ", sizingmethod='clip');")
        } else {
          vmlStr.push('top:', mr(d.y / Z), 'px;left:', mr(d.x / Z), 'px;');
        }
    
        vmlStr.push(' ">' ,
                    '<g_vml_:image src="', image.src, '"',
                    ' style="width:', Z * dw, 'px;',
                    ' height:', Z * dh, 'px;"',
                    ' cropleft="', sx / w, '"',
                    ' croptop="', sy / h, '"',
                    ' cropright="', (w - sx - sw) / w, '"',
                    ' cropbottom="', (h - sy - sh) / h, '"',
                    ' />',
                    '</g_vml_:group>');
    
        this.element_.insertAdjacentHTML('BeforeEnd',
                                        vmlStr.join(''));
      };
    
      contextPrototype.stroke = function(aFill) {
        var lineStr = [];
        var lineOpen = false;
        var a = processStyle(aFill ? this.fillStyle : this.strokeStyle);
        var color = a.color;
        var opacity = a.alpha * this.globalAlpha;
    
        var W = 10;
        var H = 10;
    
        lineStr.push('<g_vml_:shape',
                     ' filled="', !!aFill, '"',
                     ' style="position:absolute;width:', W, 'px;height:', H, 'px;"',
                     ' coordorigin="0 0" coordsize="', Z * W, ' ', Z * H, '"',
                     ' stroked="', !aFill, '"',
                     ' path="');
    
        var newSeq = false;
        var min = {x: null, y: null};
        var max = {x: null, y: null};
    
        for (var i = 0; i < this.currentPath_.length; i++) {
          var p = this.currentPath_[i];
          var c;
    
          switch (p.type) {
            case 'moveTo':
              c = p;
              lineStr.push(' m ', mr(p.x), ',', mr(p.y));
              break;
            case 'lineTo':
              lineStr.push(' l ', mr(p.x), ',', mr(p.y));
              break;
            case 'close':
              lineStr.push(' x ');
              p = null;
              break;
            case 'bezierCurveTo':
              lineStr.push(' c ',
                           mr(p.cp1x), ',', mr(p.cp1y), ',',
                           mr(p.cp2x), ',', mr(p.cp2y), ',',
                           mr(p.x), ',', mr(p.y));
              break;
            case 'at':
            case 'wa':
              lineStr.push(' ', p.type, ' ',
                           mr(p.x - this.arcScaleX_ * p.radius), ',',
                           mr(p.y - this.arcScaleY_ * p.radius), ' ',
                           mr(p.x + this.arcScaleX_ * p.radius), ',',
                           mr(p.y + this.arcScaleY_ * p.radius), ' ',
                           mr(p.xStart), ',', mr(p.yStart), ' ',
                           mr(p.xEnd), ',', mr(p.yEnd));
              break;
          }
    
    
          // TODO: Following is broken for curves due to
          //       move to proper paths.
    
          // Figure out dimensions so we can do gradient fills
          // properly
          if (p) {
            if (min.x == null || p.x < min.x) {
              min.x = p.x;
            }
            if (max.x == null || p.x > max.x) {
              max.x = p.x;
            }
            if (min.y == null || p.y < min.y) {
              min.y = p.y;
            }
            if (max.y == null || p.y > max.y) {
              max.y = p.y;
            }
          }
        }
        lineStr.push(' ">');
    
        if (!aFill) {
          var lineWidth = this.lineScale_ * this.lineWidth;
    
          // VML cannot correctly render a line if the width is less than 1px.
          // In that case, we dilute the color to make the line look thinner.
          if (lineWidth < 1) {
            opacity *= lineWidth;
          }
    
          lineStr.push(
            '<g_vml_:stroke',
            ' opacity="', opacity, '"',
            ' joinstyle="', this.lineJoin, '"',
            ' miterlimit="', this.miterLimit, '"',
            ' endcap="', processLineCap(this.lineCap), '"',
            ' weight="', lineWidth, 'px"',
            ' color="', color, '" />'
          );
        } else if (typeof this.fillStyle == 'object') {
          var fillStyle = this.fillStyle;
          var angle = 0;
          var focus = {x: 0, y: 0};
    
          // additional offset
          var shift = 0;
          // scale factor for offset
          var expansion = 1;
    
          if (fillStyle.type_ == 'gradient') {
            var x0 = fillStyle.x0_ / this.arcScaleX_;
            var y0 = fillStyle.y0_ / this.arcScaleY_;
            var x1 = fillStyle.x1_ / this.arcScaleX_;
            var y1 = fillStyle.y1_ / this.arcScaleY_;
            var p0 = this.getCoords_(x0, y0);
            var p1 = this.getCoords_(x1, y1);
            var dx = p1.x - p0.x;
            var dy = p1.y - p0.y;
            angle = Math.atan2(dx, dy) * 180 / Math.PI;
    
            // The angle should be a non-negative number.
            if (angle < 0) {
              angle += 360;
            }
    
            // Very small angles produce an unexpected result because they are
            // converted to a scientific notation string.
            if (angle < 1e-6) {
              angle = 0;
            }
          } else {
            var p0 = this.getCoords_(fillStyle.x0_, fillStyle.y0_);
            var width  = max.x - min.x;
            var height = max.y - min.y;
            focus = {
              x: (p0.x - min.x) / width,
              y: (p0.y - min.y) / height
            };
    
            width  /= this.arcScaleX_ * Z;
            height /= this.arcScaleY_ * Z;
            var dimension = m.max(width, height);
            shift = 2 * fillStyle.r0_ / dimension;
            expansion = 2 * fillStyle.r1_ / dimension - shift;
          }
    
          // We need to sort the color stops in ascending order by offset,
          // otherwise IE won't interpret it correctly.
          var stops = fillStyle.colors_;
          stops.sort(function(cs1, cs2) {
            return cs1.offset - cs2.offset;
          });
    
          var length = stops.length;
          var color1 = stops[0].color;
          var color2 = stops[length - 1].color;
          var opacity1 = stops[0].alpha * this.globalAlpha;
          var opacity2 = stops[length - 1].alpha * this.globalAlpha;
    
          var colors = [];
          for (var i = 0; i < length; i++) {
            var stop = stops[i];
            colors.push(stop.offset * expansion + shift + ' ' + stop.color);
          }
    
          // When colors attribute is used, the meanings of opacity and o:opacity2
          // are reversed.
          lineStr.push('<g_vml_:fill type="', fillStyle.type_, '"',
                       ' method="none" focus="100%"',
                       ' color="', color1, '"',
                       ' color2="', color2, '"',
                       ' colors="', colors.join(','), '"',
                       ' opacity="', opacity2, '"',
                       ' g_o_:opacity2="', opacity1, '"',
                       ' angle="', angle, '"',
                       ' focusposition="', focus.x, ',', focus.y, '" />');
        } else {
          lineStr.push('<g_vml_:fill color="', color, '" opacity="', opacity,
                       '" />');
        }
    
        lineStr.push('</g_vml_:shape>');
    
        this.element_.insertAdjacentHTML('beforeEnd', lineStr.join(''));
      };
    
      contextPrototype.fill = function() {
        this.stroke(true);
      }
    
      contextPrototype.closePath = function() {
        this.currentPath_.push({type: 'close'});
      };
    
      /**
       * @private
       */
      contextPrototype.getCoords_ = function(aX, aY) {
        var m = this.m_;
        return {
          x: Z * (aX * m[0][0] + aY * m[1][0] + m[2][0]) - Z2,
          y: Z * (aX * m[0][1] + aY * m[1][1] + m[2][1]) - Z2
        }
      };
    
      contextPrototype.save = function() {
        var o = {};
        copyState(this, o);
        this.aStack_.push(o);
        this.mStack_.push(this.m_);
        this.m_ = matrixMultiply(createMatrixIdentity(), this.m_);
      };
    
      contextPrototype.restore = function() {
        copyState(this.aStack_.pop(), this);
        this.m_ = this.mStack_.pop();
      };
    
      function matrixIsFinite(m) {
        for (var j = 0; j < 3; j++) {
          for (var k = 0; k < 2; k++) {
            if (!isFinite(m[j][k]) || isNaN(m[j][k])) {
              return false;
            }
          }
        }
        return true;
      }
    
      function setM(ctx, m, updateLineScale) {
        if (!matrixIsFinite(m)) {
          return;
        }
        ctx.m_ = m;
    
        if (updateLineScale) {
          // Get the line scale.
          // Determinant of this.m_ means how much the area is enlarged by the
          // transformation. So its square root can be used as a scale factor
          // for width.
          var det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
          ctx.lineScale_ = sqrt(abs(det));
        }
      }
    
      contextPrototype.translate = function(aX, aY) {
        var m1 = [
          [1,  0,  0],
          [0,  1,  0],
          [aX, aY, 1]
        ];
    
        setM(this, matrixMultiply(m1, this.m_), false);
      };
    
      contextPrototype.rotate = function(aRot) {
        var c = mc(aRot);
        var s = ms(aRot);
    
        var m1 = [
          [c,  s, 0],
          [-s, c, 0],
          [0,  0, 1]
        ];
    
        setM(this, matrixMultiply(m1, this.m_), false);
      };
    
      contextPrototype.scale = function(aX, aY) {
        this.arcScaleX_ *= aX;
        this.arcScaleY_ *= aY;
        var m1 = [
          [aX, 0,  0],
          [0,  aY, 0],
          [0,  0,  1]
        ];
    
        setM(this, matrixMultiply(m1, this.m_), true);
      };
    
      contextPrototype.transform = function(m11, m12, m21, m22, dx, dy) {
        var m1 = [
          [m11, m12, 0],
          [m21, m22, 0],
          [dx,  dy,  1]
        ];
    
        setM(this, matrixMultiply(m1, this.m_), true);
      };
    
      contextPrototype.setTransform = function(m11, m12, m21, m22, dx, dy) {
        var m = [
          [m11, m12, 0],
          [m21, m22, 0],
          [dx,  dy,  1]
        ];
    
        setM(this, m, true);
      };
    
      /******** STUBS ********/
      contextPrototype.clip = function() {
        // TODO: Implement
      };
    
      contextPrototype.arcTo = function() {
        // TODO: Implement
      };
    
      contextPrototype.createPattern = function() {
        return new CanvasPattern_;
      };
    
      // Gradient / Pattern Stubs
      function CanvasGradient_(aType) {
        this.type_ = aType;
        this.x0_ = 0;
        this.y0_ = 0;
        this.r0_ = 0;
        this.x1_ = 0;
        this.y1_ = 0;
        this.r1_ = 0;
        this.colors_ = [];
      }
    
      CanvasGradient_.prototype.addColorStop = function(aOffset, aColor) {
        aColor = processStyle(aColor);
        this.colors_.push({offset: aOffset,
                           color: aColor.color,
                           alpha: aColor.alpha});
      };
    
      function CanvasPattern_() {}
    
      // set up externs
      G_vmlCanvasManager = G_vmlCanvasManager_;
      CanvasRenderingContext2D = CanvasRenderingContext2D_;
      CanvasGradient = CanvasGradient_;
      CanvasPattern = CanvasPattern_;
    
    })();
    
    } // if
    
var clock = new StationClock("clock");
    clock.body = StationClock.RoundBody;
    clock.dial = StationClock.SwissStrokeDial;
    clock.hourHand = StationClock.SwissHourHand;
    clock.minuteHand = StationClock.SwissMinuteHand;
    clock.secondHand = StationClock.SwissSecondHand;
    clock.boss = StationClock.NoBoss;
    clock.minuteHandBehavoir = StationClock.BouncingMinuteHand;
    clock.secondHandBehavoir = StationClock.OverhastySecondHand;
    animate();
    function animate() {
    clock.draw();
    window.setTimeout("animate()", 50);
    }
