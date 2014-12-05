var channel = {
    title: "Chan 1"
};

var messages = {};
messages[JSON.stringify(channel)] = [
    {
        author: "Pancake",
        date: "some date",
        message: "I am a message thing"
    },
    {
        author: "FlappyHouse",
        date: "alsodate",
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
            <div>
                <div>{this.props.author}</div>
                <div>{this.props.date}</div>
                <div>{this.props.message}</div>
            </div>
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
            <div>
                {nodes}
            </div>
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
