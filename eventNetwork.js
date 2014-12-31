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
var EventNetwork = function(appBuses, serverBuses, chatServer) {
    this.channelStoreP =
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
            })
        // Pass join events to server, if we aren't already joined.
        //
        // This is why I needed current and channels in the same object,
        // altough I'm not convinced this is the right solution.
        .doAction(function(chanStore) {
            if (chanStore.current !== null
                    && chanStore.channels[chanStore.current] === undefined) {
                chatServer.joinChannel(chanStore.current);
            }
        });

    });

    this.currentChannelP = this.channelStoreP.scan(null, function(_, chanStore) {
        var curChan = null;
        if (typeof chanStore !== undefined && chanStore !== null &&
                chanStore.channels !== undefined) {
            var chan = chanStore.channels[chanStore.current];
            if (chan !== undefined) {
                curChan = chan;
            }
        }
        return curChan;
    });

    // Keep a list of available channels
    this.availableChannelsP = serverBuses.channelAvailable.scan([], function(acc, chan) {
        acc.push(chan);
        return acc;
    });

};
