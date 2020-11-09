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