var ChatApp = React.createClass({
    render: function() {
        return (
            <div>
                <ChanHeader />
                <ChatWindow />
                <ChanDisplay />
            </div>
        );
    }
});
var ChatMessage = React.createClass({
    render: function() {
        return (
            <div>
                <ChatMeta />
                <ChatMessageBody />
            </div>
        );
    }
});
var ChatMeta = React.createClass({
    render: function() {
        return (
            <div>
                <div>Author</div>
                <div>Date</div>
            </div>
        );
    }
});
var ChatMessageBody = React.createClass({
    render: function() {
        return (
            <div>MessageBody</div>
        );
    }
});
var ChanHeader = React.createClass({
    render: function() {
        return (
            <div>
                <ChanTitle />
                <ChanSelector />
            </div>
        );
    }
});
var ChanTitle = React.createClass({
    render: function() {
        return (
            <span>Chan 1</span>
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
        return (
            <ChatMessage />
        );
    }
});
var ChanNameInput = React.createClass({
    render: function() {
        return (
            <input value="New chan" />
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
