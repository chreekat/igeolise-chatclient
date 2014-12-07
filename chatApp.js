// REACT COMPONENTS

var ChanView = React.createClass({
    getInitialState: function() {
        return({
            channels: this.props.initialChannels,
            currentChannel: this.props.initialChannels[0]
        });
    },
    render: function() {
        return (
            <section className="chanView">
                <header>
                    <h2 className="chanView--title">{this.state.currentChannel.name}</h2>
                    <span className="chanView--chanSelect">
                        <ChanSelector />
                    </span>
                </header>
                <ChatWindow messages={this.state.currentChannel.messages}/>
                <textarea rows="3" className="chanView--chatInput" />
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
    channels: channelsProperty,
    currentChannel: currentChanProperty
});

// FIRE ZE MISSILES
React.render(<ChanView initialChannels={channels}/>, document.getElementById("chatApp"));
