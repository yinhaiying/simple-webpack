(() => {
    // 获取所有的依赖
  var __webpack_modules__ = {
    "./action.js": (__unused_webpack_module, exports) => {
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
