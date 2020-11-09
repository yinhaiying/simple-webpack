

## babel的原理
1. parse:把代码code编程AST
2. traverse:遍历AST进行修改
3. genetrate:把AST变成代码code2
即：code --(1) -> ast  --(2)  -> ast2  --(3)  -> code2

## 为什么要使用AST
1. 使用正则表达式替换可能会带来问题，比如let a = "let"，这个后面的let你能准确识别它是一个字符串还是变量定义吗？
可能会将字符串let变成了字符串var。
2. 因此，你需要是被每个单词的意思，才能做到只修改用于声明变量的let。
3. 而AST能够明确地告诉你每个let的意思。

### 手动实现把ES6转换成ES5
```javascript
import {parse} from "@babel/parser"
import traverse from "@babel/traverse"
import generate from "@babel/generator"
const code = `let a = "let";let b = 2`;
// 把代码变成AST
const ast = parse(code,{sourceType:"module"});
// 遍历AST
traverse(ast,{
    // enter钩子函数表示每进入一个节点的时候就执行这个函数,item是每个节点的信息
    enter:item => {
      if(item.node.type === "VariableDeclaration"){
         if(item.node.kind === "let"){
           item.node.kind = "var";
         } 
      }
    }
})
// 将AST生成code2
const output = generate(
    ast,
    {},
    code
)
console.log(output.code)
console.log(output.map)
```

### 如何实现自动把ES6转换成ES5
```javascript
import {parse} from "@babel/parser";
import * as babel from "@babel/core";

const code = `let a = "let";let b = 2;const c = 3`;
const ast = parse(code,{sourceType:"module"});

const result = babel.transformFromAstSync(ast,code,{
    presets:["@babel/preset-env"]
});

```

### 如何实现把一个ES6的文件自动转化为ES5的文件
```javascript
import {parse} from "@babel/parser";
import * as babel from "@babel/core";

// @ts-ignore
import * as fs from "fs";

const code = fs.readFileSync("./test.js").toString();
const ast = parse(code,{sourceType:"module"});

const result = babel.transformFromAstSync(ast,code,{
    presets:["@babel/preset-env"]
});

fs.writeFileSync("./test.es5.js",result.code);

```