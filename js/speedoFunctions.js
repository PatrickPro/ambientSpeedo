/**
 * Created by patrickpro on 29/11/2015.
 */

var isAndroid = /(android)/i.test(navigator.userAgent);

var ws = null;
var wsUrl = "127.0.0.1";
var wsPort = "4080";


var MAXSPEED = 120;
var MAXDISTANCE = 250;
var LINETHICKNESS = 15;
var CARSCALE = 2;
var BARSCALE = 15;
var DISTANCETOSHOWINDICATOR = 50; // TODO add prompt

var CANVAS_WIDTH = 1280;
var CANVAS_HEIGHT = 720;
//var CANVAS_HEIGHT = 768;

var SIGNSIZE_NORMAL = (CANVAS_HEIGHT / (MAXSPEED) * 10) / 2;
var SIGNSIZE_AMBIENT = 300;
var SIGNFONTSIZE_NORMAL = (SIGNSIZE_NORMAL + 10);
var SIGNFONTSIZE_AMBIENT = 400;


var clickCount = 0;

//COLORS
var white = "#ffffff";
var lightgrey = "#c9c8c8"
var grey = "#333132";
var blue = "#0e95e6";
var green = "#2ad880";
var red = "#fc5454";
var orange = "#ff8948";
var yellow = "#c1ba79";
var black = "#000000";
var bgGreyDark = "#333132";
var bgGreyLight = "#393738";
var bgGreyDarkFont = "#2d2c2d";
var bgGreyLightFont = "#413f40";
var currentTraceColor = red;

var zIndex = 0;

var stage = null;
var currentSpeedText = new createjs.Text("ERROR", "160px Roboto", lightgrey);
var bgSpeedUnit = new createjs.Text("KM/H", "20px Roboto", lightgrey);
var speedRect = new createjs.Shape();
var traceLine = new createjs.Shape();
var idealLine = new createjs.Shape();
var newSpeedLimitCircle = new createjs.Shape();
var newSpeedLimitText = new createjs.Text("", SIGNFONTSIZE_NORMAL + "px Roboto", black);

var ambientSpeedLimitCircle = new createjs.Shape();
var ambientSpeedLimitText = new createjs.Text("", SIGNFONTSIZE_AMBIENT + "px Roboto", black);


var currentSpeed = 0;
var currentDistance = 280;
var lastDistanceValue = 99999;
var currentSpeedLimit = 80;
var nextSpeedLimit = 60;
var gasPedal = 0;
var brakePedal = 0;

var speedWhenChallengeStarts = -1;

var lastDistanceBarX = null;
var lastSpeedRectY = null;


var distanceCarImg_Y = null;
var distanceCarImg_B = null;
var distanceCarImg_R = null;

var distanceBarImg_Y = null;
var distanceBarImg_B = null;
var distanceBarImg_R = null;

// Hardcoded for now
var distanceCarImg_WIDTH = 63;
var distanceBarImg_WIDTH = 2;

var speedLimitSignVisible = false;
var rowheightOffset = 0;

var currentMessage = new receivedDataPacket();
var receivedMessagesList = new DoublyList();
var pastPerformanceTraces = new DoublyList();

var isRealTime = false;


var dingSound = new Howl({
    src: ['sounds/ding.mp3'],
    preload: true,
    onend: function () {
        removeAmbientSpeedLimit();
        // TODO fade in sign, play sound, remove after sound
        //setTimeout(removeAmbientSpeedLimit, 800);
    }
});



var successSound = new Howl({
    src: ['sounds/success.mp3'],
    preload: true,
    onend: function () {
        console.log('Finished!');
    }
});



var failSound = new Howl({
    src: ['sounds/fail.mp3'],
    preload: true,
    onend: function () {
        console.log('Finished!');
    }
});



