// 得到模块对象
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