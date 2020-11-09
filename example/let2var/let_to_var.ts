import {parse} from "@babel/parser"
import traverse from "@babel/traverse"
import generate from "@babel/generator"

const code = `let a = "let";let b = 2`;


// 把代码变成AST
const ast = parse(code,{sourceType:"module"});
console.log("ast:",ast);

// 遍历AST