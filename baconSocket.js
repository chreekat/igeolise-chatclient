/* Developing a Bacon.js (FRP) interface to websockets.
 *
 */

var baconSocket = function(url, protocols) {
    // An EventStream bound to a WebSocket.
    //
    // Design principles:
    //
    // 1. There is only one way out, and it is through the EventStream. All
    // errors at all stages go through there.
    // 2. The return object is a product of the EventStream and the WebSocket.
    var ws,
        wsErr,
        outStream;

    // Push all errors out the ES's pipe.
    try {
        ws = new WebSocket(url, protocols);
    } catch (err) {
        wsErr = err;
    }

    outStream = Bacon.fromBinder(function(sink) {
        if (wsErr !== undefined) {
            sink(Bacon.once(new Bacon.Error(err)));
            // TODO: short-circuit everything else below?
        }
        ws.onmessage = sink;
        ws.onerror = function(err) {
            sink(new Bacon.Error(err));
        };
        ws.onclose = function(closeEvent) {
            sink(Bacon.once(closeEvent));
        };
        // Destructor closes the WS.
        return function() {
            ws.close();
        };
    });

    return {
        bacon: outStream,
        socket: ws
    };
};