$(document).ready(function () {


    $("body").keypress(function (event) {

        if (event.which == 119) {
            // W
            if (currentSpeed <= MAXSPEED) {
                currentSpeed++;
                setNewSpeed(currentSpeed);
            }

        } else if (event.which == 115) {
            //S
            if (currentSpeed > 0) {
                currentSpeed--;
                setNewSpeed(currentSpeed);
            }
        }

        else if (event.which == 100) {
            //D
            currentDistance--;
            setNewDistance(currentDistance);
        } else if (event.which == 97) {
            //A
            currentDistance++;
            setNewDistance(currentDistance);
        } else if (event.which == 32) {
            //Spacebar
            removeTrace();
            currentDistance = 251;
        } else if (event.which == 98) {
            //B

            gasPedal = 0.0;
            brakePedal = 0.0;
            setDrawingColor(true, currentMessage);
        }
        else if (event.which == 114) {
            //R
            gasPedal = 0.0;
            brakePedal = 1.0;
            setDrawingColor(true, currentMessage);

        } else if (event.which == 121) {
            //Y
            gasPedal = 1.0;
            brakePedal = 0.0;
            setDrawingColor(true, currentMessage);
        }

        updateSpeedo();
        console.log("KeyPressed: " + event.which);


    });

    $.get('http://rg.proppe.me/ipaddress', function (newIP) {
        if (newIP != null && ValidateIPaddress(newIP)) {
            wsUrl = newIP;
            console.log("Automatically set WS server IP to " + newIP);
            currentSpeedText.text = newIP;
            updateSpeedo();
            openWebsocket(wsUrl, wsPort);

        } else {
            promptForIP();
            openWebsocket(wsUrl, wsPort);
        }

    });


});


function openWebsocket(ip, port) {
    if (ws != null) {
        ws.close(1000);
    }

    try {
        ws = new ReconnectingWebSocket("ws://" + ip + ":" + port + "/");
        ws.automaticOpen = true;

    } catch (exception) {
        console.log("Error: " + exception);
        currentSpeedText.text = "WS Error."
    }

    ws.onmessage = function (event) {
        var msg = event.data.split(";");
        //68.24;
        //80;
        //60;
        //64;
        //1.0;
        //0.0
        if (msg.length == 6) {

            if (isRealTime == false) {
                removeTrace(); // if replayed and server starts again, clean up
            }
            currentMessage.currentSpeed = msg[0];
            currentMessage.currentSpeedLimit = msg[1];
            currentMessage.nextSpeedLimit = msg[2];
            currentMessage.currentDistance = msg[3];
            currentMessage.gasPedal = msg[4];
            currentMessage.brakePedal = msg[5];
            currentMessage.realtime = true;
            currentMessage.time = Date.now();

            handleNewData(currentMessage);

        } else if (msg.length == 2) {
            if (msg[0] == "replay") {
                replayMessages(pastPerformanceTraces, 100, msg[1]);
            } else {
                console.log("Command not recognized: " + msg[0]);
            }
        }
        else if (msg.length == 1) {
            console.log(msg[0] + " command received");
            if (msg[0] == "dump") {
                dumpReceivedData(receivedMessagesList);
            } else if (msg[0] == "replay") {
                replayAllMessages(pastPerformanceTraces, 100);
            } else {

                console.log("Command not recognized: " + msg[0]);
            }
        } else {
            console.log("Message length mismatch! msg: " + msg);
        }
        var debugInfo = document.getElementById("debugInfo");
        debugInfo.innerHTML = "currentSpeed: " + currentMessage.currentSpeed + " - currentDistance: " + currentMessage.currentDistance + " - lastDistance: " + currentMessage.lastDistanceValue + " - currentSpeedLimit: " + currentMessage.currentSpeedLimit + " - nextSpeedLimit: " + currentMessage.nextSpeedLimit + " - gasPedal: " + currentMessage.gasPedal + " - brakePedal: " + currentMessage.brakePedal + " - IP: " + wsUrl;

    };
    ws.onclose = function () {
        console.log("WS closed");
        ws = new WebSocket("ws://" + wsUrl + ":" + wsPort + "/");
    };

    ws.onopen = function () {
        console.log("WS connected (" + wsUrl + ":" + wsPort + ")");
        //setTimeout(setNewSpeed(0), 800); // fix that enables browser to load webfont, otherwise it won't display the font initially.
        //setTimeout(updateSpeedo, 800);
    };
    ws.onerror = function (event) {
        console.log("WS error: " + event);
    }
}

