

## 一、写在前面
在日常的开发过程中，我们越来越多地使用`webpack`这种构建工具，但是对于它的使用，我们更多的是停留在去进行一些简单的配置，比如loader,plugin的配置。我们很少从零开始使用webpack去搭建一个项目(更多地是使用cli)，更加很少地去理解它内部的打包原理。为什么它能够将文件转化成一个模块，为什么能够将所有模块打包到一个文件中？打包后的文件到底是什么样的(可能很多人很少去看打包后的build文件)？这些我们都不太了解，但是当我们的构建速度雨来越慢的时候，我们想要去优化它却因为对webpack了解太少，而无从下手。而且随着面试越来越多地问到webpack底层原理，webpack越来越成为我们的阻碍了。但是对于很多人来说，去看webpack的源码，可能很多人都会头大，无从下手。如果看别人的源码讲解，又会陷入各种概念中，什么事件机制，内部钩子，Tapable插件架构和钩子设计。这些都让人难以理解。相反，我觉得如果我们从结果出发，看webpack最终打包后的文件是怎么样的，然后实现一个简单的跟它相同的打包器，这样反而能够让我们绕开很多高深的东西，更加理解其原理。这时候我们再去看源码或者别人的文章可能事半功倍。


## 二、模块打包器

### 2.1 什么是模块打包器

我们看官网对`webpack`的定义：webpack 是一个现代 JavaScript 应用程序的**静态模块打包器(module bundler)**。当 webpack 处理应用程序时，它会递归地构建一个依赖关系图(dependency graph)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个bundle。更加通俗地理解就是：每个文件就是一个模块，一个文件中又会引入其他文件的内容，我们最终要实现的就是以某i一个文件为入口：将它所有依赖的文件最终打包成一个文件，这就是**模块打包器**。

### 2.2 使用webpack打包后的文件

我们知道了模块打包器会将多个文件打包成一个文件，那么打包后的文件到底是什么样的了，我们必须知道这个才能够进行具体实现，因此我们查看以下webpack打包后的效果。
示例：假设我们在同一个文件夹下有以下几个文件：
**文件：index.js**

```javascript
let action = require("./action.js").action;   // 引入aciton.js
let name = require("./name.js").name;         // 引入name.js
let message = `${name} is ${action}`;
console.log(message);
```

`index.js`文件中引入了`action.js`和`name.js`。
**文件:action.js**

```javascript
let action = "making webpack";
exports.action = action;
```

**文件:name.js**

```javascript
let familyName = require("./family-name.js").name;
exports.name = `${familyName} 阿尔伯特`;
```

文件`name.js`又引入了`family-name.js`文件。
**文件:family-name.js**

```javascript
exports.name = "haiyingsitan";
```

接下来我们使用webpack进行打包，并去除打包后的注释，得到如下代码：

```javascript
 (() => {

   var __webpack_modules__ = ({
     "./action.js": ((__unused_webpack_module, exports) => {
       let action = "making webpack";
       exports.action = action;
     }),
     "./family-name.js": ((__unused_webpack_module, exports) => {
       exports.name = "haiyingsitan";
     }),
     "./name.js": ((__unused_webpack_module, exports, __webpack_require__) => {
       let familyName = __webpack_require__( /*! ./family-name.js */ "./family-name.js").name;
       exports.name = `${familyName} 阿尔伯特`;
     })
   });

   var __webpack_module_cache__ = {};
   function __webpack_require__(moduleId) {
     if (__webpack_module_cache__[moduleId]) {
       return __webpack_module_cache__[moduleId].exports;
     }
     var module = __webpack_module_cache__[moduleId] = {
       exports: {}
     };
     __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
     return module.exports;
   }

   (() => {
     let action = __webpack_require__(  "./action.js").action;
     let name = __webpack_require__(  "./name.js").name;
     let message = `${name} is ${action}`;
     console.log(message);
   })();

 })();
```

上面的代码看起来还是有点复杂，我们进一步简化它:

