const fs = require("fs");
const path = require("path");
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
        id: path,
        dependencies: getDependencies(fileContent),
        code: `function(require,exports){
            ${fileContent.toString()};
      }`,
    };
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

// let result = fileToModule("./index.js");
// modules[result["id"]] = result.code;
// console.log("modules:", modules);
function createGraph(filename) {
    let module = fileToModule(filename);
    let queue = [module];
    //   console.log("queue:",queue);
    // 使用let of 进行遍历，是因为我们在遍历过程中会往数组中添加元素，而let of会继续遍历新添加的元素，而不需要像for循环那样，需要进行处理。
    for (let module of queue) {
        const dirname = path.dirname(module.id);
        module.map = {}
        module.dependencies.forEach((relativePath) => {
            const absolutePath = path.join(dirname, relativePath);
            const child = fileToModule(absolutePath);
            module.map[relativePath] = relativePath;
            queue.push(child);
        });
    }
    let modules = {};
    queue.forEach((item) => {
        modules[item.id] = item.code;
    });
    return modules;
}


let result = createGraph("./index.js");
console.log("result:", result);

let obj = {
    './index.js': 'function(require,exports){ let action = require("./action.js").action;\r\nlet name = require("./name.js").name;\r\nlet message = `${name} is ${action}`;\r\nconsole.log(message);\r\n;\n}',
    'action.js': 'function(require,exports){let action = "making webpack";\r\nexports.action = action;;\n      }',
    'name.js': 'function(require,exports){let familyName = require("./family-name.js").name;\r\nexports.name = `${familyName} 阿尔伯特`;;\n}',
    'family-name.js': 'function(require,exports){exports.name = "haiyingsitan";;\n }'
}