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
    beforeEach(function() {
        this.appBuses = {
            joinChannel: new Bacon.Bus()
        };
        this.serverBuses = {
            joinedChannel: new Bacon.Bus(),
            incomingMsg: new Bacon.Bus(),
            userJoined: new Bacon.Bus(),
            userLeft: new Bacon.Bus(),
            channelAvailable: new Bacon.Bus()
        };
        this.serverSpy = jasmine.createSpyObj("server", ["joinChannel"]);
        this.eventNetwork = new EventNetwork(
            this.appBuses, this.serverBuses, this.serverSpy);
    });

    describe("channelStoreP", function() {
        beforeEach(function() {
            this.chansP = this.eventNetwork.channelStoreP;
        });

        it("reacts to serverBuses.joinedChannel", function(done) {
            this.chansP.skip(1).onValue(function(chans) {
                expect(chans.channels.asgard).toBeDefined();
                done();
            });
            this.serverBuses.joinedChannel.push({name: "asgard"});
        });

        it('reacts to appBuses.joinChannel', function(done) {
            this.chansP.skip(1).onValue(function(chans) {
                expect(chans.current).toEqual("midgard");
                done();
            });
            this.appBuses.joinChannel.push("midgard");
        });

        it("reacts to serverBuses.incomingMsg", function(done) {
            this.chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.asgard.messages).toEqual([
                    {user: {name: "tyr"}, stamp: 141708891560, text: "Aah"}
                ]);
                done();
            });
            this.serverBuses.joinedChannel.push({name: "asgard", messages: []});
            this.serverBuses.incomingMsg.push({
                channel: "asgard",
                message: {
                    user: {name: "tyr"}, stamp: 141708891560, text: "Aah"
                }
            });
        });

        it("reacts to serverBuses.userJoined", function(done) {
            this.chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.asgard.users).toEqual([
                    {name: "tyr"},
                    {name: "ratatoskr"}
                ]);
                done();
            });
            this.serverBuses.joinedChannel.push({name: "asgard", users: [{name: "tyr"}]});
            this.serverBuses.userJoined.push({
                channel: "asgard",
                user: {name: "ratatoskr"}
            });
        });

        it("reacts to serverBuses.userLeft", function(done) {
            this.chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.asgard.users).toEqual([
                    {name: "tyr"},
                    {name: "ratatoskr"},
                    {name: "woden"}
                ]);
                done();
            });
            this.serverBuses.joinedChannel.push({
                name: "asgard",
                users: [
                    {name: "tyr"},
                    {name: "that other guy"},
                    {name: "ratatoskr"},
                    {name: "woden"}
                ]
            });
            this.serverBuses.userLeft.push({
                channel: "asgard",
                user: {name: "that other guy"}
            });
        });
    });

    describe("currentChannelP", function() {
        beforeEach(function() {
            this.curChanP = this.eventNetwork.currentChannelP;
        });

        it("switches from null to chan when it becomes available",
                function(done) {
            this.curChanP
                .skip(2).slidingWindow(2,2)
                .onValue(function(curChans) {
                    var beforeJoin = curChans[0],
                        afterJoin = curChans[1];
                    expect(beforeJoin).toBeNull();
                    expect(afterJoin.name).toEqual("asgard");
                    done();
                });
            this.appBuses.joinChannel.push("asgard");
            this.serverBuses.joinedChannel.push({name: "asgard"});
        });

        it("switches from chan to null when it isn't available",
                function(done) {
            this.curChanP
                .skip(3).slidingWindow(2,2)
                .onValue(function(curChans) {
                    var before2ndJoin = curChans[0],
                        after2ndJoin = curChans[1];
                    expect(before2ndJoin.name).toEqual("asgard");
                    expect(after2ndJoin).toBeNull();
                    done();
                });
            this.appBuses.joinChannel.push("asgard");
            this.serverBuses.joinedChannel.push({name: "asgard"});
            this.appBuses.joinChannel.push("midgard");
        });
    });

    describe("server comms", function() {
        beforeEach(function() {
            var that = this;
            this.serverSpy.joinChannel.and.callFake(function(arg) {
                that.serverBuses.joinedChannel.push({name: arg});
            });
        });

        it("forwards channel joins", function(done) {
            // channelStore will update after each joinChannel, so:
            var that = this;
            this.eventNetwork.channelStoreP.skip(3).onValue(function() {
                expect(that.serverSpy.joinChannel.calls.count()).toBe(2);
                done();
            });
            this.appBuses.joinChannel.push("asgard");
            this.appBuses.joinChannel.push("midgard");
        });

        it("doesn't forward channel join if already joined", function(done) {
            var that = this;
            // channelStore will update after each joinChannel, so:
            this.eventNetwork.channelStoreP.skip(3).onValue(function() {
                expect(that.serverSpy.joinChannel.calls.count()).toBe(1);
                done();
            });
            this.appBuses.joinChannel.push("asgard");
            this.appBuses.joinChannel.push("asgard");
        });

        it("forwards messages");
        it("joins main when it becomes available");
    });
});
