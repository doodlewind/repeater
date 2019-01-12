# Repeater
📼 Record browser events as visual test case.

[中文介绍](./README-cn.md)


## Introduction
There're several pain points testing large web apps:

* It's *hard* to write test cases for complex user operations.
* It's *hard* to add test support for existing projects.
* It's *hard* to ensure the final UI renders correctly.

But, it's always trivial to "run test by yourself", what if we simply automate this process? Imagine this happy path:

1. Play around in your app, recording all user events (mouse/keyboard...) in the background.
2. Take screenshot image for final UI state.
3. Use headless browser to replay the events recorded, simply compare the screenshot as test result.

With this idea we invent Repeater, enabling a fresh way adding test cases. Core features:

* Non-aggressive user events recording in browser, with a customizable events stream filter.
* Batch testing based on image diff, which can be accurate to pixels. Image is more readable then complete DOM snapshot, and even smaller!
* Works out of the box. We use your installed Chrome as host environment. No native dependencies, no binary bundles.
* Automation ready. Repeater supports configurable resources pool for advanced usage in CI environment.


## Usage
Install via NPM:

``` bash
npm install repeater.js
```

Repeater is mainly composed of two parts: **Recorder** to collect user events, and **Replayer** for runing tests.

### Record Events
To record events in existing project, include the script *before* any other modules:  

``` js
import 'repeater.js'
import 'vue'
// ...
```

Then after test page loaded, user events will be automatically recorded. To save a event log, open Chrome console and type `copyLog()`, then you can paste the result as JSON format.

> Chrome extension WIP.

### Replay Tests
Once event log saved, you can add screenshot with Repeater CLI:

``` bash
npx repeater path/to/log.json --update
```

This will take screenshot for you via [Puppeteer](https://github.com/GoogleChrome/puppeteer). To verify the test case, run:

``` bash
npx repeater path/to/log.json
```

Or batching tests:

``` bash
npx repeater path/to/tests
```


## API
Usage: `repeater <location> [options]`

Options:

``` text
  -V, --version                  output the version number
  --update                       update existing screenshots
  --concurrency [concurrency]    test runner concurrency (default: 4)
  --pool-timeout [timeout]       browser pool timeout in seconds (default: 60)
  --headless                     hide browser window
  --executable-path [path]       chrome path
  --diff-threshold [percentage]  for image diff, 0 to 100 (default: 0.5)
  -h, --help                     output usage information
```


## Roadmap
* TODO record UI
* TODO test coverage


## Best Practises
Several points for better Repeater integration:

* Build a "static" demo page for test, so that you can always get same render result with same inputs.
* If multi test cases requires multi setup ways, you can simply identify them in demo page's URL and do the automation. **Don't Repeat Yourself.**
* Use small browser window for screenshot. Smaller window size leads to significantly smaller screenshot size, and more sensitive image diff.


## Caveats

### Wheel Events
Chrome 51 no longer scrolls when the user-defined wheel event is dispatched. Per the DOM spec (3.10) events are not action-causers, but notifications of an action already-in-process. Chrome was aware of this defect and has not finally fixed it.

### External States
UI is full of side effects. Repeater only records input events as data source, so you'll need to ensure external state can be stable. And there're also some limitations. For example:

* Network state. If HTTP request returns different result, that can be a problem.
* Clipboard state. Pasting from OS clipboard is unreliable.
* IME state. Text inputs with IME may not be replayed correctly.


## License
MIT

---

Code with ❤️ by Undefined FE team, Gaoding Inc. 2019.
