describe("findIndex", function () {
    it("works", function() {
        var x = [1,2,3,4];
        expect(findIndex.call(x, function(el) {return el === 2}))
        .toBe(1);
        expect(findIndex.call(x, function(el) {return el === 18}))
        .toBe(-1);
    });
});

describe("EventNetwork", function() {
    var appBuses, serverBuses, chansP;

    beforeEach(function() {
        appBuses = {
            joinChannel: new Bacon.Bus()
        };
        serverBuses = {
            joinedChannel: new Bacon.Bus(),
            incomingMsg: new Bacon.Bus(),
            userJoined: new Bacon.Bus(),
            userLeft: new Bacon.Bus(),
            channelAvailable: new Bacon.Bus()
        };
        eventNetwork = EventNetwork(appBuses, serverBuses);
    });

    describe("channelStoreP", function() {
        var chansP;

        beforeEach(function() {
            chansP = eventNetwork.channelStoreP;
        });

        it("reacts to serverBuses.joinedChannel", function(done) {
            chansP.skip(1).onValue(function(chans) {
                expect(chans.channels.asgard).toBeDefined();
                done();
            });
            serverBuses.joinedChannel.push({name: "asgard"});
        });

        it('reacts to appBuses.joinChannel', function(done) {
            chansP.skip(1).onValue(function(chans) {
                expect(chans.current).toEqual("midgard");
                done();
            });
            appBuses.joinChannel.push("midgard");
        });

        it("reacts to serverBuses.incomingMsg", function(done) {
            chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.asgard.messages).toEqual([
                    {user: {name: "tyr"}, stamp: 141708891560, text: "Aah"}
                ]);
                done();
            });
            serverBuses.joinedChannel.push({name: "asgard", messages: []});
            serverBuses.incomingMsg.push({
                channel: "asgard",
                message: {
                    user: {name: "tyr"}, stamp: 141708891560, text: "Aah"
                }
            });
        });

        it("reacts to serverBuses.userJoined", function(done) {
            chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.asgard.users).toEqual([
                    {name: "tyr"},
                    {name: "ratatoskr"}
                ]);
                done();
            });
            serverBuses.joinedChannel.push({name: "asgard", users: [{name: "tyr"}]});
            serverBuses.userJoined.push({
                channel: "asgard",
                user: {name: "ratatoskr"}
            });
        });

        it("reacts to serverBuses.userLeft", function(done) {
            chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.asgard.users).toEqual([
                    {name: "tyr"},
                    {name: "ratatoskr"},
                    {name: "woden"}
                ]);
                done();
            });
            serverBuses.joinedChannel.push({
                name: "asgard",
                users: [
                    {name: "tyr"},
                    {name: "that other guy"},
                    {name: "ratatoskr"},
                    {name: "woden"}
                ]
            });
            serverBuses.userLeft.push({
                channel: "asgard",
                user: {name: "that other guy"}
            });
        });
    });

    describe("currentChannelP", function() {
        var curChanP;

        beforeEach(function() {
            curChanP = eventNetwork.currentChannelP;
        });

        it("switches from null to chan when it becomes available",
                function(done) {
            eventNetwork.currentChannelP
                .skip(2).slidingWindow(2,2)
                .onValue(function(curChans) {
                    var beforeJoin = curChans[0],
                        afterJoin = curChans[1];
                    expect(beforeJoin).toBeNull();
                    expect(afterJoin.name).toEqual("asgard");
                    done();
                });
            appBuses.joinChannel.push("asgard");
            serverBuses.joinedChannel.push({name: "asgard"});
        });

        it("switches from chan to null when it isn't available",
                function(done) {
            eventNetwork.currentChannelP
                .skip(3).slidingWindow(2,2)
                .onValue(function(curChans) {
                    var before2ndJoin = curChans[0],
                        after2ndJoin = curChans[1];
                    expect(before2ndJoin.name).toEqual("asgard");
                    expect(after2ndJoin).toBeNull();
                    done();
                });
            appBuses.joinChannel.push("asgard");
            serverBuses.joinedChannel.push({name: "asgard"});
            appBuses.joinChannel.push("midgard");
        });
    });

    describe("server comms", function() {
        it("forwards channel joins");
        it("doesn't forward channel join if already joined");
        it("forwards messages");
        it("joins main when it becomes available");
    });
});