function init() {
    document.body.style.background = grey;


    document.getElementById("speedoCanvas").addEventListener("click", function () {
        clickCount++
        if (clickCount % 5 == 0) {
            document.getElementById("debugInfo").style.display = 'block';
            var debugInfo = document.getElementById("debugInfo");
            debugInfo.innerHTML = "currentSpeed: " + currentSpeed + " - currentDistance: " + currentDistance + " - lastDistance: " + lastDistanceValue + " - currentSpeedLimit: " + currentSpeedLimit + " - nextSpeedLimit: " + nextSpeedLimit + " - gasPedal: " + gasPedal + " - brakePedal: " + brakePedal + " - IP: " + wsUrl;

        } else {
            document.getElementById("debugInfo").style.display = 'none';
        }

        if (clickCount % 11 == 0) {
            promptForIP();

            openWebsocket(wsUrl, wsPort);

            var maxSpeed = prompt("MAXSPEED", MAXSPEED);
            if (maxSpeed != null && maxSpeed > 0 && maxSpeed < 9000) {
                MAXSPEED = parseInt(maxSpeed);
                console.log("Manually set MAXSPEED to " + MAXSPEED);
            }

            var maxDist = prompt("MAXDISTANCE", MAXDISTANCE);
            if (maxDist != null && maxDist > 0 && maxDist < 9000) {
                MAXDISTANCE = parseInt(maxDist);
                console.log("Manually set MAXDISTANCE to " + MAXDISTANCE);
            }

            var lineThickness = prompt("LINETHICKNESS", LINETHICKNESS);
            if (lineThickness != null && lineThickness > 0 && lineThickness < 9000) {
                LINETHICKNESS = parseInt(lineThickness);
                console.log("Manually set LINETHICKNESS to " + LINETHICKNESS);
            }

            var carScale = prompt("CARSCALE", CARSCALE);
            if (carScale != null && carScale > 0 && carScale < 9000) {
                CARSCALE = parseInt(carScale);
                console.log("Manually set CARSCALE to " + CARSCALE);
            }

            var barScale = prompt("BARSCALE", BARSCALE);
            if (barScale != null && barScale > 0 && barScale < 9000) {
                BARSCALE = parseInt(barScale);
                console.log("Manually set BARSCALE to " + BARSCALE);
            }


            setScalingFactors("distance");
            removeTrace();

        }

        // reset to prevent (very unlikely) overflow
        if (clickCount > 100) {
            clickCount = 0;
        }
    });


    setupCanvas();
}

