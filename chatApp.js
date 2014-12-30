// # ACTION BUSES (top of the flow)
var appBuses = {
        toggleChanSelect: new Bacon.Bus(),
        username: new Bacon.Bus(),
        message: new Bacon.Bus(),
        joinChannel: new Bacon.Bus()
    },
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

var eventNetwork = EventNetwork(appBuses, serverBuses);

// ## Server!
var chatServer = Server(
    baconSocket("ws://localhost:9000/chat"),
    serverBuses
);

// # INTERMEDIATE LOGIC

// Register when we get a username
appBuses.username.take(1).onValue(chatServer, "register");

// Pass message events to server
appBuses.message.onValue(function(msg) {
    chatServer.msg(msg.channel, msg.message)
});

// Join the main server at startup
appBuses.joinChannel.push("main");

// Choose the top view based on username and toggleChanSelect
var topViewE = appBuses.username.flatMapLatest(function (username) {
    if (username === null) {
        return function() { <UsernameSelectView/> };
    } else {
        return appBuses.toggleChanSelect
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
    currentChannel: eventNetwork.currentChannelP,
    channels: eventNetwork.availableChannelsP
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
                    <button onClick={() => appBuses.toggleChanSelect.push()}>V</button>
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
        var content, title;
        if (chan !== null) {
            title = chan.name;
            content = (
                <div>
                    <ChatWindow messages={chan.messages} />
                    <textarea rows="3" ref="msg"
                        onKeyDown={this.handleChatMessage} />
                </div>
            );
        } else {
            title = "<>";
            content = "Loading...";

        }
        return (<Foo title={title} mainContent={content} />);
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
            appBuses.username.push(el.value);
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
        var title = (chan !== null ? chan.name : "<>");
        return (
            <Foo title={title} mainContent={this.props.channels} />
        );
    }
});

// FIRE ZE MISSILES
React.initializeTouchEvents(true);
React.render(<ChatApp />, document.getElementById("chatApp"));