```javascript
(() => {
    // 获取所有的依赖
  var modules = {
    "./action.js": (module, exports) => {
      let action = "making webpack";
      exports.action = action;
    },
     // ... 其他代码
  };

  // require对应的模块函数执行
  function __webpack_require__(moduleId) {
    // 其他实现
    return module.exports;
  }

  // 入口函数立即执行
  let entryFn = () => {
    let action = __webpack_require__("./action.js").action;
    let name = __webpack_require__("./name.js").name;
    let message = `${name} is ${action}`;
    console.log(message);
  };
  entryFn();
})();
```

我们可以发现，文件最终打包后就是一个立即执行函数。这个函数由三部分组成：

1. 模块集合
   这个模块集合是所有模块的集合，以路径作为key值，模块内容作为value值。当我们需要使用某个模块时，直接从这个模块集合中进行获取即可。
   为什么需要这个模块集合了？试想一下，如果我们遇到`require("./action.js")`，那么这个`action.js`到底对应的是哪个模块了？因此，我们必须能够获取到所有的模块，并对他们进行区分(使用模块id或者模块名称)，到时候直接从这个模块集合中通过模块id或者模块名进行获取即可。

```javascript
  var modules = {
    "./action.js": (module, exports) => {
      let action = "making webpack";
      exports.action = action;
    },
  };
```

2. 模块函数执行
   每一个模块对应于一个函数，当遇到`require(xxx)`的时候实际上就是去执行引入的这个模块函数。

```javascript
   var __webpack_module_cache__ = {};
   function __webpack_require__(moduleId) {
     if (__webpack_module_cache__[moduleId]) {
       return __webpack_module_cache__[moduleId].exports;
     }
     var module = __webpack_module_cache__[moduleId] = {
       exports: {}
     };
     __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
     return module.exports;
   }
```

3. 入口文件立即执行（执行模块的函数）
   我们都知道一个模块的打包，必须有一个入口文件，而且这个文件必须立即执行，才能获取到所有的依赖。
   其实入口文件，也是一个模块，立即执行这个模块对应的函数即可。

```javascript
  let entryFn = () => {
    let action = __webpack_require__("./action.js").action;
    let name = __webpack_require__("./name.js").name;
    let message = `${name} is ${action}`;
    console.log(message);
  };
  entryFn();
```

好了，到目前为止，我们基本知道了webpack模块打包后生成的文件是什么样的。如果我们想要实现同样的功能，只需要同时实现：模块集合，模块执行和入口函数立即执行即可。**其中最关键的就是实现模块集合和模块执行。**



## 三、具体实现
![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/caa9d4789905401097e35955ae0759f5~tplv-k3u1fbpfcp-watermark.image)

从上面的分析中我们可以知道，我们要实现的主要包括两个部分：
1. 将项目中所有的文件生成一个大的模块集合
2. 模块执行函数。遇到引入模块时，执行对应的函数。

接下来我们就分别实现这两个部分。

### 3.1 实现模块集合

#### 3.1.1 给文件内容加壳

我们可以看下webpack打包后每个模块的具体内容：

```javascript
  var modules = {
    "./action.js": (module, exports) => {
        // 文件内容
      let action = "making webpack";
      exports.action = action;
    },
  };
```

我们可以发现每个模块实际上就是在外层套上了一个函数的外壳。为什么要把文件内容放入到一个函数中了，这是因为我们都知道模块化最重要的一个特点就是环境隔离，各个模块之间互不影响。试想一下，如果不对文件内容进行隔离处理，而是直接打包到一起，那么各个模块之间定义的变量在同一作用域肯定会互相影响。而函数常常用来形成一个单独的作用域，用来隔离变量。因此，我们首先给所有文件加壳。<br/>
**index.js模块**

```javascript
function(require,exports){
    let action = require("./action.js").action;
    let name = require("./name.js").name;
    let message = `${name} is ${action}`;
    console.log(message);
}
```
**action.js模块**
```javascript
function(require,exports){
    let action = "making webpack";
    exports.action = action;
}
```
**name.js模块**

```javascript
function(require,exports){
    let familyName = require("./family-name.js").name;
    exports.name = `${familyName} 阿尔伯特`;
}
```
**family-name.js模块**。

```javascript
function(require,exports){
    exports.name = "haiyingsitan";
}
```