function setScalingFactors(mode) {

    if (mode == "distance") {
        distanceCarImg_Y.scaleX = CARSCALE;
        distanceCarImg_Y.scaleY = CARSCALE;
        distanceCarImg_B.scaleX = CARSCALE;
        distanceCarImg_B.scaleY = CARSCALE;
        distanceCarImg_R.scaleX = CARSCALE;
        distanceCarImg_R.scaleY = CARSCALE;

        distanceBarImg_Y.scaleX = BARSCALE;
        distanceBarImg_Y.scaleY = BARSCALE;
        distanceBarImg_B.scaleX = BARSCALE;
        distanceBarImg_B.scaleY = BARSCALE;
        distanceBarImg_R.scaleX = BARSCALE;
        distanceBarImg_R.scaleY = BARSCALE;
    }
    else if (mode == "trace") {

        traceLine.graphics.setStrokeStyle(LINETHICKNESS);
    }

}
function setupCanvas() {

    stage = new createjs.Stage("speedoCanvas");
    speedRect.graphics.beginFill("DeepSkyBlue").rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    speedRect.alpha = 0.6;
    speedRect.y = CANVAS_HEIGHT - 2;
    addChildToStage(speedRect);
    currentSpeedText.x = CANVAS_WIDTH / 2;
    currentSpeedText.y = CANVAS_HEIGHT / 2; // random position
    currentSpeedText.textAlign = "center";
    addChildToStage(currentSpeedText);

    currentSpeedText.text = "Connecting...";
    drawBG();

    distanceCarImg_Y = new createjs.Bitmap("images/yellowCar.png");
    distanceCarImg_B = new createjs.Bitmap("images/blueCar.png");
    distanceCarImg_R = new createjs.Bitmap("images/redCar.png");

    distanceCarImg_Y.regX = distanceCarImg_WIDTH / 2;
    distanceCarImg_Y.alpha = 0;
    distanceCarImg_B.regX = distanceCarImg_WIDTH / 2;
    distanceCarImg_B.alpha = 0;
    distanceCarImg_R.regX = distanceCarImg_WIDTH / 2;
    distanceCarImg_R.alpha = 0;

    distanceBarImg_Y = new createjs.Bitmap("images/yellowBar.png");
    distanceBarImg_Y.regX = distanceBarImg_WIDTH / 2;
    distanceBarImg_Y.alpha = 0;
    distanceBarImg_B = new createjs.Bitmap("images/blueBar.png");
    distanceBarImg_B.regX = distanceBarImg_WIDTH / 2;
    distanceBarImg_B.alpha = 0;
    distanceBarImg_R = new createjs.Bitmap("images/redBar.png");
    distanceBarImg_R.regX = distanceBarImg_WIDTH / 2;
    distanceBarImg_R.alpha = 0;


    setScalingFactors("distance");

    addChildToStage(distanceCarImg_Y);
    addChildToStage(distanceCarImg_R);
    addChildToStage(distanceCarImg_B);

    addChildToStage(distanceBarImg_Y);
    addChildToStage(distanceBarImg_B);
    addChildToStage(distanceBarImg_R);

}
function setDrawingColor(visibility, message) {


    if (message.gasPedal == 1.0 && message.brakePedal == 0.0) {
        currentTraceColor = yellow;
        //currentMessage.color = yellow;

        if (visibility) {
            distanceCarImg_Y.alpha = 1;
            distanceCarImg_R.alpha = 0;
            distanceCarImg_B.alpha = 0;

            distanceBarImg_Y.alpha = 1;
            distanceBarImg_R.alpha = 0;
            distanceBarImg_B.alpha = 0;

        } else {
            distanceCarImg_Y.alpha = 0;
            distanceCarImg_R.alpha = 0;
            distanceCarImg_B.alpha = 0;

            distanceBarImg_Y.alpha = 0;
            distanceBarImg_R.alpha = 0;
            distanceBarImg_B.alpha = 0;
        }


    } else if (message.gasPedal == 0.0 && message.brakePedal == 1.0) {
        currentTraceColor = red;
        //currentMessage.color = red;
        if (visibility) {
            distanceCarImg_Y.alpha = 0;
            distanceCarImg_R.alpha = 1;
            distanceCarImg_B.alpha = 0;

            distanceBarImg_Y.alpha = 0;
            distanceBarImg_R.alpha = 1;
            distanceBarImg_B.alpha = 0;
        } else {
            distanceCarImg_Y.alpha = 0;
            distanceCarImg_R.alpha = 0;
            distanceCarImg_B.alpha = 0;

            distanceBarImg_Y.alpha = 0;
            distanceBarImg_R.alpha = 0;
            distanceBarImg_B.alpha = 0;
        }

    } else {
        currentTraceColor = blue;
        //currentMessage.color = blue;
        if (visibility) {
            distanceCarImg_Y.alpha = 0;
            distanceCarImg_R.alpha = 0;
            distanceCarImg_B.alpha = 1;

            distanceBarImg_Y.alpha = 0;
            distanceBarImg_R.alpha = 0;
            distanceBarImg_B.alpha = 1;

        } else {
            distanceCarImg_Y.alpha = 0;
            distanceCarImg_R.alpha = 0;
            distanceCarImg_B.alpha = 0;

            distanceBarImg_Y.alpha = 0;
            distanceBarImg_R.alpha = 0;
            distanceBarImg_B.alpha = 0;
        }
    }

}
function addChildToStage(child) {
    zIndex++;
    stage.addChild(child);

}
function removeTrace() {
    stage.removeAllChildren();
    currentSpeed = currentMessage.currentSpeed;
    currentDistance = currentMessage.currentDistance;
    lastDistanceValue = 99999;
    currentSpeedLimit = currentMessage.currentSpeedLimit;
    nextSpeedLimit = currentMessage.nextSpeedLimit;
    gasPedal = currentMessage.gasPedal;
    brakePedal = currentMessage.brakePedal;
    zIndex = 0;
    idealLine = new createjs.Shape();
    addChildToStage(speedRect);
    addChildToStage(currentSpeedText);
    drawBG();
    addChildToStage(distanceBarImg_Y);
    addChildToStage(distanceBarImg_B);
    addChildToStage(distanceBarImg_R);
    addChildToStage(distanceCarImg_Y);
    addChildToStage(distanceCarImg_B);
    addChildToStage(distanceCarImg_R);
    traceLine.graphics.moveTo(distanceBarImg_Y.x, speedRect.y);
    updateSpeedo();
}
var isLastMessage = false;
function setNewDistance(message) {


    var visible = false;


    if (message.currentDistance <= MAXDISTANCE + DISTANCETOSHOWINDICATOR && message.currentDistance >= 0) {
        if (!speedLimitSignVisible) {
            dingSound.play();
            drawAmbientSpeedLimit(message.nextSpeedLimit);
            drawNewSpeedLimit(message.nextSpeedLimit);
            speedLimitSignVisible = true;
        }
        if (message.currentDistance <= MAXDISTANCE && message.currentDistance >= 0) {
            visible = true; // make only visible if approaching new sign
            if (speedWhenChallengeStarts == -1) {
                message.speedWhenChallengeOn = message.currentSpeed;
                speedWhenChallengeStarts = message.currentSpeed;
            }
        }
        if (message.currentDistance == 0) {
            // FIXME Test if server actually sends 0 here

            // TODO Be aware that the drawTraceLineSegment method needs to be called before renewing the Doublylist




            isLastMessage = true;
            message.speedWhenChallengeOff = message.currentSpeed;
            removeSpeedLimitSign();
            removeDistanceBar();
            removeDistanceCar();
            setTimeout(drawidealLine(message), 100);
            if (message.realtime)
                setTimeout(removeTrace, 3000);
            speedLimitSignVisible = false;


            // TODO eval performance properly with margin
            if(message.speedWhenChallengeOff >= message.nextSpeedLimit) {
                //fail
                failSound.play();

            } else {
                //win
                successSound.play();
            }

        }

    }

    var newDistanceBarPos = modulate(message.currentDistance, [MAXDISTANCE, 0], [0, CANVAS_WIDTH], true);

    setCarPos(newDistanceBarPos, (speedRect.y - 18 * 2));
    setBarPos(newDistanceBarPos, 0);

    setDrawingColor(visible, message);
    updateSpeedo();
    if (!message.realtime) {
        //currentTraceColor = message.color;
    }
    drawTraceLineSegment(message, currentTraceColor);
    if (isLastMessage == true) {

        isLastMessage = false;
        pastPerformanceTraces.add(receivedMessagesList);
        receivedMessagesList = new DoublyList();
    }


}

