(() => {
  var __webpack_modules__ = {
    "./action.js": (__unused_webpack_module, exports) => {
      eval(
        'let action = "making webpack";\r\nexports.action = action;\n\n//# sourceURL=webpack://example/./action.js?'
      );
    },
    "./family-name.js": (__unused_webpack_module, exports) => {
      eval(
        'exports.name = "haiyingsitan";\n\n//# sourceURL=webpack://example/./family-name.js?'
      );
    },
    "./name.js": (__unused_webpack_module, exports, __webpack_require__) => {
      eval(
        'let familyName = __webpack_require__(/*! ./family-name.js */ "./family-name.js").name;\r\nexports.name = `${familyName} 阿尔伯特`;\n\n//# sourceURL=webpack://example/./name.js?'
      );
    },
  };

  var __webpack_module_cache__ = {};

  function __webpack_require__(moduleId) {
    if (__webpack_module_cache__[moduleId]) {
      return __webpack_module_cache__[moduleId].exports;
    }
    var module = (__webpack_module_cache__[moduleId] = {
      exports: {},
    });
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
  }

  (() => {
    eval(
      'let action = __webpack_require__(/*! ./action.js */ "./action.js").action;\r\nlet name = __webpack_require__(/*! ./name.js */ "./name.js").name;\r\nlet message = `${name} is ${action}`;\r\nconsole.log(message);\r\n\n\n//# sourceURL=webpack://example/./index.js?'
    );
  })();
})();
