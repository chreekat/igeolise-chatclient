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

// STATIC TEST DATA

var channels = [{
    name: "Chan 1",
    users: ['Bob', 'Frank'],
    messages: []
}];

channels[0].messages = channels[0].messages.concat([
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
]);
// Lots of data to test scrolling.
for (var i = 0; i < 4; i++) {
    channels[0].messages = channels[0].messages.concat(channels[0].messages);
}


// FIRE ZE MISSILES
React.render(<ChanView initialChannels={channels}/>, document.getElementById("chatApp"));