function setCarPos(x, y) {
    distanceCarImg_Y.x = x;
    distanceCarImg_Y.y = y;
    distanceCarImg_B.x = x;
    distanceCarImg_B.y = y;
    distanceCarImg_R.x = x;
    distanceCarImg_R.y = y;
}

function setBarPos(x, y) {
    distanceBarImg_Y.x = x;
    distanceBarImg_Y.y = y;
    distanceBarImg_B.x = x;
    distanceBarImg_B.y = y;
    distanceBarImg_R.x = x;
    distanceBarImg_R.y = y;
}

function updateSpeedo() {
    stage.update();
}

function drawidealLine(message) {

    idealLine.graphics.clear();
    idealLine.graphics.beginStroke(green);
    idealLine.graphics.setStrokeStyle(LINETHICKNESS / 2);


    var modulatedCurrentSpeedLimitY = modulate(message.speedWhenChallengeOn, [0, MAXSPEED], [2, CANVAS_HEIGHT], true);
    var currentSL_y = CANVAS_HEIGHT - modulatedCurrentSpeedLimitY - LINETHICKNESS / 3;
    idealLine.graphics.moveTo(0, currentSL_y);


    var modulatedNextSpeedLimitY = modulate(message.nextSpeedLimit, [0, MAXSPEED], [2, CANVAS_HEIGHT], true);
    var nextSL_y = CANVAS_HEIGHT - modulatedNextSpeedLimitY - LINETHICKNESS / 3;
    idealLine.graphics.lineTo(CANVAS_WIDTH, nextSL_y);

    addChildToStage(idealLine);
    updateSpeedo();
    setSpeedoRectColor(currentMessage); // make sure BG is red if too fast!
    speedWhenChallengeStarts = -1;

}

