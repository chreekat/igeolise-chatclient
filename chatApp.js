// ACTION BUSES (top of the flow)
var toggleChanSelectB = new Bacon.Bus(),
    usernameB = new Bacon.Bus()
    ;
// INTERMEDIATE LOGIC

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
        messages: "Some messages"
    },
    channels: ["chan 1", "chan 2"]
});

// REACT COMPONENTS (bottom of the flow)
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

// Design framework
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

var Bar = React.createClass({
    render: function() {
        return (
            <section className='bar'>
                <main className='barMain'>
                    {this.props.mainContent}
                </main>
            </section>
        );
    }
});

// Chat components
var ChanView = React.createClass({
    render: function() {
        var chan = this.props.channel;
        return (
            <Foo title={chan.name} mainContent={chan.messages} />
        );
    }
});
var UserNameSelectView = React.createClass({
    render: function() {
        return (
            <Bar mainContent={<div>UserNameSelectView</div>} />
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
