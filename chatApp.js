// # ACTION BUSES (top of the flow)
var toggleChanSelectB = new Bacon.Bus(),
    usernameB = new Bacon.Bus(),
    messageB = new Bacon.Bus(),
    joinChannelB = new Bacon.Bus(),
    serverBuses = {
        channelAvailable: new Bacon.Bus(),
        joinedChannel: new Bacon.Bus(),
        userJoined: new Bacon.Bus(),
        incomingMsg: new Bacon.Bus(),
        userLeft: new Bacon.Bus(),
        serverError: new Bacon.Bus(),
        clientError: new Bacon.Bus()
    }
    ;

// # INTERMEDIATE LOGIC

// ## Server!
var chatServer = Server(
    baconSocket("ws://localhost:9000/chat"),
    serverBuses
);

// Register when we get a username
usernameB.take(1).onValue(chatServer, "register");

// Pass message events to server
messageB.onValue(function(msg) {
    chatServer.msg(msg.channel, msg.message)
});

// Join the main server as soon as it becomes available.
serverBuses.channelAvailable
    .filter(function(chan) { return (chan === "main") })
    .take(1)
    .onValue(function() {
        joinChannelB.push("main");
    });

// Keep a list of available channels
var availableChannelsP = serverBuses.channelAvailable.scan([], function(acc, chan) {
    acc.push(chan);
    return acc;
});

var findIndex = function(predicate) {
    var i;
    for(i = 0; i < this.length; i++) {
        if (predicate(this[i], i)) {
            return i;
        }
    }
    return -1;
};

// Also keep a list of joined channels. We get modifier events for joined
// channels, so this becomes slightly complicated.
// 1. The list itself is modified on channelAvailable events.
// 2. List elements are modified on userJoined, userLeft, and incomingMsg.
var joinedChannelsP =
    // joinedChannel
    serverBuses.joinedChannel
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
    });

// Choose the top view based on username and toggleChanSelect
var topViewE = usernameB.flatMapLatest(function (username) {
    if (username === null) {
        return function() { <UsernameSelectView/> };
    } else {
        return toggleChanSelectB
            .scan(true, function(prev) { return !prev })
            .decode({
                true: function(state) {
                    return (
                        <ChanView channel={state.currentChannel} />
                    );
                },
                false: function(state) {
                    return (
                        <ChanSelectView
                            channels={state.channels}
                            currentChannel={state.currentChannel} />
                    );
                }
        });
    }
});

// Build the reactive state for the top-level component.
var chatAppStateProp = Bacon.combineTemplate({
    topView: topViewE.toProperty(function() { return <UsernameSelectView /> }),
    // TODO: start value should be null which should be handled by the
    // view.
    currentChannel: serverBuses.joinedChannel
        .toProperty({
            name: "<>",
            users: [],
            messages: []
        }),
    channels: availableChannelsP
});

// # REACT COMPONENTS (bottom of the flow)
var ChatApp = React.createClass({
    componentWillMount: function() {
        // FIXME: Referencing a global here instead of an initialProp, due
        // to me being confused about when what gets initialized. (If I use
        // a prop here, I get "onValue" not defined. If I use a prop, but
        // put it in componentDidMount, then I need to use getInitialState,
        // which feels unnecessary.)
        chatAppStateProp.onValue(this, "replaceState");
    },
    render: function() {
        return (
            <div>
                {this.state.topView(this.state)}
            </div>
        );
    }
});

// ## Design framework
var Foo = React.createClass({
    render: function() {
        return (
            <section>
                <header>
                    <h2>{this.props.title}</h2>
                    <button onClick={() => toggleChanSelectB.push()}>V</button>
                </header>
                <main>
                    {this.props.mainContent}
                </main>
            </section>
        );
    }
});

var Dialog = React.createClass({
    render: function() {
        return (
            <section>
                <main>
                    {this.props.mainContent}
                </main>
            </section>
        );
    }
});

// ## Chat components

// ### ChanView
var ChanView = React.createClass({
    handleChatMessage: function(ev) {
        if (ev.keyCode === 13) {
            ev.preventDefault();
            var inputNode = this.refs.msg.getDOMNode();
            messageB.push({
                channel: this.props.channel.name,
                message: inputNode.value.trim()
            });
            inputNode.value = "";
        }
    },
    render: function() {
        var chan = this.props.channel;
        var content = (
            <div>
                <ChatWindow messages={chan.messages} />
                <textarea rows="3" ref="msg"
                    onKeyDown={this.handleChatMessage} />
            </div>
        );
        return (
            <Foo title={chan.name} mainContent={content} />
        );
    }
});

// ### subcomponents of ChanView
var ChatWindow = React.createClass({
    render: function() {
        var nodes = this.props.messages.map(function(msg, idx) {
            return (
                <ChatMessage key={idx} {...msg} />
            );
        });
        return (
            <main>
                {nodes}
            </main>
        );
    }
});
var ChatMessage = React.createClass({
    render: function() {
        var date = (function(d) {
            return String(d.getHours() + ":" + d.getMinutes());
        }(new Date(this.props.stamp)));
        return (
            <section>
                <div>
                    <div>{this.props.user}</div>
                    <time>{date}</time>
                </div>
                <main>{this.props.text}</main>
            </section>
        );
    }
});


// ## UsernameSelectView

var UsernameSelectView = React.createClass({
    componentDidMount: function() {
        this.refs.usernameInput.getDOMNode().focus();
    },
    handleUsername: function(ev) {
        if (ev.keyCode === 13) {
            ev.preventDefault();
            el = this.refs.usernameInput.getDOMNode();
            usernameB.push(el.value);
            el.value = "";
        }
    },
    render: function() {
        var inp = (
            <label htmlFor='usernameInput'>Your username:
                <input
                    onKeyDown={this.handleUsername}
                    ref='usernameInput'
                    type='text'
                    id='usernameInput'/>
            </label>
        );
        return (
            <Dialog mainContent={inp} />
        );
    }
});
var ChanSelectView = React.createClass({
    render: function() {
        var chan = this.props.currentChannel;
        return (
            <Foo title={chan.name} mainContent={this.props.channels} />
        );
    }
});

// FIRE ZE MISSILES
React.initializeTouchEvents(true);
React.render(<ChatApp />, document.getElementById("chatApp"));
