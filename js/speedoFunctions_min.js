function openWebsocket(e,a){null!=ws&&ws.close(1e3);try{ws=new ReconnectingWebSocket("ws://"+e+":"+a+"/"),ws.automaticOpen=!0}catch(t){console.log("Error: "+t),currentSpeedText.text="WS Error."}ws.onmessage=function(e){var a=e.data.split(";");if(10==a.length){if(0==isRealTime&&removeTrace(),!a[8]>currentMessage.time)return void console.log("Old websocket msg received");lastDistanceToSign=currentMessage.currentDistance,lastSpeedLimit=currentMessage.currentSpeedLimit,currentMessage.currentSpeed=parseFloat(a[2]),currentMessage.currentSpeedLimit=parseInt(a[3]),currentMessage.nextSpeedLimit=parseInt(a[4]),currentMessage.currentDistance=parseFloat(a[5]),currentMessage.gasPedal=parseFloat(a[6]),currentMessage.brakePedal=parseFloat(a[7]),currentMessage.realtime=!0,currentMessage.time=parseFloat(a[8]),handleNewData(currentMessage)}else 2==a.length?"replay"==a[0]?replayMessages(pastPerformanceTraces,100,a[1]):console.log("Command not recognized: "+a[0]):1==a.length?(console.log(a[0]+" command received"),"dump"==a[0]?dumpReceivedData(receivedMessagesList):"replay"==a[0]?replayAllMessages(pastPerformanceTraces,100):console.log("Command not recognized: "+a[0])):console.log("Message length mismatch! Length: "+a.length+" msg: "+a);var t=document.getElementById("debugInfo");t.innerHTML="currentSpeed: "+currentMessage.currentSpeed+" - currentDistance: "+currentMessage.currentDistance+" - lastDistance: "+currentMessage.lastDistanceValue+" - currentSpeedLimit: "+currentMessage.currentSpeedLimit+" - nextSpeedLimit: "+currentMessage.nextSpeedLimit+" - gasPedal: "+currentMessage.gasPedal+" - brakePedal: "+currentMessage.brakePedal+" - IP: "+wsUrl},ws.onclose=function(){console.log("WS closed"),ws=new WebSocket("ws://"+wsUrl+":"+wsPort+"/")},ws.onopen=function(){console.log("WS connected ("+wsUrl+":"+wsPort+")")},ws.onerror=function(e){console.log("WS error: "+e)}}function init(){document.body.style.background=grey,document.getElementById("speedoCanvas").addEventListener("click",function(){if(clickCount++,clickCount%5==0){document.getElementById("debugInfo").style.display="block";var e=document.getElementById("debugInfo");e.innerHTML="currentSpeed: "+currentSpeed+" - currentDistance: "+currentDistance+" - lastDistance: "+lastDistanceValue+" - currentSpeedLimit: "+currentSpeedLimit+" - nextSpeedLimit: "+nextSpeedLimit+" - gasPedal: "+gasPedal+" - brakePedal: "+brakePedal+" - IP: "+wsUrl}else document.getElementById("debugInfo").style.display="none";if(clickCount%11==0){promptForIP(),openWebsocket(wsUrl,wsPort);var a=prompt("MAXSPEED",MAXSPEED);null!=a&&a>0&&9e3>a&&(MAXSPEED=parseInt(a),console.log("Manually set MAXSPEED to "+MAXSPEED));var t=prompt("MAXDISTANCE",MAXDISTANCE);null!=t&&t>0&&9e3>t&&(MAXDISTANCE=parseInt(t),console.log("Manually set MAXDISTANCE to "+MAXDISTANCE));var r=prompt("LINETHICKNESS",LINETHICKNESS);null!=r&&r>0&&9e3>r&&(LINETHICKNESS=parseInt(r),console.log("Manually set LINETHICKNESS to "+LINETHICKNESS));var n=prompt("CARSCALE",CARSCALE);null!=n&&n>0&&9e3>n&&(CARSCALE=parseInt(n),console.log("Manually set CARSCALE to "+CARSCALE));var s=prompt("BARSCALE",BARSCALE);null!=s&&s>0&&9e3>s&&(BARSCALE=parseInt(s),console.log("Manually set BARSCALE to "+BARSCALE)),setScalingFactors("distance"),removeTrace()}clickCount>100&&(clickCount=0)}),setupCanvas()}function setScalingFactors(e){"distance"==e?(distanceCarImg_Y.scaleX=CARSCALE,distanceCarImg_Y.scaleY=CARSCALE,distanceCarImg_B.scaleX=CARSCALE,distanceCarImg_B.scaleY=CARSCALE,distanceCarImg_R.scaleX=CARSCALE,distanceCarImg_R.scaleY=CARSCALE,distanceBarImg_Y.scaleX=BARSCALE,distanceBarImg_Y.scaleY=BARSCALE,distanceBarImg_B.scaleX=BARSCALE,distanceBarImg_B.scaleY=BARSCALE,distanceBarImg_R.scaleX=BARSCALE,distanceBarImg_R.scaleY=BARSCALE):"trace"==e&&traceLine.graphics.setStrokeStyle(LINETHICKNESS)}function setupCanvas(){stage=new createjs.Stage("speedoCanvas"),speedRect.graphics.beginFill("DeepSkyBlue").rect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT),speedRect.alpha=.6,speedRect.y=CANVAS_HEIGHT-2,addChildToStage(speedRect),currentSpeedText.x=CANVAS_WIDTH/2,currentSpeedText.y=CANVAS_HEIGHT/2,currentSpeedText.textAlign="center",addChildToStage(currentSpeedText),currentSpeedText.text="Connecting...",drawBG(),distanceCarImg_Y=new createjs.Bitmap("images/yellowCar.png"),distanceCarImg_B=new createjs.Bitmap("images/blueCar.png"),distanceCarImg_R=new createjs.Bitmap("images/redCar.png"),distanceCarImg_Y.regX=distanceCarImg_WIDTH/2,distanceCarImg_Y.alpha=0,distanceCarImg_B.regX=distanceCarImg_WIDTH/2,distanceCarImg_B.alpha=0,distanceCarImg_R.regX=distanceCarImg_WIDTH/2,distanceCarImg_R.alpha=0,distanceBarImg_Y=new createjs.Bitmap("images/yellowBar.png"),distanceBarImg_Y.regX=distanceBarImg_WIDTH/2,distanceBarImg_Y.alpha=0,distanceBarImg_B=new createjs.Bitmap("images/blueBar.png"),distanceBarImg_B.regX=distanceBarImg_WIDTH/2,distanceBarImg_B.alpha=0,distanceBarImg_R=new createjs.Bitmap("images/redBar.png"),distanceBarImg_R.regX=distanceBarImg_WIDTH/2,distanceBarImg_R.alpha=0,setScalingFactors("distance"),addChildToStage(distanceCarImg_Y),addChildToStage(distanceCarImg_R),addChildToStage(distanceCarImg_B),addChildToStage(distanceBarImg_Y),addChildToStage(distanceBarImg_B),addChildToStage(distanceBarImg_R)}function setDrawingColor(e,a){a.gasPedal>0&&0==a.brakePedal?(currentTraceColor=yellow,e?(distanceCarImg_Y.alpha=1,distanceCarImg_R.alpha=0,distanceCarImg_B.alpha=0,distanceBarImg_Y.alpha=1,distanceBarImg_R.alpha=0,distanceBarImg_B.alpha=0):(distanceCarImg_Y.alpha=0,distanceCarImg_R.alpha=0,distanceCarImg_B.alpha=0,distanceBarImg_Y.alpha=0,distanceBarImg_R.alpha=0,distanceBarImg_B.alpha=0)):0==a.gasPedal&&a.brakePedal>0?(currentTraceColor=red,e?(distanceCarImg_Y.alpha=0,distanceCarImg_R.alpha=1,distanceCarImg_B.alpha=0,distanceBarImg_Y.alpha=0,distanceBarImg_R.alpha=1,distanceBarImg_B.alpha=0):(distanceCarImg_Y.alpha=0,distanceCarImg_R.alpha=0,distanceCarImg_B.alpha=0,distanceBarImg_Y.alpha=0,distanceBarImg_R.alpha=0,distanceBarImg_B.alpha=0)):(currentTraceColor=blue,e?(distanceCarImg_Y.alpha=0,distanceCarImg_R.alpha=0,distanceCarImg_B.alpha=1,distanceBarImg_Y.alpha=0,distanceBarImg_R.alpha=0,distanceBarImg_B.alpha=1):(distanceCarImg_Y.alpha=0,distanceCarImg_R.alpha=0,distanceCarImg_B.alpha=0,distanceBarImg_Y.alpha=0,distanceBarImg_R.alpha=0,distanceBarImg_B.alpha=0))}function addChildToStage(e){zIndex++,stage.addChild(e)}function removeTrace(){stage.removeAllChildren(),currentSpeed=currentMessage.currentSpeed,currentDistance=currentMessage.currentDistance,lastDistanceValue=99999,currentSpeedLimit=currentMessage.currentSpeedLimit,nextSpeedLimit=currentMessage.nextSpeedLimit,gasPedal=currentMessage.gasPedal,brakePedal=currentMessage.brakePedal,zIndex=0,idealLine=new createjs.Shape,addChildToStage(speedRect),addChildToStage(currentSpeedText),drawBG(),addChildToStage(distanceBarImg_Y),addChildToStage(distanceBarImg_B),addChildToStage(distanceBarImg_R),addChildToStage(distanceCarImg_Y),addChildToStage(distanceCarImg_B),addChildToStage(distanceCarImg_R),traceLine.graphics.moveTo(0,speedRect.y),updateSpeedo()}function setNewDistance(e){var a=!1;e.currentDistance<=MAXDISTANCE+DISTANCETOSHOWINDICATOR&&e.currentDistance>=0&&e.currentSpeedLimit>e.nextSpeedLimit&&(!speedLimitSignVisible&&e.currentDistance>100&&(dingSound.play(),drawAmbientSpeedLimit(e.nextSpeedLimit),drawNewSpeedLimit(e.nextSpeedLimit),speedLimitSignVisible=!0),e.currentDistance<=MAXDISTANCE&&(a=!0,-1==speedWhenChallengeStarts&&(e.speedWhenChallengeOn=e.currentSpeed,speedWhenChallengeStarts=e.currentSpeed)));var t=!1;if(parseInt(e.currentSpeedLimit)!=parseInt(lastSpeedLimit)&&0!=parseInt(lastSpeedLimit)&&parseInt(e.currentSpeedLimit)<parseInt(lastSpeedLimit)&&(t=!0,e.currentDistance=0),t&&(isLastMessage=!0,e.speedWhenChallengeOff=e.currentSpeed,removeSpeedLimitSign(),removeDistanceBar(),removeDistanceCar(),e.realtime&&setTimeout(removeTrace,TIMETOSHOWTRACES),speedLimitSignVisible=!1,parseInt(e.speedWhenChallengeOff)>parseInt(e.currentSpeedLimit)?failSound.play():successSound.play()),e.currentSpeedLimit>e.nextSpeedLimit&&1==speedLimitSignVisible){var r=modulate(e.currentDistance,[MAXDISTANCE,0],[0,CANVAS_WIDTH],!0);setCarPos(r,speedRect.y-36),setBarPos(r,0),setDrawingColor(a,e),updateSpeedo(),drawTraceLineSegment(e,currentTraceColor)}else{if(t){var r=modulate(e.currentDistance,[MAXDISTANCE,0],[0,CANVAS_WIDTH],!0);setCarPos(r,speedRect.y-36),setBarPos(r,0),setDrawingColor(a,e),updateSpeedo(),drawTraceLineSegment(e,currentTraceColor),drawidealLine(e)}setCarPos(5e3,speedRect.y-36),setBarPos(5e3,0),updateSpeedo()}1==isLastMessage&&(isLastMessage=!1,pastPerformanceTraces.add(receivedMessagesList),receivedMessagesList=new DoublyList)}function setCarPos(e,a){distanceCarImg_Y.x=e,distanceCarImg_Y.y=a,distanceCarImg_B.x=e,distanceCarImg_B.y=a,distanceCarImg_R.x=e,distanceCarImg_R.y=a}function setBarPos(e,a){distanceBarImg_Y.x=e,distanceBarImg_Y.y=a,distanceBarImg_B.x=e,distanceBarImg_B.y=a,distanceBarImg_R.x=e,distanceBarImg_R.y=a}function updateSpeedo(){stage.update()}function drawidealLine(e){idealLine.graphics.clear(),idealLine.graphics.beginStroke(green),idealLine.graphics.setStrokeStyle(LINETHICKNESS/2);var a=modulate(e.speedWhenChallengeOn,[0,MAXSPEED],[2,CANVAS_HEIGHT],!0),t=CANVAS_HEIGHT-a-LINETHICKNESS/3;idealLine.graphics.moveTo(0,t);var r=modulate(e.currentSpeedLimit,[0,MAXSPEED],[2,CANVAS_HEIGHT],!0),n=CANVAS_HEIGHT-r-LINETHICKNESS/3;idealLine.graphics.lineTo(CANVAS_WIDTH,n),addChildToStage(idealLine),updateSpeedo(),setSpeedoRectColor(currentMessage),speedWhenChallengeStarts=-1}function drawTraceLineSegment(e,a){var t=e.currentDistance;if(t=parseInt(t),t>=MAXDISTANCE&&(lastDistanceBarX=distanceBarImg_Y.x,lastSpeedRectY=speedRect.y),MAXDISTANCE>=t&&lastDistanceValue>t){removeAmbientSpeedLimit(),t==MAXDISTANCE?(lastDistanceBarX=distanceBarImg_Y.x,lastSpeedRectY=speedRect.y):(traceLine=new createjs.Shape,setScalingFactors("trace"),traceLine.graphics.beginStroke(a),traceLine.graphics.moveTo(lastDistanceBarX,lastSpeedRectY),traceLine.graphics.lineTo(distanceBarImg_Y.x,speedRect.y),addChildToStage(traceLine),lastDistanceBarX=distanceBarImg_Y.x,lastSpeedRectY=speedRect.y);var r=new receivedDataPacket;r.currentSpeed=currentMessage.currentSpeed,r.currentSpeedLimit=currentMessage.currentSpeedLimit,r.nextSpeedLimit=currentMessage.nextSpeedLimit,r.currentDistance=currentMessage.currentDistance,r.gasPedal=currentMessage.gasPedal,r.brakePedal=currentMessage.brakePedal,r.realtime=!1,r.time=currentMessage.time,r.color=currentMessage.color,r.speedWhenChallengeOn=currentMessage.speedWhenChallengeOn,r.speedWhenChallengeOff=currentMessage.speedWhenChallengeOff,receivedMessagesList.add(r)}lastDistanceValue=t}function setSpeedoRectColor(e){var a=parseInt(e.currentSpeed);a>e.currentSpeedLimit?speedRect.graphics.clear().beginFill(red).rect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT):speedRect.graphics.clear().beginFill(blue).rect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT)}function setNewSpeed(e){var a=parseInt(e.currentSpeed);setSpeedoRectColor(e),currentSpeedText.text=a;var t=modulate(e.currentSpeed,[0,MAXSPEED],[2,CANVAS_HEIGHT],!0);speedRect.y=CANVAS_HEIGHT-t,e.currentSpeed<10?bgSpeedUnit.alpha=0:10==e.currentSpeed?bgSpeedUnit.alpha=.1:11==e.currentSpeed?bgSpeedUnit.alpha=.2:12==e.currentSpeed?bgSpeedUnit.alpha=.4:13==e.currentSpeed?bgSpeedUnit.alpha=.6:14==e.currentSpeed?bgSpeedUnit.alpha=.8:e.currentSpeed>=15&&(bgSpeedUnit.alpha=1)}function drawBG(){for(var e=CANVAS_HEIGHT/(MAXSPEED+0)*10,a=Math.round(e),t=MAXSPEED-10,r=0;t>=0;t-=10,r++){var n=new createjs.Shape,s=r%2==0?bgGreyLight:bgGreyDark;0==t?n.graphics.beginFill(s).rect(0,r*a,CANVAS_WIDTH,a+rowheightOffset):n.graphics.beginFill(s).rect(0,r*a,CANVAS_WIDTH,a),rowheightOffset+=e-a,0==t&&(t="00");var i=r%2==0?bgGreyDarkFont:bgGreyLightFont,d=new createjs.Text(t,"40px Roboto",i);d.x=CANVAS_WIDTH/2,d.textAlign="center",d.y=r*e+e/4-5,stage.addChildAt(d,0),stage.addChildAt(n,0),zIndex+=2}bgSpeedUnit.alpha=0,bgSpeedUnit.x=CANVAS_WIDTH/2,bgSpeedUnit.textAlign="center",bgSpeedUnit.y=11*e+e/4+5,addChildToStage(bgSpeedUnit),stage.update()}function removeSpeedLimitSign(){stage.removeChild(newSpeedLimitCircle),stage.removeChild(newSpeedLimitText),stage.update()}function removeDistanceBar(){stage.removeChild(distanceBarImg_B),stage.removeChild(distanceBarImg_Y),stage.removeChild(distanceBarImg_R),stage.update()}function removeDistanceCar(){stage.removeChild(distanceCarImg_B),stage.removeChild(distanceCarImg_Y),stage.removeChild(distanceCarImg_R),stage.update()}function drawNewSpeedLimit(e){var a=2,t=modulate(e-10,[0,MAXSPEED],[2,CANVAS_HEIGHT],!0),r=CANVAS_HEIGHT-t-SIGNSIZE_NORMAL,n=CANVAS_WIDTH-(SIGNSIZE_NORMAL+a);newSpeedLimitCircle.graphics.clear().setStrokeStyle(1).beginStroke("rgba(0,0,0,0.8)").beginFill(red).drawCircle(n,r,SIGNSIZE_NORMAL).setStrokeStyle(0).beginStroke("rgba(0,0,0,0)").beginFill(white).drawCircle(n,r,.8*SIGNSIZE_NORMAL),newSpeedLimitText.text=e,newSpeedLimitText.x=n,newSpeedLimitText.y=r-(SIGNFONTSIZE_NORMAL/2+a),newSpeedLimitText.textAlign="center",stage.addChildAt(newSpeedLimitCircle,zIndex-2),stage.addChildAt(newSpeedLimitText,zIndex-1),stage.update()}function drawAmbientSpeedLimit(e){var a=20,t=CANVAS_HEIGHT/2,r=CANVAS_WIDTH/2;ambientSpeedLimitCircle.graphics.setStrokeStyle(1).beginStroke("rgba(0,0,0,0.8)").beginFill(red).drawCircle(r,t,SIGNSIZE_AMBIENT).setStrokeStyle(0).beginStroke("rgba(0,0,0,0)").beginFill(white).drawCircle(r,t,.8*SIGNSIZE_AMBIENT),ambientSpeedLimitText.text=e,ambientSpeedLimitText.x=r,ambientSpeedLimitText.y=t-(SIGNFONTSIZE_AMBIENT/2+a),ambientSpeedLimitText.textAlign="center",stage.addChildAt(ambientSpeedLimitCircle,zIndex-2),stage.addChildAt(ambientSpeedLimitText,zIndex-1),stage.update()}function removeAmbientSpeedLimit(){stage.removeChild(ambientSpeedLimitText),stage.removeChild(ambientSpeedLimitCircle),stage.update()}function handleNewData(e){isRealTime=e.realtime,setNewSpeed(e),setNewDistance(e),updateSpeedo()}var isAndroid=/(android)/i.test(navigator.userAgent),ws=null,wsUrl="127.0.0.1",wsPort="4080",MAXSPEED=120,MAXDISTANCE=200,LINETHICKNESS=15,CARSCALE=2,BARSCALE=15,DISTANCETOSHOWINDICATOR=50,TIMETOSHOWTRACES=3e3,CANVAS_WIDTH=1280,CANVAS_HEIGHT=720,SIGNSIZE_NORMAL=CANVAS_HEIGHT/MAXSPEED*10/2,SIGNSIZE_AMBIENT=300,SIGNFONTSIZE_NORMAL=SIGNSIZE_NORMAL+10,SIGNFONTSIZE_AMBIENT=400,lastDistanceToSign=0,lastSpeedLimit=0,clickCount=0,white="#ffffff",lightgrey="#c9c8c8",grey="#333132",blue="#0e95e6",green="#2ad880",red="#fc5454",orange="#ff8948",yellow="#c1ba79",black="#000000",bgGreyDark="#333132",bgGreyLight="#393738",bgGreyDarkFont="#2d2c2d",bgGreyLightFont="#413f40",currentTraceColor=red,zIndex=0,stage=null,currentSpeedText=new createjs.Text("ERROR","160px Roboto",lightgrey),bgSpeedUnit=new createjs.Text("KM/H","20px Roboto",lightgrey),speedRect=new createjs.Shape,traceLine=new createjs.Shape,idealLine=new createjs.Shape,newSpeedLimitCircle=new createjs.Shape,newSpeedLimitText=new createjs.Text("",SIGNFONTSIZE_NORMAL+"px Roboto",black),ambientSpeedLimitCircle=new createjs.Shape,ambientSpeedLimitText=new createjs.Text("",SIGNFONTSIZE_AMBIENT+"px Roboto",black),currentSpeed=0,currentDistance=280,lastDistanceValue=99999,currentSpeedLimit=80,nextSpeedLimit=60,gasPedal=0,brakePedal=0,speedWhenChallengeStarts=-1,lastDistanceBarX=null,lastSpeedRectY=null,distanceCarImg_Y=null,distanceCarImg_B=null,distanceCarImg_R=null,distanceBarImg_Y=null,distanceBarImg_B=null,distanceBarImg_R=null,distanceCarImg_WIDTH=63,distanceBarImg_WIDTH=2,speedLimitSignVisible=!1,rowheightOffset=0,currentMessage=new receivedDataPacket,receivedMessagesList=new DoublyList,pastPerformanceTraces=new DoublyList,isRealTime=!1,dingSound=new Howl({src:["sounds/ding.mp3"],preload:!0,onend:function(){}}),successSound=new Howl({src:["sounds/success.mp3"],preload:!0,onend:function(){}}),failSound=new Howl({src:["sounds/fail.mp3"],preload:!0,onend:function(){}});$(document).ready(function(){$.get("http://rg.proppe.me/ipaddress",function(e){null!=e&&ValidateIPaddress(e)?(wsUrl=e,console.log("Automatically set WS server IP to "+e),currentSpeedText.text=e,updateSpeedo(),openWebsocket(wsUrl,wsPort)):(promptForIP(),openWebsocket(wsUrl,wsPort))})});var isLastMessage=!1;