然后，我们为了区分或者获取这些模块，我们需要给每个模块一个模块id或者模块名称，这里我们直接使用文件路径作为每个模块的id。最后将这些模块组成一个集合。如下所示：
```javascript
const modules = {
  "./index.js":function(require,exports){
    let action = require("./action.js").action;
    let name = require("./name.js").name;
    let message = `${name} is ${action}`;
    console.log(message);
  },
  "./action.js": function (require, exports) {
    let action = "making webpack";
    exports.action = action;
  },
  "./name.js": function (require, exports) {
    let familyName = require("./family-name.js").name;
    exports.name = `${familyName} 阿尔伯特`;
  },
  "./family-name.js": function (require, exports) {
    exports.name = "haiyingsitan";
  }
};
```

也就是说，我们最终要实现的就是这样的一个集合。

到目前为止，我们要实现的功能是：

1. 给每个文件内容加壳
2. 每个模块以路径作为模块id
3. 将所有的模块合在一起形成一个集合

我们看下具体的实现如下：

```javascript
const fs = require("fs");
let modules = {};
const fileToModule = function (path) {
  const fileContent = fs.readFileSync(path).toString();
  return {
    id: path,                             // 这里以路径作为模块id
    code: `function(require,exports){     // 这里加壳了
            ${fileContent.toString()};
        }`,
  };
};
let result = fileToModule("./index.js");
modules[result["id"]] = result.code;
console.log("modules=",modules);
```

输出的结果为：

```javascript
modules= {
    './index.js':'function(require,exports){\n    let action = require("./action.js").action;\r\nlet name = require("./name.js").name;\r\nlet message = `${name} is ${action}`;\r\nconsole.log(message);\r\n;\n  }' 
}
```

从上面我们可以看出，我们成功地将入口文件加壳转化成一个模块，并且给其命名，然后添加到模块对象中去了。但是我们发现我们的文件中其实还依赖了`./action.js`和`./name.js`，然而我们无法获取到他们的模块内容。因此，我们需要处理`require`引入的模块。也就是说要找到当前模块中的所有依赖，然后解析这些依赖将其放入模块集合中。

#### 3.1.2 获取当前模块的所有依赖

接下来我们就是要实现找到一个模块中所有的依赖。

```javascript
// const action = require("./action.js")
function getDependencies(fileContent) {
  let reg = /require\(['"](.+?)['"]\)/g;
  let result = null;
  let dependencies = [];
  while ((result = reg.exec(fileContent))) {
    dependencies.push(result[1]);
  }
  return dependencies;
}
```

这里我们使用了正则判断，只要是`require("")`或者`require('')`这种格式的都当作模块引入进行处理(这种处理有点问题，我们暂时先不管，等到下面进行优化)。然后把所有的引入都放到一个数组中，从而获取到当前模块所有的依赖。
我们使用这个函数查看下入口文件的依赖：

```javascript
const fileContent = fs.readFileSync(path).toString();
let result = getDependencies(fileContent);
console.log(result)  // ["./action.js","./name.js"]
```

我们可以顺利获取到入口文件的所有依赖，接下来我们就是要进一步去解析这些入口文件的依赖了。
因此，我们在文件转化成模块时，最好把模块的所有依赖信息也展示出来方便处理。因此，我们修改一下`fileToModule`这个函数。

```javascript
const fileToModule = function (path) {
  const fileContent = fs.readFileSync(path).toString();
  return {
      id:path,
      dependencies:getDependencies(fileContent),   // 新增模块信息
      code:`(require,exports) => {
            ${fileContent.toString()};
      }`
  }
};
```

好了，到目前为止我们能够获取到每个模块的依赖，同时我们又能够把每个依赖转化成一个对象，那么接下来就是把所有的对象放到一个大的对象中从而得到项目中所有模块的集合。

#### 3.1.3 将所有模块组成一个集合

```javascript
function createGraph(filename) {
  let module = fileToModule(filename);
  let queue = [module];
  
  for (let module of queue) {
    const dirname = path.dirname(module.id);
    module.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const child = fileToModule(absolutePath);
      queue.push(child);
    });
  }
    // 上面得到的是一个数组。转化成对象
  let modules = {}
  queue.forEach((item) => {
    modules[item.id] = item.code;
  })
  return modules;
}
console.log(createGraph("./index.js"));
```

