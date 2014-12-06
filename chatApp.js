// REACT COMPONENTS

var ChatApp = React.createClass({
    render: function() {
        return (
            <ChanView channel={channel} />
        );
    }
});
var ChanView = React.createClass({
    render: function() {
        return (
            <section className="chanView">
                <header>
                    <h2 className="chanView--title">{this.props.channel.title}</h2>
                    <span className="chanView--chanSelect">
                        <ChanSelector />
                    </span>
                </header>
                <ChatWindow messages={messages[0]}/>
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
                    <div>{this.props.author}</div>
                    <time className="chatMessage--date">{this.props.date}</time>
                </div>
                <main className="chatMessage--data">{this.props.message}</main>
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

var channel = {
    title: "Chan 1"
};

var messages = {};
messages[0] = [
    {
        author: "Pancake",
        date: "12:05",
        message: "I am a message thing"
    },
    {
        author: "FlappyHouse",
        date: "13:08",
        message: "You are not a message thing. I am. Note my message-ness."
    },
    {
        author: "FrontPorch",
        date: "13:10",
        message: "Now, let me tell you whippersnappers about messages. Back in my day, Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    }
];
// Lots of data to test scrolling.
for (var i = 0; i < 4; i++) {
    messages[0] = messages[0].concat(messages[0]);
}


// FIRE ZE MISSILES
React.render(<ChatApp />, document.getElementById("chatApp"));
