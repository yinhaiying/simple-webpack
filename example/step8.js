const fs = require("fs");
const path = require("path");
const {parse} = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const fileToModule = function (path) {
  const fileContent = fs.readFileSync(path).toString();
  return {
    id: path,
    dependencies: getDependencies(fileContent),
    code: `function (require, exports) {
      ${fileContent};
    }`,
  };
};

function getDependencies(fileContent) {
  let result = null;
  let dependencies = [];
  // parse
  const ast = parse(fileContent, { sourceType: "CommonJs" });
  // transform
  traverse(ast, {
    enter: (item) => {
      if (item.node.type === "CallExpression" && item.node.callee.name === "require") {
        const dirname = path.dirname(module.id);
        dependencies.push(path.join(dirname, item.node.arguments[0].value));
      }
    },
  });
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
  let modules = {};
  queue.forEach((item) => {
    modules[item.id] = item.code;
  });
  return modules;
}

let modules = createGraph("./index.js");
console.log("modules:",modules)
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
// exec("./index.js");

function createBundle(modules){
  let __modules = "";
  for (let attr in modules) {
    __modules += `"${attr}":${modules[attr]},`;
  }
  const result = `(function(){
    const modules = {${__modules}};
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
  })()`;
  fs.writeFileSync("./dist/bundle3.js", result);
}


createBundle(modules);


