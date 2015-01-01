// # ACTION BUSES (top of the flow)
var appBuses = {
        toggleChanSelect: new Bacon.Bus(),
        username: new Bacon.Bus(),
        message: new Bacon.Bus(),
        joinChannel: new Bacon.Bus(),
        leaveChannel: new Bacon.Bus()
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

// ## Server!
var chatServer = new Server(
    baconSocket("ws://localhost:9000/chat"),
    serverBuses
);

var eventNetwork = new EventNetwork(appBuses, serverBuses, chatServer);

// # INTERMEDIATE LOGIC

// TODO: Move more of this into the eventNetwork.

// Register when we get a username
appBuses.username.take(1).onValue(chatServer, "register");

// Pass message and leaveChannel events to server
appBuses.message.onValue(function(msg) {
    chatServer.msg(msg.channel, msg.message)
});
appBuses.leaveChannel.onValue(chatServer, "leaveChannel");

// Join the main server when it becomes available
serverBuses.channelAvailable
    .filter(function(chan) { return (chan.name === "main") })
    .take(1)
    .onValue(function() {
        appBuses.joinChannel.push("main");
    });

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
var Main = React.createClass({
    render: function() {
        return (
            <section className="main">
                <header className="main--header">
                    <h2>{this.props.title}</h2>
                    <button onClick={() => appBuses.toggleChanSelect.push()}>V</button>
                </header>
                <main className="main--content">
                    {this.props.mainContent}
                </main>
            </section>
        );
    }
});

var Dialog = React.createClass({
    render: function() {
        return (
            <section className="dialog">
                <main className="dialog--content">
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
            appBuses.message.push({
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
        return (<Main title={title} mainContent={content} />);
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
            <main className="chatWindow">
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
            <section className="chatMessage">
                <div className="chatMessage--meta">
                    <div className="chatMessage--name">{this.props.user}</div>
                    <time className="chatMessage--date">{date}</time>
                </div>
                <main className="chatMessage--content">{this.props.text}</main>
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
            <label htmlFor='usernameInput'>
                <span>Your username: </span>
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

// ## ChanSelectView

var ChanSelectView = React.createClass({
    render: function() {
        var chan = this.props.currentChannel;
        var title = (chan !== null ? chan.name : "<>");
        return (
            <Main title={title}
                mainContent={<ChanOptions channels={this.props.channels}/>} />
        );
    }
});
var ChanOptions = React.createClass({
    render: function() {
        var that = this;
        var handleSelect = function(name) {
            return function() {
                appBuses.joinChannel.push(name);
                appBuses.toggleChanSelect.push();
            };
        };
        var handleNewChan = function(ev) {
            if (ev.keyCode === 13) {
                ev.preventDefault();
                el = that.refs.newChannelInput.getDOMNode();
                handleSelect(el.value)();
                el.value = "";
            }
        };
        var leaveChannel = function(chan) {
            return function(ev) {
                ev.stopPropagation();
                appBuses.leaveChannel.push(chan);
            };
        };
        var options = this.props.channels.map(function(chan) {
            return (
                <li key={chan.name} onClick={handleSelect(chan.name)}>
                    <span>{chan.name}</span>
                    <span onClick={leaveChannel(chan.name)}>[leave]</span>
                </li>
            );
        });
        return (
            <ul>
                <li><input onKeyDown={handleNewChan} ref='newChannelInput'
                    placeholder='New channel' />
                </li>
                {options}
            </ul>
        );
    }
});

// FIRE ZE MISSILES
React.initializeTouchEvents(true);
React.render(<ChatApp />, document.getElementById("chatApp"));
