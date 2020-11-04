(function (modules) {
  function exec(id) {
    let [fn, mapping] = modules[id];
    let exports = {};
    fn && fn(require, exports);
    function require(path) {
      console.log("exports:", exports);
      return exec(mapping[path]);
    }
    console.log("exports:", exports);
    return exports;
  }
  exec(0);
})({
  4: [
    function (require, exports, module) {
      let action = require("./action.js").action;
      let name = require("./name.js").name;
      let message = `${name} is ${action}`;
      console.log(message);
    },
    { "./action.js": 5, "./name.js": 6 },
  ],
  5: [
    function (require, exports, module) {
      let action = "making webpack";
      exports.action = action;
    },
    {},
  ],
  6: [
    function (require, exports, module) {
      let familyName = require("./family-name.js").name;
      exports.name = `${familyName} Rou`;
    },
    { "./family-name.js": 7 },
  ],
  7: [
    function (require, exports, module) {
      exports.name = "haiyingsitan";
    },
    {},
  ],
});
