// 模块执行函数，用来执行每个模块对应的函数
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

const exec = function(moduleId){
  const moduleFn = modules[moduleId];
  const require = function(){
      // 实现require解析
  }
  // 获取这个模块的导出信息
  let exports = {}

  moduleFn(require,exports);
}

exec("./index.js")