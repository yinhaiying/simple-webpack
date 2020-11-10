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