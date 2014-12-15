// # ACTION BUSES (top of the flow)
var toggleChanSelectB = new Bacon.Bus(),
    usernameB = new Bacon.Bus(),
    messageB = new Bacon.Bus()
    ;

// # INTERMEDIATE LOGIC

var topViewE = usernameB.flatMapLatest(function (username) {
    if (username === null) {
        return function() { <UserNameSelectView/> };
    } else {
        return toggleChanSelectB
            .scan(false, function(prev) { return !prev })
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

var chatAppStateProp = Bacon.combineTemplate({
    topView: topViewE.toProperty(function() { return <UserNameSelectView /> }),
    currentChannel: {
        name: "Chan 1",
        messages: [{
            user: "bob",
            stamp: Date.now(),
            text: "Some messages"
        }]
    },
    channels: ["chan 1", "chan 2"]
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
                user: this.props.user,
                stamp: Date.now(),
                text: inputNode.value.trim()
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


// ## UserNameSelectView

var UserNameSelectView = React.createClass({
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
            <input onKeyDown={this.handleUsername} ref='usernameInput' type='text'/>
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