function drawTraceLineSegment(message, color) {
    var distance = message.currentDistance;
    distance = parseInt(distance);

    if (distance <= MAXDISTANCE && lastDistanceValue > distance) {


        if (distance == MAXDISTANCE) {
            lastDistanceBarX = distanceBarImg_Y.x;
            lastSpeedRectY = speedRect.y;
        } else {
            traceLine = new createjs.Shape();
            setScalingFactors("trace");
            traceLine.graphics.beginStroke(color);
            traceLine.graphics.moveTo(lastDistanceBarX, lastSpeedRectY);
            traceLine.graphics.lineTo(distanceBarImg_Y.x, speedRect.y);
            addChildToStage(traceLine);

            lastDistanceBarX = distanceBarImg_Y.x;
            lastSpeedRectY = speedRect.y;
        }

        var storeMessage = new receivedDataPacket();

        storeMessage.currentSpeed = currentMessage.currentSpeed;
        storeMessage.currentSpeedLimit = currentMessage.currentSpeedLimit;
        storeMessage.nextSpeedLimit = currentMessage.nextSpeedLimit;
        storeMessage.currentDistance = currentMessage.currentDistance;
        storeMessage.gasPedal = currentMessage.gasPedal;
        storeMessage.brakePedal = currentMessage.brakePedal;
        storeMessage.realtime = false;
        storeMessage.time = currentMessage.time;
        storeMessage.color = currentMessage.color;
        storeMessage.speedWhenChallengeOn = currentMessage.speedWhenChallengeOn;
        storeMessage.speedWhenChallengeOff = currentMessage.speedWhenChallengeOff;

        receivedMessagesList.add(storeMessage);


    }
    lastDistanceValue = distance;
}

