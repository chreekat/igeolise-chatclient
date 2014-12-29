var findIndex = function(predicate) {
    var i;
    for(i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
            return i;
        }
    }
    return -1;
};

// 1. The store itself is modified on channelAvailable and joinChannel events.
// 2. Store elements are modified on userJoined, userLeft, and incomingMsg.
var EventNetwork = function(appBuses, serverBuses) {
    var channelStoreP =
        // server.joinedChannel
        serverBuses.joinedChannel
        .scan({current: null, channels:{}}, function(chanStore, chan) {
            chanStore.channels[chan.name] = chan;
            return chanStore;
        })
        // app.joinChannel
        .flatMapLatest(function(chanStore) {
            return appBuses.joinChannel.scan(chanStore, function(chanStore, jchan) {
                chanStore.current = jchan;
                return chanStore;
            });
        })
        // incomingMsg
        .flatMapLatest(function(chanStore) {
            return serverBuses.incomingMsg.scan(chanStore, function(chanStore, m) {
                chanStore.channels[m.channel].messages.push(m.message);
                return chanStore;
            });
        })
        // userJoined
        .flatMapLatest(function(chanStore) {
            return serverBuses.userJoined.scan(chanStore, function(chanStore, u) {
                chanStore.channels[u.channel].users.push(u.user);
                return chanStore;
            });
        })
        // userLeft
        .flatMapLatest(function(chanStore) {
            return serverBuses.userLeft.scan(chanStore, function(chanStore, u) {
                var userList = chanStore.channels[u.channel].users;
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
    return {
        channelStoreP: channelStoreP
    };
};
