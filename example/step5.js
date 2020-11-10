const fs = require("fs");
const path = require("path");

const fileToModule = function (path) {
  console.log("path:",path)
  const fileContent = fs.readFileSync(path).toString();
  return {
    id: path,
    dependencies: getDependencies(fileContent),
    code: function(require,exports) {
      eval(fileContent.toString())
      },
  };
};

// const action = require("./action.js")

function getDependencies(fileContent) {
  let reg = /require\(['"](.+?)['"]\)/g;
  let result = null;
  let dependencies = [];
  while ((result = reg.exec(fileContent))) {
    console.log("result:",result);
    dependencies.push(result[1]);
  }
  return dependencies;
}

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

let modules = createGraph("./index.js");
// require("./action.js");   相当于执行exec("./action.js")
const exec = function(moduleId){
  const fn = modules[moduleId];
  let exports = {};
  const require = function(filename){
    console.log("这里执行了吗?")
     const dirname = path.dirname(module.id);
     const absolutePath = path.join(dirname, filename);
      return exec(absolutePath);
  }
  fn(require, exports);
  return exports
}

exec("./index.js");