function setSpeedoRectColor(message) {
    var currentSpeed = parseInt(message.currentSpeed);
    if (currentSpeed > message.currentSpeedLimit || (message.currentDistance == 0 && currentSpeed > message.nextSpeedLimit)) {
        speedRect.graphics.clear().beginFill(red).rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        speedRect.graphics.clear().beginFill(blue).rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
}

function setNewSpeed(message) {

    var valueInt = parseInt(message.currentSpeed);
    setSpeedoRectColor(message);
    currentSpeedText.text = valueInt;
    var newSpeedRectPos = modulate(message.currentSpeed, [0, MAXSPEED], [2, CANVAS_HEIGHT], true);
    speedRect.y = CANVAS_HEIGHT - newSpeedRectPos;

    if (message.currentSpeed < 10) {
        bgSpeedUnit.alpha = 0;
    } else if (message.currentSpeed == 10) {
        bgSpeedUnit.alpha = 0.1;
    } else if (message.currentSpeed == 11) {
        bgSpeedUnit.alpha = 0.2;
    }
    else if (message.currentSpeed == 12) {
        bgSpeedUnit.alpha = 0.4;
    }
    else if (message.currentSpeed == 13) {
        bgSpeedUnit.alpha = 0.6;

    }
    else if (message.currentSpeed == 14) {
        bgSpeedUnit.alpha = 0.8;
    }
    else if (message.currentSpeed >= 15) {
        bgSpeedUnit.alpha = 1;
    }
}

function drawBG() {

    var rowHeight = (CANVAS_HEIGHT / (MAXSPEED + 0) * 10); // only full pixels can be drawn
    var rowHeightSmooth = Math.round(rowHeight);

    for (var i = MAXSPEED - 10, j = 0; i >= 0; i -= 10, j++) {
        var bgRow = new createjs.Shape();
        var colorBG = (j % 2 == 0 ? bgGreyLight : bgGreyDark);
        if (i == 0)
            bgRow.graphics.beginFill(colorBG).rect(0, j * rowHeightSmooth, CANVAS_WIDTH, rowHeightSmooth + rowheightOffset);
        else
            bgRow.graphics.beginFill(colorBG).rect(0, j * rowHeightSmooth, CANVAS_WIDTH, rowHeightSmooth);

        rowheightOffset += rowHeight - rowHeightSmooth; // calculate rowHeightoffset

        if (i == 0) { // quick fix
            i = "00"
        }
        var colorTxt = (j % 2 == 0 ? bgGreyDarkFont : bgGreyLightFont);
        var bgSpeedText = new createjs.Text(i, "40px Roboto", colorTxt);
        bgSpeedText.x = CANVAS_WIDTH / 2;
        bgSpeedText.textAlign = "center";
        bgSpeedText.y = (j * rowHeight) + rowHeight / 4 - 5; // add font size to center


        stage.addChildAt(bgSpeedText, 0);
        stage.addChildAt(bgRow, 0); // 0 is the lowest layer
        zIndex += 2;
    }

    bgSpeedUnit.alpha = 0;
    bgSpeedUnit.x = CANVAS_WIDTH / 2;
    bgSpeedUnit.textAlign = "center";
    bgSpeedUnit.y = (11 * rowHeight) + rowHeight / 4 + 5;
    addChildToStage(bgSpeedUnit);

    stage.update();
}

function removeSpeedLimitSign() {

    stage.removeChild(newSpeedLimitCircle);
    stage.removeChild(newSpeedLimitText);
    stage.update();

}

function removeDistanceBar() {

    stage.removeChild(distanceBarImg_B);
    stage.removeChild(distanceBarImg_Y);
    stage.removeChild(distanceBarImg_R);
    stage.update();

}

function removeDistanceCar() {

    stage.removeChild(distanceCarImg_B);
    stage.removeChild(distanceCarImg_Y);
    stage.removeChild(distanceCarImg_R);
    stage.update();

}

function drawNewSpeedLimit(speedlimit) {


    var padding = 2;
    var newSpeedRectPos = modulate(speedlimit - 10, [0, MAXSPEED], [2, CANVAS_HEIGHT], true);
    var y = CANVAS_HEIGHT - newSpeedRectPos - SIGNSIZE_NORMAL;
    var x = CANVAS_WIDTH - (SIGNSIZE_NORMAL + padding);


    newSpeedLimitCircle.graphics.setStrokeStyle(1).beginStroke("rgba(0,0,0,0.8)").beginFill(red).drawCircle(x, y, SIGNSIZE_NORMAL).setStrokeStyle(0).beginStroke("rgba(0,0,0,0)").beginFill(white).drawCircle(x, y, SIGNSIZE_NORMAL * 0.8);

    newSpeedLimitText.text = speedlimit;
    newSpeedLimitText.x = x;
    newSpeedLimitText.y = y - (SIGNFONTSIZE_NORMAL / 2 + padding);
    newSpeedLimitText.textAlign = "center";
    stage.addChildAt(newSpeedLimitCircle, zIndex - 2);
    stage.addChildAt(newSpeedLimitText, zIndex - 1);
    stage.update();
}

function drawAmbientSpeedLimit(speedlimit) {

    var padding = 20;
    var y = CANVAS_HEIGHT / 2;
    var x = CANVAS_WIDTH / 2;


    ambientSpeedLimitCircle.graphics.setStrokeStyle(1).beginStroke("rgba(0,0,0,0.8)").beginFill(red).drawCircle(x, y, SIGNSIZE_AMBIENT).setStrokeStyle(0).beginStroke("rgba(0,0,0,0)").beginFill(white).drawCircle(x, y, SIGNSIZE_AMBIENT * 0.8);
    ambientSpeedLimitText.text = speedlimit;
    ambientSpeedLimitText.x = x;
    ambientSpeedLimitText.y = y - (SIGNFONTSIZE_AMBIENT / 2 + padding);
    ambientSpeedLimitText.textAlign = "center";
    stage.addChildAt(ambientSpeedLimitCircle, zIndex - 2);
    stage.addChildAt(ambientSpeedLimitText, zIndex - 1);
    stage.update();



}

function removeAmbientSpeedLimit() {


    stage.removeChild(ambientSpeedLimitText);
    stage.removeChild(ambientSpeedLimitCircle);
    stage.update();

}

function handleNewData(message) {

    //if (!message.realtime) {
    //    console.log("time: " + message.time + " - speed: " + message.currentSpeed + " - distance: " + message.currentDistance + " - gasPedal: " + message.gasPedal + " - brakePedal: " + message.brakePedal);
    //}

    isRealTime = message.realtime;

    setNewSpeed(message);

    //if (message.currentDistance < 0) {
    //    //message.currentDistance= 0;
    //}
    setNewDistance(message);
    updateSpeedo();
}