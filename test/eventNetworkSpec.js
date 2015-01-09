jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;

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
            joinChannel: new Bacon.Bus(),
            leaveChannel: new Bacon.Bus()
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
                expect(chans.channels.Neorxnawang).toBeDefined();
                done();
            });
            this.serverBuses.joinedChannel.push({name: "Neorxnawang", users: [], messages: []});
        });

        it("Pushes a UsersMessage when a channel is joined", function(done) {
            this.chansP.skip(1).onValue(function(chans) {
                expect(chans.channels.Neorxnawang.messages[1]).toEqual({
                    type: "UsersMessage",
                    message: {
                        users: [{ name: "Baldaeg" }]
                    }
                });
                done();
            });
            this.serverBuses.joinedChannel.push({
                name: "Neorxnawang",
                users: [{
                    name: "Baldaeg"
                }],
                messages: [1]
            });
        });

        it("keeps UsersMessage immutable", function(done) {
            this.chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.Neorxnawang.messages[1]
                        .message.users.length)
                    .toEqual(2);
                done();
            });
            this.serverBuses.joinedChannel.push({
                name: "Neorxnawang",
                users: [
                    { name: "Wōden" },
                    { name: "Baldaeg" }
                ],
                messages: [1]
            });
            this.serverBuses.userLeft.push({
                channel: "Neorxnawang",
                user: {name: "Wōden" }
            });
        });

        it("wraps joinedChannel values in a ChatMessage pseudo data constructor",
            function(done) {
                var someMessage = {};
                this.chansP.skip(1).onValue(function(chans) {
                    var msg = chans.channels.Neorxnawang.messages[0];
                    expect(msg.type).toEqual("ChatMessage");
                    expect(msg.message).toBe(someMessage);
                    done();
                });
                this.serverBuses.joinedChannel.push({
                    name: "Neorxnawang",
                    messages: [someMessage]
                });
        });

        it('reacts to appBuses.leaveChannel', function(done) {
            this.chansP.skip(2).map('.channels').onValue(function(chans) {
                expect(chans.Neorxnawang).toBeUndefined();
                done();
            });
            this.serverBuses.joinedChannel.push({name: "Neorxnawang", messages: []});
            this.appBuses.leaveChannel.push("Neorxnawang");
        });


        it('reacts to appBuses.joinChannel', function(done) {
            this.chansP.skip(1).onValue(function(chans) {
                expect(chans.current).toEqual("Middangeard");
                done();
            });
            this.appBuses.joinChannel.push("Middangeard");
        });

        it("reacts to serverBuses.incomingMsg", function(done) {
            this.chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.Neorxnawang.messages[1]).toEqual({
                    type: "ChatMessage",
                    message: {
                        user: {name: "Tiw"},
                    stamp: 141708891560,
                    text: "Aah"
                    }
                });
                done();
            });
            this.serverBuses.joinedChannel.push({name: "Neorxnawang", messages: []});
            this.serverBuses.incomingMsg.push({
                channel: "Neorxnawang",
                message: {
                    user: {name: "Tiw"}, stamp: 141708891560, text: "Aah"
                }
            });
        });

        it("reacts to serverBuses.userJoined", function(done) {
            this.chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.Neorxnawang.users).toEqual([
                    {name: "Tiw"},
                    {name: "Ðunor"}
                ]);
                expect(chans.channels.Neorxnawang.messages[1]).toEqual({
                    type: "JoinedMessage",
                    message: {
                        user: {name: "Ðunor"}
                    }
                });
                done();
            });
            this.serverBuses.joinedChannel.push({
                name: "Neorxnawang",
                users: [{name: "Tiw"}],
                messages: []
            });
            this.serverBuses.userJoined.push({
                channel: "Neorxnawang",
                user: {name: "Ðunor"}
            });
        });

        it("reacts to serverBuses.userLeft", function(done) {
            this.chansP.skip(2).onValue(function(chans) {
                expect(chans.channels.Neorxnawang.users).toEqual([
                    {name: "Tiw"},
                    {name: "Ðunor"},
                    {name: "Wōden"}
                ]);
                expect(chans.channels.Neorxnawang.messages[1]).toEqual({
                    type: "LeftMessage",
                    message: {
                        user: {name: "Éostre"}
                    }
                });
                done();
            });
            this.serverBuses.joinedChannel.push({
                name: "Neorxnawang",
                users: [
                    {name: "Tiw"},
                    {name: "Éostre"},
                    {name: "Ðunor"},
                    {name: "Wōden"}
                ],
                messages: []
            });
            this.serverBuses.userLeft.push({
                channel: "Neorxnawang",
                user: {name: "Éostre"}
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
                    expect(afterJoin.name).toEqual("Neorxnawang");
                    done();
                });
            this.appBuses.joinChannel.push("Neorxnawang");
            this.serverBuses.joinedChannel.push({name: "Neorxnawang", messages: []});
        });

        it("switches from chan to null when it isn't available",
                function(done) {
            this.curChanP
                .skip(3).slidingWindow(2,2)
                .onValue(function(curChans) {
                    var before2ndJoin = curChans[0],
                        after2ndJoin = curChans[1];
                    expect(before2ndJoin.name).toEqual("Neorxnawang");
                    expect(after2ndJoin).toBeNull();
                    done();
                });
            this.appBuses.joinChannel.push("Neorxnawang");
            this.serverBuses.joinedChannel.push({name: "Neorxnawang", messages: []});
            this.appBuses.joinChannel.push("Middangeard");
        });
    });

    describe("server comms", function() {
        beforeEach(function() {
            var that = this;
            this.serverSpy.joinChannel.and.callFake(function(arg) {
                that.serverBuses.joinedChannel.push({name: arg, messages: []});
            });
        });

        it("forwards channel joins", function(done) {
            // channelStore will update after each joinChannel, so:
            var that = this;
            this.eventNetwork.channelStoreP.skip(3).onValue(function() {
                expect(that.serverSpy.joinChannel.calls.count()).toBe(2);
                done();
            });
            this.appBuses.joinChannel.push("Neorxnawang");
            this.appBuses.joinChannel.push("Middangeard");
        });

        it("doesn't forward channel join if already joined", function(done) {
            var that = this;
            // channelStore will update after each joinChannel, so:
            this.eventNetwork.channelStoreP.skip(3).onValue(function() {
                expect(that.serverSpy.joinChannel.calls.count()).toBe(1);
                done();
            });
            this.appBuses.joinChannel.push("Neorxnawang");
            this.appBuses.joinChannel.push("Neorxnawang");
        });

        it("forwards messages");
        it("joins main when it becomes available");
    });
});
