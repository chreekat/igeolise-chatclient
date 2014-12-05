var channel = {
    title: "Chan 1"
};

var messages = {};
messages[JSON.stringify(channel)] = [
    {
        author: "Pancake",
        date: "12:05",
        message: "I am a message thing"
    },
    {
        author: "FlappyHouse",
        date: "13:08",
        message: "You are not a message thing. Note my message-ness."
    }
];

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
            <section>
                <header>
                    <h2 className="chanView--title">{this.props.channel.title}</h2>
                    <span className="chanView--chanSelect">
                        <ChanSelector />
                    </span>
                </header>
                <ChatWindow messages={messages[JSON.stringify(channel)]}/>
            </section>
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
var ChanSelector = React.createClass({
    render: function() {
        return (
            <button>V</button>
        );
    }
});
var ChatWindow = React.createClass({
    render: function() {
        var msg1 = this.props.messages[0];
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

React.render(<ChatApp />, document.getElementById("chatApp"));
