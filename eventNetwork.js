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
    channelStoreP: function(serverBuses) {
        // joinedChannel
        return serverBuses.joinedChannel
        .scan({}, function(chanStore, chan) {
            chanStore[chan.name] = chan
            return chanStore;
        })
        // incomingMsg
        .flatMapLatest(function(chanStore) {
            return serverBuses.incomingMsg.scan(chanStore, function(chanStore, m) {
                chanStore[m.channel].messages.push(m.message);
                return chanStore;
            });
        })
        // userJoined
        .flatMapLatest(function(chanStore) {
            return serverBuses.userJoined.scan(chanStore, function(chanStore, u) {
                chanStore[u.channel].users.push(u.user);
                return chanStore;
            });
        })
        // userLeft
        .flatMapLatest(function(chanStore) {
            return serverBuses.userLeft.scan(chanStore, function(chanStore, u) {
                var userList = chanStore[u.channel].users;
                var idx = findIndex.call(userList, function(user) {
                    return user.name === u.user.name;
                });
                if (idx >= 0) {
                    userList.splice(idx, 1);
                }
                return chanStore;
            });
        })
        ;
    }
};
