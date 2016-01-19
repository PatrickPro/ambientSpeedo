/**
 * Created by patrickpro on 18/01/2016.
 */
// http://code.tutsplus.com/articles/data-structures-with-javascript-singly-linked-list-and-doubly-linked-list--cms-23392


function Node(value) {
    this.data = value;
    this.previous = null;
    this.next = null;
}

function receivedDataPacket() {

    this.currentSpeed = 0;
    this.currentSpeedLimit = 0;
    this.nextSpeedLimit = 0;
    this.currentDistance = 0;
    this.gasPedal = 0;
    this.brakePedal = 0;
    this.time = 0;
    this.challengeisOn = false;
    this.color = null;

}


function dumpReceivedData() {

    for (i = 1; i < receivedData._length; i++) {
        var tmp = receivedData.getDataAt(i);
        console.log("time: " + tmp.time + " - speed: " + tmp.currentSpeed + " - distance: " + tmp.currentDistance + " - gasPedal: " + tmp.gasPedal + " - brakePedal: " + tmp.brakePedal);
    }


}

function replayMessages(data, replayDelay) {
    removeTrace();
    var tmpData = data;
    var dataLength = data._length;

    var i = 1;
    var ticker = createjs.Ticker;
    ticker.setInterval(replayDelay);
    ticker.addEventListener("tick", handleTick);


    function handleTick(event) {
        // Actions carried out each tick (aka frame)
        if (!event.paused) {
            // Actions carried out when the Ticker is not paused.
            var tmp = tmpData.getDataAt(i);
            handleNewData(tmp.currentSpeed, tmp.currentDistance);
            i++;

            if (i == dataLength + 1) { // remove if done with dataset
                ticker.removeAllEventListeners("tick");
            }
        }
    }


}

function dumpReceivedData() {

    for (i = 1; i < receivedData._length; i++) {
        var tmp = receivedData.getDataAt(i);
        console.log("time: " + tmp.time + " - speed: " + tmp.currentSpeed + " - distance: " + tmp.currentDistance + " - gasPedal: " + tmp.gasPedal + " - brakePedal: " + tmp.brakePedal);
    }


}


function promptForIP() {
    var newIP = prompt("Server IP Address", wsUrl);
    if (newIP != null && ValidateIPaddress(newIP)) {
        console.log("Manually set WS server IP to " + newIP);
        wsUrl = newIP;
    }

}


function DoublyList() {
    this._length = 0;
    this.head = null;
    this.tail = null;
}

DoublyList.prototype.add = function (value) {
    var node = new Node(value);


    if (this._length) {
        this.tail.next = node;
        node.previous = this.tail;
        this.tail = node;
    } else {
        this.head = node;
        this.tail = node;
    }

    this._length++;

    return node;
};

DoublyList.prototype.searchNodeAt = function (position) {
    var currentNode = this.head,
        length = this._length,
        count = 1,
        message = {failure: 'Failure: non-existent node in this list.'};

    // 1st use-case: an invalid position
    if (length === 0 || position < 1 || position > length) {
        throw new Error(message.failure);
    }

    // 2nd use-case: a valid position
    while (count < position) {
        currentNode = currentNode.next;
        count++;
    }

    return currentNode;
};


DoublyList.prototype.getDataAt = function (position) {
    var currentNode = this.head,
        length = this._length,
        count = 1,
        message = {failure: 'Failure: non-existent node in this list.'};

    // 1st use-case: an invalid position
    if (length === 0 || position < 1 || position > length) {
        throw new Error(message.failure);
    }

    // 2nd use-case: a valid position
    while (count < position) {
        currentNode = currentNode.next;
        count++;
    }

    return currentNode.data;
};

DoublyList.prototype.remove = function (position) {
    var currentNode = this.head,
        length = this._length,
        count = 1,
        message = {failure: 'Failure: non-existent node in this list.'},
        beforeNodeToDelete = null,
        nodeToDelete = null,
        deletedNode = null;

    // 1st use-case: an invalid position
    if (length === 0 || position < 1 || position > length) {
        throw new Error(message.failure);
    }

    // 2nd use-case: the first node is removed
    if (position === 1) {
        this.head = currentNode.next;

        // 2nd use-case: there is a second node
        if (this.head) { // maybe add ! back again
            this.head.previous = null;
            // 2nd use-case: there is no second node
        } else {
            this.tail = null;
        }

        // 3rd use-case: the last node is removed
    } else if (position === this._length) {
        this.tail = this.tail.previous;
        this.tail.next = null;
        // 4th use-case: a middle node is removed
    } else {
        while (count < position) {
            currentNode = currentNode.next;
            count++;
        }

        beforeNodeToDelete = currentNode.previous;
        nodeToDelete = currentNode;
        afterNodeToDelete = currentNode.next;

        beforeNodeToDelete.next = afterNodeToDelete;
        afterNodeToDelete.previous = beforeNodeToDelete;
        deletedNode = nodeToDelete;
        nodeToDelete = null;
    }

    this._length--;

    return message.success;
};

function ValidateIPaddress(ipaddress) {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
        return (true)
    }
    alert("You have entered an invalid IP address!");
    return (false)
}


// from FramerJS
function modulate(value, rangeA, rangeB, limit) {

    var fromHigh, fromLow, result, toHigh, toLow;
    if (limit == null) {
        limit = false;
    }
    fromLow = rangeA[0], fromHigh = rangeA[1];
    toLow = rangeB[0], toHigh = rangeB[1];
    result = toLow + (((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow));
    if (limit === true) {
        if (toLow < toHigh) {
            if (result < toLow) {
                return toLow;
            }
            if (result > toHigh) {
                return toHigh;
            }
        } else {
            if (result > toLow) {
                return toLow;
            }
            if (result < toHigh) {
                return toHigh;
            }
        }
    }
    return result;
}