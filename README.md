A solution for a programming challenge for a web frontend developer role at
iGeolise.

At present, this is designed as a mobile-only app. Which is to say, it doesn't use screen real estate very well if it is given >960px.

### Code walkthrough

This app uses [Bacon.js], [React], and a teensy bit of [Immutable]. It incorporates Facebook's [Flux] philosophy by creating a one-way data flow. All inputs to the app start at "the top", pass through an intermediate processing layer, and terminate in a UI description.

At the top are an assortment of Bacon [Buses]. In order for any component to effect a change in the application, they must push a new value on to one of the buses. These buses are laid out at the [top of chatApp.js](chatApp.js#L1).

The intermediate processing is an event network built using Bacon combinators. It (mostly) resides in [eventNetwork.js](eventNetwork.js). The rest is in chatApp.js. You can see an example of pushing actions back to the top of the flow at [line 42](chatApp.js#L42).

By putting the event network in a different file, it can be tested independent of the app. Mock buses are easy to create and push values on to. The tests are in [test/eventNetworkSpec.js](test/eventNetworkSpec.js) and can be run with Jasmine's standalone spec runner. With a server serving this directory, the runner is at http://&lt;localhost>/test-runner/SpecRunner.html. 

The intermediate processing terminates at the creation of one single Property, [chatAppStateProp](chatApp.js#L376). (For some reason I thought it made sense to move its definition to the bottom of the file. It should be moved back up.)

I decided that the React components should care as little as possible about how the intermediate processing was done, so there is only one place where they are coupled. The topmost component [hooks a callback](chatApp.js#L76) to chatAppStateProp that updates its state with every new value of the Property. From there, the values leave Bacon-reactivity behind, and flow as static (React-component) properties through the rest of the UI description.

### Notes

Check out [Notes.txt](Notes.txt), obviously. But also:

At present eventNetwork.js uses an unwieldy stack of .flatMapLatests to combine the effects of multiple buses. In the future, I think a better implementation might create a merged stream of all buses that is processed in a .withStateMachine. This would allow better control over event propagation and might be more efficient. Whether this is true remains to be seen.

[bugs](bugs) lists known bugs. It's used with [sjl's t](https://github.com/sjl/t) and the following script I have, named `~/bin/b`:

    #!/bin/bash


    if git root >/dev/null 2>&1 ; then
        python ~/src/t/t.py --task-dir `git root` --list bugs $@
    else
        echo "(No repo here)"
    fi

[bacon.js]: https://baconjs.github.io/
[react]: https://facebook.github.io/react/
[immutable]: https://facebook.github.io/immutable-js/
[flux]: https://facebook.github.io/flux/
[buses]: https://baconjs.github.io/api.html#bus
