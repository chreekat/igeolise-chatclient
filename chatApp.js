// REACT COMPONENTS

var chanViewStateProp;

var ChatApp = React.createClass({
    componentWillMount: function() {
        // FIXME: Referencing a global here instead of an initialProp, due
        // to me being confused about when what gets initialized. (If I use
        // a prop here, I get "onValue" not defined. If I use a prop, but
        // put it in componentDidMount, then I need to use getInitialState,
        // which feels unnecessary.)
        chanViewStateProp.onValue(this, "replaceState");
    },
    render: function() {
        return (
            <ChanView {...this.state} />
        );
    }
});
var ChanView = React.createClass({
    componentDidMount: function() {
        this.refs.msg.getDOMNode().focus();
    },
    handleKeyPress: function(ev) {
        if (ev.keyCode === 13) {
            ev.preventDefault();
            var inputNode = this.refs.msg.getDOMNode();
            messageBus.push({
                user: "Bryan",
                stamp: (function(d) {
                    return String(d.getHours() + ":" + d.getMinutes());
                }(new Date())),
                text: inputNode.value.trim()
            });
            inputNode.value = "";
        }
    },
    render: function() {
        return (
            <section className="chanView">
                <header>
                    <h2 className="chanView--title">{this.props.currentChannel.name}</h2>
                    <span className="chanView--chanSelect">
                        <ChanSelector />
                    </span>
                </header>
                <ChatWindow messages={this.props.currentChannel.messages}/>
                <textarea rows="3" className="chanView--chatInput" ref="msg"
                        onKeyDown={this.handleKeyPress} />
            </section>
        );
    }
});
var ChanSelector = React.createClass({
    render: function() {
        return (
            <button>V</button>
        );
    }
});
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
        return (
            <section className="chatMessage">
                <div className="chatMessage--meta">
                    <div>{this.props.user}</div>
                    <time className="chatMessage--date">{this.props.stamp}</time>
                </div>
                <main className="chatMessage--data">{this.props.text}</main>
            </section>
        );
    }
});
var ChanNameInput = React.createClass({
    render: function() {
        return (
            <input placeholder="New chan" />
        );
    }
});
var CreateChanButton = React.createClass({
    render: function() {
        return (
            <button>+</button>
        );
    }
});
var CreateChanForm = React.createClass({
    render: function() {
        return (
            <div>
                <ChanNameInput />
                <CreateChanButton />
            </div>
        );
    }
});
var ChanDisplay = React.createClass({
    render: function() {
        return (
            <div>
                <CreateChanForm />
                <ChanList />
            </div>
        );
    }
});
var ChanList = React.createClass({
    render: function() {
        return (
            <ul>
                <li>Chan 2</li>
            </ul>
        );
    }
});

// TEST BACON

// Action Buses
var messageBus = new Bacon.Bus();

// Intermediate logic
var messagesProperty = messageBus.scan([], function(acc, m) {
    acc.push(m); return acc;
})

var channelProperty = Bacon.combineTemplate({
    name: "Chan 1",
    users: ['Bob', 'Frank'],
    messages: messagesProperty
});

var channelsProperty = Bacon.combineAsArray(channelProperty);
var currentChanProperty = channelsProperty.map(".0");

chanViewStateProp = Bacon.combineTemplate({
    user: null,
    channels: channelsProperty,
    currentChannel: currentChanProperty
});

// FIRE ZE MISSILES
React.render(<ChatApp />, document.getElementById("chatApp"));

// FIXME: This has to be done *after* the component is mounted/connectod to
// the stateProp; otherwise the bus is treated as dead and these initial
// messages disappear into the ether. That's fragile; perhaps there's a
// solution.
//
// Add some initial messages
[
    {
        user: "Pancake",
        stamp: "12:05",
        text: "I am a message thing"
    },
    {
        user: "FlappyHouse",
        stamp: "13:08",
        text: "You are not a message thing. I am. Note my message-ness."
    },
    {
        user: "FrontPorch",
        stamp: "13:10",
        text: "Now, let me tell you whippersnappers about messages. Back in my day, Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    }
].map(function(m) { messageBus.push(m) });
