// REACT COMPONENTS
var ChatApp = React.createClass({
    componentWillMount: function() {
        // FIXME: Referencing a global here instead of an initialProp, due
        // to me being confused about when what gets initialized. (If I use
        // a prop here, I get "onValue" not defined. If I use a prop, but
        // put it in componentDidMount, then I need to use getInitialState,
        // which feels unnecessary.)
        //chanViewStateProp.onValue(this, "replaceState");
    },
    render: function() {
        var chan = {
            name: "Chan 1",
            messages: "Some messages"
        };
        var channels = ["chan 1", "chan 2"];
        return (
            <div>
                <ChanView channel={chan} />
                //<ChanSelectView currentChannel={chan} channels={channels} />
                //<UserNameSelectView />
            </div>
        );
    }
});

// Design framework
var Foo = React.createClass({
    render: function() {
        return (
            <section className='foo'>
                <header className='fooHeader'>
                    {this.props.title}
                </header>
                <main className='fooMain'>
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
