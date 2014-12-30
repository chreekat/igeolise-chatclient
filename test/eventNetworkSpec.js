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
            userLeft: new Bacon.Bus()
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
});
