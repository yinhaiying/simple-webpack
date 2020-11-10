

## 一、模块打包器
### 1.1 什么是模块打包器
我们看官网对`webpack`的定义：webpack 是一个现代 JavaScript 应用程序的**静态模块打包器(module bundler)**。当 webpack 处理应用程序时，它会递归地构建一个依赖关系图(dependency graph)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个bundle。更加通俗地理解就是：每个文件就是一个模块，一个文件中又会引入其他文件的内容，我们最终要实现的就是以某i一个文件为入口：将它所有依赖的文件最终打包成一个文件，这就是**模块打包器**。
### 1.2 使用webpack打包后的文件
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
  };

  // 根据模块id解析依赖
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
我们可以发现，最终打包后就是一个立即执行函数。这个函数由三部分组成：
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
2. 模块依赖解析器
模块依赖解析器就是根据每个模块的模块id，然后逐渐获取到这个模块的所有依赖，最终获取到导出的exports值。
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
也就是说我们需要一个执行模块的函数。
```javascript
  let entryFn = () => {
    let action = __webpack_require__("./action.js").action;
    let name = __webpack_require__("./name.js").name;
    let message = `${name} is ${action}`;
    console.log(message);
  };
  entryFn();
```
好了，到目前为止，我们基本知道了webpack模块打包后生成的文件是什么样的，如果我们想要实现同样的功能，只需要同时实现：模块集合，模块依赖解析器和入口函数立即执行即可。其中最关键的就是实现模块集合和模块依赖解析器。

## 二、具体实现
### 2.1 实现模块集合
我们可以看下每个模块的具体内容：
```javascript
  var modules = {
    "./action.js": (module, exports) => {
        // 文件内容
      let action = "making webpack";
      exports.action = action;
    },
  };
```
事实上，模块打包器就是把文件的内容放入到一个函数中作为一个模块，然后给这个模块一个模块id(这里是直接以路径作为模块id)。为什么要把文件放入到一个函数中了，这是因为我们都知道模块化最重要的一个特点就是环境隔离，各个模块之间互不影响，试想一下，如果不对文件内容进行处理，而是直接打包到一起，那么各个模块之间定义的变量在同一作用域肯定会互相影响。而函数常常用来形成一个单独的作用域，用来隔离变量。因此，我们首先给所有文件加壳。
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
然后，将这些模块组成一个集合。这里我们直接使用序号作为每个模块的id。
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
接下来我们看下如何去实现将每个文件转化成模块，最终得到一个模块集合。
```javascript
const fs = require("fs");
let modules = {};
const fileToModule = function (path) {
  const fileContent = fs.readFileSync(path).toString();
  return {
    id: path,
    code: `function(require,exports){
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
modules= { './index.js':
   'function(require,exports){\n    let action = require("./action.js").action;\r\nlet name = require("./name.js").name;\r\nlet message = `${name} is ${action}`;\r\nconsole.log(message);\r\n;\n  }' }
```
从上面我们可以看出，我们成功地将入口文件转化成一个模块，并且将其添加到模块对象中去了。但是我们发现我们的文件中其实还依赖了`./action.js`和`./name.js`，但是我们无法获取到他们的内容。因此，我们需要处理下`require`引入的模块。也就是说要找到当前模块中的所有依赖，然后解析这些依赖将其放入模块集合中。

### 2.2 模块依赖解析器
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
好了，到目前为止我们能够获取到每个模块的依赖，同时我们又能够把每个依赖转化成一个对象，那么接下来就是把所有的
对象组成一个大的模块对象。
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
  let modules = {}
  queue.forEach((item) => {
    modules[item.id] = item.code;
  })
  return modules;
}
console.log(createGraph("./index.js"));
```
`createGraph`就是根据入口文件，然后一次获取到所有的依赖，每获取一个就将其添加到queue数组中，由于使用let of 进行遍历，let of会继续遍历新添加的元素，而不需要像for循环那样，需要进行处理。
我们看下入口文件最终得到的模块集合:
```javascript
{
    './index.js': 'function(require,exports){ let action = require("./action.js").action;\r\nlet name = require("./name.js").name;\r\nlet message = `${name} is ${action}`;\r\nconsole.log(message);\r\n;\n}',
    'action.js': 'function(require,exports){let action = "making webpack";\r\nexports.action = action;;\n      }',
    'name.js': 'function(require,exports){let familyName = require("./family-name.js").name;\r\nexports.name = `${familyName} 阿尔伯特`;;\n}',
    'family-name.js': 'function(require,exports){exports.name = "haiyingsitan";;\n }'
}
```

### 2.3 执行模块的函数
我们在上面的模块对象中获得了所有模块信息，接下来我们执行入口文件对应的函数`exec`。
![](https://ftp.bmp.ovh/imgs/2020/11/16c8cca17aba885b.jpg)。
从上图中我们可以看出：当我们执行入口文件对应的函数时`exec(index.js)`，它发现:
- 存在依赖`./action.js`，于是调用exec("./action.js")。这时候不存在其他依赖了，那么直接返回值。
- 存在依赖`./name.js`，于是调用`exec("./name.js")`。
又发现依赖`./family-name.js`,于是调用`exec("./family-name.js")`。这时候不存在其他依赖了，返回值。这条线结束。
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
注意：上面的`modules[moduleId]`如果按照我们之前的数据结构获取到的实际上是一个字符串，但是我们需要它作为函数执行。因此，我们需要稍微修改一下直接文件转模块的代码。
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
我们不方便去执行一个字符串，因此我们考虑把code声明成一个函数，函数里面是模块的内容，通过`eval`去执行。

### 2.4 小结
好了，到目前为止我们实现了一个模块打包器所需要的三个部分：模块集合，模块解析器以及模块的执行函数。最终完整的代码如下：
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
