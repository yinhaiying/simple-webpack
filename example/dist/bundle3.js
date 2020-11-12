(function(){
    const modules = {"./index.js":function (require, exports) {
       eval(fileContent.toString());
    },"action.js":function (require, exports) {
       eval(fileContent.toString());
    },"name.js":function (require, exports) {
       eval(fileContent.toString());
    },"family-name.js":function (require, exports) {
       eval(fileContent.toString());
    },};
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
  })()