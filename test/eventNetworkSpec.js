describe("eventNetwork", function() {

    describe("joinedChannelsP", function() {
        var serverBuses, jchansP;

        beforeEach(function() {
            serverBuses = {
                joinedChannel: new Bacon.Bus(),
                incomingMsg: new Bacon.Bus(),
                userJoined: new Bacon.Bus(),
                userLeft: new Bacon.Bus()
            };
            jchansP = EventNetwork.joinedChannelsP(serverBuses);
        });

        it("reacts to serverBuses.joinedChannel", function(done) {
            jchansP.skip(1).onValue(function(jchans) {
                expect(jchans.asgard).toBeDefined();
                done();
            });
            serverBuses.joinedChannel.push({name: "asgard"});
        });

        it("reacts to serverBuses.incomingMsg", function(done) {
            jchansP.skip(2).onValue(function(jchans) {
                expect(jchans.asgard.messages).toEqual([
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
            jchansP.skip(2).onValue(function(jchans) {
                expect(jchans.asgard.users).toEqual([
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
            jchansP.skip(2).onValue(function(jchans) {
                expect(jchans.asgard.users).toEqual([
                    {name: "tyr"},
                    {name: "ratatoskr"},
                    {name: "woden"}
                ]);
                done();
            });
            jchansP.log();
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