`createGraph`就是根据入口文件，然后依次获取到所有的依赖，每获取一个就将其添加到queue数组中，由于使用let of 进行遍历，let of会继续遍历新添加的元素，而不需要像for循环那样，需要进行处理。
我们看下入口文件最终得到的模块集合:

```javascript
{
    './index.js': 'function(require,exports){ let action = require("./action.js").action;\r\nlet name = require("./name.js").name;\r\nlet message = `${name} is ${action}`;\r\nconsole.log(message);\r\n;\n}',
    'action.js': 'function(require,exports){let action = "making webpack";\r\nexports.action = action;;\n      }',
    'name.js': 'function(require,exports){let familyName = require("./family-name.js").name;\r\nexports.name = `${familyName} 阿尔伯特`;;\n}',
    'family-name.js': 'function(require,exports){exports.name = "haiyingsitan";;\n }'
}
```

### 3.2 执行模块的函数

我们在上面的模块对象中获得了所有模块信息，接下来我们执行入口文件对应的函数`exec`。
![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/67850059038c42baa6633c05861be4dd~tplv-k3u1fbpfcp-watermark.image)
从上图中我们可以看出：当我们执行入口文件对应的函数时`exec(index.js)`，它发现:

- 存在依赖`./action.js`，于是调用`exec("./action.js")`。这时候不存在其他依赖了，那么直接返回值。这条线结束。
- 存在依赖`./name.js`，于是调用`exec("./name.js")`。
  又发现依赖`./family-name.js`,于是调用`exec("./family-name.js")`。这时候不存在其他依赖了，返回值。这条线结束。<br>
  
 我们可以发现其实这就是一个递归的过程，不断查找依赖，然后执行对应的函数。
  因此，我们可以大致写出以下这个函数：
```javascript
const exec = function(moduleId){
  const fn = modules[moduleId];  // 获取到每个id对应的函数
  let exports = {};
  const require = function(filename){
     const dirname = path.dirname(module.id);
     const absolutePath = path.join(dirname, filename);
      return exec(absolutePath);
  }
  fn(require, exports);
  return exports
}
```

注意：上面的`modules[moduleId]`如果按照我们之前的数据结构获取到的实际上是一个字符串，但是我们需要它作为函数执行。因此，我们为了方便查看我们这里稍微修改一下直接文件转模块的代码。

```javascript
const fileToModule = function (path) {
  console.log("path:",path)
  const fileContent = fs.readFileSync(path).toString();
  return {
    id: path,
    dependencies: getDependencies(fileContent),
    code: function(require,exports) {
      eval(fileContent.toString())   // 看这里 里面的内容用eval来执行。外面是函数声明，不是一个字符串了。
    },
  };
};
```

我们不方便去执行一个字符串，因此我们考虑把code声明成一个函数，函数里面是模块的内容，通过`eval`去执行。但是当我们写入文件时不需要这样，这里是为了方便查看。

### 3.3 将打包后的文件写入指定文件

好了，到目前为止我们实现了一个模块打包器所需要的最重要的两个部分：模块集合，以及模块的执行函数。最终完整的代码如下：

```javascript
const fs = require("fs");
const path = require("path");

// 将文件转化成模块对象
const fileToModule = function (path) {
  const fileContent = fs.readFileSync(path).toString();
  return {
    id: path,
    dependencies: getDependencies(fileContent),
    code: function (require, exports) {
      eval(fileContent.toString());
    },
  };
};

// 获取模块的所有依赖
function getDependencies(fileContent) {
  let reg = /require\(['"](.+?)['"]\)/g;
  let result = null;
  let dependencies = [];
  while ((result = reg.exec(fileContent))) {
    dependencies.push(result[1]);
  }
  return dependencies;
}

// 将所有模块以及他们的依赖转化成模块对象
function createGraph(filename) {
  let module = fileToModule(filename);
  let queue = [module];

  for (let module of queue) {
    const dirname = path.dirname(module.id);
    module.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const child = fileToModule(absolutePath);
      queue.push(child);
    });
  }
  let modules = {};
  queue.forEach((item) => {
    modules[item.id] = item.code;
  });
  return modules;
}

let modules = createGraph("./index.js");

// 执行模块函数
const exec = function (moduleId) {
  const fn = modules[moduleId];
  let exports = {};
  const require = function (filename) {
    const dirname = path.dirname(module.id);
    const absolutePath = path.join(dirname, filename);
    return exec(absolutePath);
  };
  fn(require, exports);
  return exports;
};
```

