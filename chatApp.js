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
                            channels={state.availableChannels}
                            joined={state.joinedChannels}
                            currentChannel={state.currentChannel} />
                    );
                }
        });
    }
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
        return this.state.topView(this.state);
    }
});

// ## Design framework
var Main = React.createClass({
    render: function() {
        var {title, children, ...other} = this.props;
        return (
            <div {...other} className="main">
                <header className="main-header">
                    <h2 className="main-header-title">{title}</h2>
                    <button onClick={() => appBuses.toggleChanSelect.push()}
                        className="main-header-chanSelect">V</button>
                </header>
                <main className="main-content">
                    {children}
                </main>
            </div>
        );
    }
});

var Dialog = React.createClass({
    render: function() {
        var {children, ...other} = this.props;
        return (
            <div {...other} className="dialog">
                <main className="dialog-content">
                    {children}
                </main>
            </div>
        );
    }
});

// ## Chat components

// ### ChanView
var ChanView = React.createClass({
    componentDidUpdate: function() {
        this.focusInput();
    },
    focusInput: function() {
        if (this.refs.msg !== undefined) {
            this.refs.msg.getDOMNode().focus();
        }
    },
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
            return (
                <Main onClick={this.focusInput} title={chan.name}>
                    <ChatWindow messages={chan.messages} />
                    <textarea className="chanView-input" rows="3" ref="msg"
                        onKeyDown={this.handleChatMessage} />
                </Main>
            );
        } else {
            return (
                <Main title="Loading..." >
                    Loading...
                </Main>
            );
        }
    }
});

// ### Subcomponents of ChanView

// #### ChatWindow
var ChatWindow = React.createClass({
    scrollDown: function(o) {
        var el = o.refs.chatWindow.getDOMNode();
        el.scrollTop = el.scrollHeight - el.clientHeight;
    },
    componentDidUpdate: function() {
        this.scrollDown(this);
    },
    componentDidMount: function() {
        this.scrollDown(this);
    },

    render: function() {
        var nodes = this.props.messages.map(function(msg, idx) {
            var Msg;

            switch(msg.type) {
            case "ChatMessage":
                Msg = ChatMessage;
                break;
            case "JoinedMessage":
                Msg = JoinedMessage;
                break;
            case "LeftMessage":
                Msg = LeftMessage;
                break;
            case "UsersMessage":
                Msg = UsersMessage;
                break;
            default:
                throw("Unknown message type");
            }

            return (
                <Msg key={idx} {...msg.message} />
            );
        });
        return (
            <ol ref="chatWindow" className="chatWindow">
                {nodes}
            </ol>
        );
    }
});

// #### ChatMessage
var ChatMessage = React.createClass({
    render: function() {
        var date = (function(d) {
            var h = d.getHours(),
                m = d.getMinutes();
            return ""
                + (h < 10 ? "0" : "")
                + h + ":"
                + (m < 10 ? "0" : "")
                + m;
        }(new Date(this.props.stamp)));

        return (
            <li className="message message-chat">
                <aside className="chatMessage-meta">
                    <div className="chatMessage-name">{this.props.user}</div>
                    <time className="chatMessage-date">{date}</time>
                </aside>
                <main className="chatMessage-content">{this.props.text}</main>
            </li>
        );
    }
});

// #### JoinedMessage
var JoinedMessage = React.createClass({
    render: function() {
        return (
            <li className="message message-joined">
                {this.props.user.name} has joined
            </li>
        );
    }
});

// #### LeftMessage
var LeftMessage = React.createClass({
    render: function() {
        return (
            <li className="message message-left">
                {this.props.user.name} has left
            </li>
        );
    }
});

// #### UsersMessage
var UsersMessage = React.createClass({
    render: function() {
        var userList = this.props.users.reduce(function(a, b) {
            return a.name + ", " + b.name;
        });
        return (
            <li className="message message-users">
                Users: {userList}
            </li>
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
        return (
            <Dialog>
                <label htmlFor='usernameInput'>
                    <span>Your username: </span>
                    <input
                        onKeyDown={this.handleUsername}
                        ref='usernameInput'
                        type='text'
                        id='usernameInput'/>
                </label>
            </Dialog>
        );
    }
});

// ## ChanSelectView

var ChanSelectView = React.createClass({
    render: function() {
        var chan = this.props.currentChannel;
        var title = (chan !== null ? chan.name : "Join a channel to begin");
        return (
            <Main title={title}>
                <ChanOptions className="chanSelect-chanOptions"
                    channels={this.props.channels}
                    joined={this.props.joined} />
            </Main>
        );
    }
});

// ### ChanOptions
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
            var isJoined = (that.props.joined.indexOf(chan.name) >= 0);
            var chanClass = "chanOptions-chan" +
                (isJoined ? " chanOptions-chan-joined" : "");
            return (
                <li className={chanClass}
                        key={chan.name} onClick={handleSelect(chan.name)}>
                    <span className="chanOptions-chanName">{chan.name}</span>
                    <span className="chanOptions-leaveChan"
                        onClick={leaveChannel(chan.name)}>[leave]</span>
                </li>
            );
        });
        return (
            <ul className="chanOptions">
                <li className="chanOptions-chan chanOptions-chan-new">
                    <label className="chanOptions-inputLabel">
                        <input
                            className="chanOptions-input"
                            onKeyDown={handleNewChan} ref='newChannelInput'
                            placeholder='New channel' />
                    </label>
                </li>
                {options}
            </ul>
        );
    }
});

// # FIRE ZE MISSILES

// Build the reactive state for the top-level component.
var chatAppStateProp = Bacon.combineTemplate({
    topView: topViewE.toProperty(function() { return <UsernameSelectView /> }),
    currentChannel: eventNetwork.currentChannelP,
    availableChannels: eventNetwork.availableChannelsP,
    joinedChannels: eventNetwork.joinedChannelsE.toProperty([])
});
React.initializeTouchEvents(true);
React.render(<ChatApp />, document.getElementById("chatApp"));
