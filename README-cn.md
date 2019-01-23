# Repeater 复读机
📼 基于浏览器事件录制的视觉测试工具。

![repeater-demo](https://dancf-st-gdx.oss-cn-hangzhou.aliyuncs.com/gaoding/20190117-154645984-1627f2.gif)

## 介绍
测试大型 Web 项目时有这些痛点：

* 难以编写复杂交互的测试用例。
* 难以为遗留代码添加测试支持。
* 难以保证最终界面的正确渲染。

但是，人肉的自测一直非常容易，我们能直接自动化这个流程吗？不妨设想这样的工作流：

1. 手工操作你的应用，自动记录鼠标、键盘等交互事件流。
2. 为最终 UI 界面截图，作为测试用例。
3. 使用无头浏览器回放录制的事件，通过截图比对，判断用例是否通过。

基于这个想法，我们发明了 Repeater（复读机），为你提供全新的测试手段。核心特性：

* 无侵入性的浏览器事件录制，附带可定制的事件流过滤支持。
* 像素级的视觉回归测试，支持批处理。图片比完整的 DOM 快照更可读，并且体积更小！
* 可选的被动模式，由被测试代码调用 API 自动截图。
* 真正开箱即用。我们默认复用你的系统上现成的 Chrome 作为宿主环境，无原生依赖，无二进制包。
* 面向持续集成，支持可配置的资源池机制以便在 CI 环境中使用。


## 使用
由 NPM 安装：

``` bash
npm install repeater.js
```

Repeater 的使用主要分两部分：收集用户事件与回放测试用例。

### 记录交互事件
要想在已有的项目中记录事件，只需这么几步：

1. 在测试页面打开 Repeater DevTool，点击 `ON` 启用录制。
2. 在页面里折腾。
3. 点击 `Copy Log` 来复制事件 JSON 日志，或者点击 `Screenshot` 保存屏幕截图。

> 截图并不必手动保存。你可以在保存日志后，使用 `repeater --update` 批量更新截图。

而后即可按照这种结构管理测试用例了：

``` text
some/test
├── foo.json
├── foo.png
├── bar.json
├── bar.png
├── baz.json
└── baz.png
```

Repeater 还提供了一些**可选的**辅助功能以便于提高录制效率。在测试页面，你可以导入 Repeater 的辅助函数：

``` js
import { initHelpers } from 'repeater.js'

initHelpers()
```

而后要想复制日志，只需打开页面的开发者工具，在控制台中输入 `copyLog()` 即可。

### 回放测试
要想验证一个测试用例，使用 Repeater 的 CLI 命令：

``` bash
npx repeater path/to/log.json
```

这会通过 [Puppeteer](https://github.com/GoogleChrome/puppeteer) 回放事件并比较截图。你也可以批量运行测试：

``` bash
npx repeater path/to/tests
```

实际上，你并不必为每个 JSON 的用例文件手动保存截图，也可以通过 `--update` 参数来添加或更新已有用例的截图：

``` bash
npx repeater path/to/log.json --update
```

### 被动模式
默认情况下 Repeater「主动地」在回放时向页面推送事件，它也不需要被集成到你的代码中。不过，如果你只想保证「静态」的渲染结构，或者不需要在页面中执行复杂的交互，这时你也可以使用被动模式。

在被动模式中，Repeater「被动地」监听你对其 API 的调用，而不去触发事件。这个模式不需要浏览器扩展来记录事件。作为开始，可以按照这个格式添加 JSON 用例文件：

``` json
{
  "viewport": {
    "width": 400,
    "height": 400
  },
  "url": "http://localhost:8080/some-test",
  "mode": "passive"
}
```

在测试页面中，使用 Repeater 的 API 来控制截图时机：

``` js
import { screenshot } from 'repeater.js'

// 渲染 canvas 或其它复杂任务
// ...

// 告知 Puppeteer 截图
screenshot()
```

而后即可使用相同的 CLI 管理测试用例了。在 `repeater` 命令运行时，页面中对 `screenshot()` 的调用会触发截图比对的过程。


## 测试覆盖率
目前如果需要测试覆盖率数据，大致需要在待测试的项目中配置这些步骤：

1. 安装 `babel-plugin-istanbul` 与 `nyc`。
2. 使用 Repeater 执行测试。
3. 使用 `npx nyc report --reporter=html` 获得覆盖率报告。

> 只要覆盖率数据存在，Repeater 就会将其写入 `./nyc_output` 目录下。


## 最佳实践
一些应用 Repeater 时的实践建议：

* 可以为视觉测试提供单独的「静态」Demo 页，以便保证相同的输入总能渲染出相同的输出。
* 如果多个测试用例需要不同的初始化过程，可以在 Demo 页的 URL 参数中做出一些区分，以便于自动化。**Don't Repeat Yourself.**
* 使用较小的浏览器窗口来截图。窗口越小，截图尺寸显著更小，且图片比对的敏感度更高。
* 使用相近的系统环境做测试。不同操作系统的渲染效果会有细微差别，如文本。
* 添加 `./.repeater` 到 `.gitignore` 中。


## 注意事项

### 滚动事件
Chrome 对滚动有非常特殊的优化处理，Puppeteer 目前也没有 first-class 的 API 实现该控制。这导致了滚动行为在回放上的困难。

### 外部状态
UI 是充满副作用的。Repeater 只将用户输入事件作为唯一的数据源，因此你需要尽量确保外部状态的稳定。并且，这里也有一些限制。例如：

* 网络状态。一旦 HTTP 请求的响应改变，就可能产生问题。
* 剪贴板状态。从系统剪贴板中的粘贴行为是不可靠的。
* 输入法状态。使用输入法输入的文本可能无法被正确地回放。


## More
更多相关信息，请参阅主线维护的 [README 文档](./README.md)


## License
MIT

---

Code with ❤️ by Undefined FE team, Gaoding Inc. 2019.
