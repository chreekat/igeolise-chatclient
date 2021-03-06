/* An API for talking to the server. Given a baconSocket and appropriate
 * endpoints, it will connect the right messages to the right endpoint, while
 * providing functions for sending messages out.
 */

var Server = function(serverBacon, buses) {
    // TODO: This should be asserted. Or, actually, there should be
    // warnings, and nonexistent elements should be given dummy buses.
    // buses should be all {
    //     channelAvailable: Bus,
    //     joinedChannel: Bus,
    //     userJoined: Bus,
    //     incomingMsg,
    //     userLeft,
    //     serverError,
    //     clientError
    // }

    var _sendData = function(obj) {
        serverBacon.socket.send(
            JSON.stringify(obj)
        );
    };

    // OUTPUT FUNCTIONS
    this.register = function(username) {
        _sendData({
            "$variant": "Register",
            user: {name: username}
        });
    };
    this.joinChannel = function(chan) {
        _sendData({
            "$variant": "JoinChannel",
            name: chan
        });
    };
    this.msg = function(chan, msg) {
        _sendData({
            "$variant": "Msg",
            channel: chan,
            message: msg
        });
    };
    this.leaveChannel = function(chan) {
        _sendData({
            "$variant": "LeaveChannel",
            name: chan
        });
    };

    // INPUT EVENTS
    serverBacon.bacon.onValue(function(msgEvent) {
        var {$variant, ...data} = JSON.parse(msgEvent.data);
        switch ($variant) {
        case "Channels":
            data.names.map(function(name) {
                buses.channelAvailable.push({name: name});
            });
            break;
        case "JoinChannel":
            buses.joinedChannel.push(data);
            break;
        case "Joined":
            buses.userJoined.push(data);
            break;
        case "ChannelCreated":
            buses.channelAvailable.push(data);
            break;
        case "Msg":
            buses.incomingMsg.push(data);
            break;
        case "Left":
            buses.userLeft.push(data);
            break;
        case "Error":
            buses.serverError.push(data.error);
            break;
        default:
            buses.clientError.push({
                // TODO: types, not strings
                type: "Unknown server message",
                unknownMessage: { "$variant": $variant, ...data }
            });
        }
    });

};