我们从入口文件开始打包，看看能不能得到跟webpack相同的结果。

```javascript
exec("./index.js");  //输出： haiyingsitan 阿尔伯特 is making webpack
```

我们可以发现，顺利地得到了跟webpack相同的结果，成功地实现了模块的打包。
接下来我们要实现的就是把我们的模块打包后生成到一个文件中。

```javascript
function createBundle(modules){
  let __modules = "";
  for (let attr in modules) {
    __modules += `"${attr}":${modules[attr]},`;
  }
  const result = `(function(){
    const modules = {${__modules}};
    const exec = function (moduleId) {
      const fn = modules[moduleId];
      let exports = {};
      const require = function (filename) {
        const dirname = path.dirname(module.id);
        const absolutePath = path.join(dirname, filename);
        return exec(absolutePath);
      };
      fn(require, exports);
      return exports;
    };
    exec("./index.js");
  })()`;
  fs.writeFileSync("./dist/bundle3.js", result);
}
```

`createBundle`函数用于将打包后的文件写入单独的文件中。我们可以看下打包后生成的文件如下：

```javascript
(function () {
  // 模块集合
  const modules = {
    "./index.js": function (require, exports) {
      let action = require("./action.js").action;
      let name = require("./name.js").name;
      let message = `${name} is ${action}`;
      console.log(message);;
    },
    "action.js": function (require, exports) {
      let action = "making webpack";
      exports.action = action;;
    },
    "name.js": function (require, exports) {
      let familyName = require("./family-name.js").name;
      exports.name = `${familyName} 阿尔伯特`;;
    },
    "family-name.js": function (require, exports) {
      exports.name = "haiyingsitan";;
    },
  };
  
  const exec = function (moduleId) {
    const fn = modules[moduleId];
    let exports = {};
    const require = function (filename) {
      const dirname = path.dirname(module.id);
      const absolutePath = path.join(dirname, filename);
      return exec(absolutePath);
    };
    fn(require, exports);
    return exports;
  };
  //入口函数执行
  exec("./index.js");
})()
```

我们可以看到打包后的文件跟webpack打包后的文件基本相同。(注意：由于目前只支持引入自定义模块，对于内置的path等无法引入，因此如果要测试打包后的文件能否正常执行，请手动在文件顶部加上path的引入)。

## 四、进一步优化

### 4.1 使用正则匹配require存在的问题

到目前为止，我们已经能够实现模块的打包生成，但是这里仍然存在一些问题，我在前面**2.2.1获取当前模块的所有依赖**的实现中说到，我们使用`/require\(['"](.+?)['"]\)/g`这个正则来匹配`require`的引入。但是，如果文件中存在符合这条正则但是不是用于引入的内容了。比如：

```javascript
const str = `require('随便写的')`;
const str = /require\(['"](.+?)['"]\)/g;
console.log(re.exec(str))//  这里也能够正确匹配
```

我们发现上面的字符串也能够正确匹配我们的正则，但是这个字符串并不是一个`require`引入。但是它会被当作引入进行处理，从而导致报错。可能有人会说我们可以写更好的正则，区分更多的情况，但是再好的正则也无法兼容所有的情况，那么有没有什么方法能够完全正确地区分用于引入的require和其他的require了。我们可以参考webpack它是怎么能够正确识别的。关键就是使用`babel`。

### 4.2 引入babel

关于`babel`的原理啥的大家可以去找其他文章看。这里大家简单地记住babel的核心就是**解析(parse)**，**转换(transform)**，**生成(generate)** 这三个步骤，如下图所示。
![babel](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bdf39441b9144167b15bf56f925dea05~tplv-k3u1fbpfcp-watermark.image)

