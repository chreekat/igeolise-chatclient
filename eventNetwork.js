var findIndex = function(predicate) {
    var i;
    for(i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
            return i;
        }
    }
    return -1;
};

// Also keep a list of joined channels. We get modifier events for joined
// channels, so this becomes slightly complicated.
// 1. The list itself is modified on channelAvailable events.
// 2. List elements are modified on userJoined, userLeft, and incomingMsg.
var EventNetwork = {
    joinedChannelsP: function(serverBuses) {
        // joinedChannel
        return serverBuses.joinedChannel
        .scan({}, function(chanMap, chan) {
            chanMap[chan.name] = chan
            return chanMap;
        })
        // incomingMsg
        .flatMapLatest(function(chanMap) {
            return serverBuses.incomingMsg.scan(chanMap, function(chanMap, m) {
                chanMap[m.channel].messages.push(m.message);
                return chanMap;
            });
        })
        // userJoined
        .flatMapLatest(function(chanMap) {
            return serverBuses.userJoined.scan(chanMap, function(chanMap, u) {
                chanMap[u.channel].users.push(u.user);
                return chanMap;
            });
        })
        // userLeft
        .flatMapLatest(function(chanMap) {
            return serverBuses.userLeft.scan(chanMap, function(chanMap, u) {
                var userList = chanMap[u.channel].users;
                var idx = findIndex.call(userList, function(user) {
                    return user.name === u.user.name;
                });
                if (idx >= 0) {
                    userList.splice(idx, 1);
                }
                return chanMap;
            });
        })
        ;
    }
};
