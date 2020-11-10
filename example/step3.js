const fs = require("fs");
// const modules = {
//   "./index.js":function(require,exports){
//     let action = require("./action.js").action;
//     let name = require("./name.js").name;
//     let message = `${name} is ${action}`;
//     console.log(message);
//   },
//   "./action.js": function (require, exports) {
//     let action = "making webpack";
//     exports.action = action;
//   },
//   "./name.js": function (require, exports) {
//     let familyName = require("./family-name.js").name;
//     exports.name = `${familyName} 阿尔伯特`;
//   },
//   "./family-name.js": function (require, exports) {
//     exports.name = "haiyingsitan";
//   }
// };

let modules = {};
const fileToModule = function (path) {
  const fileContent = fs.readFileSync(path).toString();
  return {
      id:path,
      dependencies:getDependencies(fileContent),
      code:`function(require,exports){
            ${fileContent.toString()};
      }`
  }
};


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


let result = fileToModule("./index.js");
modules[result["id"]] = result.code;
console.log("modules:",modules)