通过将代码解析成抽象语法树(AST)，然后我们就可以对我们想要的节点进行操作，转换成新的AST，然后再生成新的代码。这里可能大家会觉得复杂，但是我们不涉及babel底层的原理，只是简单应用它的转换功能，因此不需要深究。我们可以在[AST Explore](https://astexplorer.net/)中查看一下如何将代码转换成AST。以下面这段代码为例：

```javascript
let action = require("./action.js");
```

![ast](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f1fa0ec472b34429b1e6688374bb3be2~tplv-k3u1fbpfcp-watermark.image)

我们可以发现，`babel`将上面代码转换成ast后，我们可以准确地获取到`require`这个节点的类型为`CallExpression`，节点的`name`为`require`，参数的value为`./action.js`，这样的话就能够正确区分出用于引用的`require`和作为值或者变量的`require`了。因此，我们需要修改一下获取依赖的这个函数的实现：

**修改前：**

```javascript
function getDependencies(fileContent) {
  let reg = /require\(['"](.+?)['"]\)/g;
  let result = null;
  let dependencies = [];
  while ((result = reg.exec(fileContent))) {
    dependencies.push(result[1]);
  }
  return dependencies;
}
```

**修改后：**

```javascript
function getDependencies(filePath) {
  let result = null;
  let dependencies = [];
  const fileContent = fs.readFileSync(filePath).toString();
  // parse
  const ast = parse(fileContent, { sourceType: "CommonJs" });
  // transform
  traverse(ast, {
    enter: (item) => {
      if (
        item.node.type === "CallExpression" &&
        item.node.callee.name === "require"
      ) {
        const dirname = path.dirname(filePath);
        dependencies.push(path.join(dirname, item.node.arguments[0].value));
        console.log("dependencies", dependencies);
      }
    },
  });
  return dependencies;
}
```

我们通过babel的parse获取到ast后，然后查找每个节点的类型是否是`CallExpression`，同时节点的名字是否是`require`，如果同时满足，说明这个require是一个函数，用于引入模块的。那么我们就可以把它的参数作为依赖放入数组中保存起来。

### 4.3 解决模块之间互相依赖的问题

我们知道模块之间可以互相引用，比如name.js模块引入了family-name.js模块。而在family.js模块中又引入了name.js模块。如下图所示：

**name.js模块**

```javascript
let familyName = require("./family-name.js").name;    // 引入了family-name.js模块
exports.name = `${familyName} 阿尔伯特`;
```

**family-name.js模块**

```javascript
const name1 = require("./name.js");    // 引入了family-name.js模块
exports.name = "haiyingsitan";
```

这时候会带来问题。由于我们在**2.1.3将所有模块组成一个集合**中生成模块对象。使用for of遍历模块集合，如果存在依赖就将其转换成模块添加到模块集合中，由于互相依赖会导致一开始把模块`family.js`添加到模块中，然后又把`name.js`添加到模块对象中，然后`name.js`中又依赖`family.js`又需要把重复的`family.js`模块添加进去，这样的话会导致模块集合无限循环下去。

```javascript
function createGraph(filename) {
  let module = fileToModule(filename);
  let queue = [module];
  
  for (let module of queue) {
    const dirname = path.dirname(module.id);
    module.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
       // 看这里，会不断地创建依赖
      const child = fileToModule(absolutePath);
      queue.push(child);
    });
  }
    // 上面得到的是一个数组。转化成对象
  let modules = {}
  queue.forEach((item) => {
    modules[item.id] = item.code;
  })
  return modules;
}
```

如下图所示：最终会导致模块集合不断地出现重复的模块`name.js`和`family.js`，导致循环永远不会终止下去。

![循环嵌套问题](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8edc87a711e6468dbaf7bbab52ae9d9e~tplv-k3u1fbpfcp-watermark.image)
我们可以发现：实际上出现这种问题的根本是不断地往模块集合中添加重复的模块，因此我们可以在添加之前判断是否是重复的模块，如果是就不往其中进行添加,从而避免不断循环下去。实现如下：

```javascript
function createGraph(filename) {
  let module = fileToModule(filename);
  let queue = [module];

  for (let module of queue) {
    const dirname = path.dirname(module.id);
    module.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      // 看这里看这里   判断一下模块集合中是否已经存在这个模块
      const result = queue.every((item) => {
        return item.id !== absolutePath;
      });
      if (result) {
          // 不存在，直接添加
        const child = fileToModule(absolutePath);
        queue.push(child);
      } else {
          // 存在终止本次循环
        return false;
      }
    });
  }
  let modules = {};
  queue.forEach((item) => {
    modules[item.id] = item.code;
  });
  return modules;
}
```



## 五、总结

好了，到目前为止，我们已经能够实现一个简易的webpack打包器了。最终的代码如下：

```javascript
const fs = require("fs");
const path = require("path");
const {parse} = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// 1.加壳
const fileToModule = function (path) {
  const fileContent = fs.readFileSync(path).toString();
  return {
    id: path,
    dependencies: getDependencies(path),
    code: `function (require, exports) {
      ${fileContent};
    }`,
  };
};
// 2.获取依赖
function getDependencies(filePath) {
  let result = null;
  let dependencies = [];
  const fileContent = fs.readFileSync(filePath).toString();
  // parse
  const ast = parse(fileContent, { sourceType: "CommonJs" });
  // transform
  traverse(ast, {
    enter: (item) => {
      if (
        item.node.type === "CallExpression" &&
        item.node.callee.name === "require"
      ) {
        const dirname = path.dirname(filePath);
        dependencies.push(path.join(dirname, item.node.arguments[0].value));
        console.log("dependencies", dependencies);
      }
    },
  });
  return dependencies;
}
// 3. 将所有依赖形成一个集合
function createGraph(filename) {
  let module = fileToModule(filename);
  let queue = [module];

  for (let module of queue) {
    const dirname = path.dirname(module.id);
    module.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      console.log("queue:",queue);
      console.log("absolutePath:",absolutePath);
      const result = queue.every((item) => {
        return item.id !== absolutePath;
      });
      if (result) {
        const child = fileToModule(absolutePath);
        queue.push(child);
      } else {
        return false;
      }
    });
  }
  let modules = {};
  queue.forEach((item) => {
    modules[item.id] = item.code;
  });
  return modules;
}

let modules = createGraph("./index.js");
// 4. 执行模块
const exec = function (moduleId) {
  const fn = modules[moduleId];
  let exports = {};
  const require = function (filename) {
    const dirname = path.dirname(module.id);
    const absolutePath = path.join(dirname, filename);
    return exec(absolutePath);
  };
  fn(require, exports);
  return exports;
};
// exec("./index.js");
// 5. 写入文件
function createBundle(modules){
  let __modules = "";
  for (let attr in modules) {
    __modules += `"${attr}":${modules[attr]},`;
  }
  const result = `(function(){
    const modules = {${__modules}};
    const exec = function (moduleId) {
      const fn = modules[moduleId];
      let exports = {};
      const require = function (filename) {
        const dirname = path.dirname(module.id);
        const absolutePath = path.join(dirname, filename);
        return exec(absolutePath);
      };
      fn(require, exports);
      return exports;
    };
    exec("./index.js");
  })()`;
  fs.writeFileSync("./dist/bundle3.js", result);
}

createBundle(modules);

```

我们可以发现最终的实现过程其实就是：
- 加壳，将文件转换成模块
- 获取每个模块的依赖
- 将所有模块形成一个大的模块集合
- 执行模块的函数
- 写入文件

通过上面的分析，从零开始一步一步地去实现一个简单的webpack模块打包器，远比你自己去看webpack源码，更加简单而且更加印象深刻。当然，目前我们的打包器功能肯定并不完善，比如我们目前不支持内置的引入，不支持ES6语法的转换，不支持css等的引入。但是这些功能我们都可以逐步去实现。真正重要的是，我们对类似webpack这种打包器的原理不再是完全不理解了(毕竟我们都实现了跟它相同的功能了)，接下来如果想要深入研究，只是在上面添加功能罢了。
完结撒花。

## 六、参考资料

1. [AST Explore](https://astexplorer.net/)
2. [babel-parse](https://babel.docschina.org/docs/en/babel-parser)
3. [手写简易模块打包器](https://zhuanlan.zhihu.com/p/257046071)

