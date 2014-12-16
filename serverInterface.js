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
    //     channelCreated,
    //     incomingMsg,
    //     userLeft,
    //     serverError,
    //     clientError
    // }

    var TheServer = {};

    var _sendData = function(obj) {
        serverBacon.socket.send(
            JSON.stringify(obj)
        );
    };

    // OUTPUT FUNCTIONS
    TheServer.register = function(username) {
        _sendData({
            "$variant": "Register",
            user: {name: username}
        });
    };
    TheServer.joinChannel = function(chan) {
        _sendData({
            "$variant": "JoinChannel",
            name: chan
        });
    };
    TheServer.msg = function(chan, msg) {
        _sendData({
            "$variant": "Msg",
            channel: chan,
            message: msg
        });
    };
    TheServer.leaveChannel = function(chan) {
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
                buses.channelAvailable.push(name);
            });
            break;
        case "JoinChannel":
            buses.joinedChannel.push(data);
            break;
        case "Joined":
            buses.userJoined.push(data);
            break;
        case "ChannelCreated":
            buses.channelCreated.push(data);
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

    return TheServer;
};
