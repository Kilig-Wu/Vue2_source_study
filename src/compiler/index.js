import { parseHTML } from "./parse";

function getProps(attrs) {
    let str = '' //{name, value}
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];
        if (attr.name === 'style') {
            // color: red => { color: 'red' }
            attr.value = attr.value.split(';').reduce((target, item) => { //qs库解析也行
                let [key, value] = item.split(':');
                target[key] = value
                return target
            }, {});

        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`
    }
    return `{${str.slice(0, -1)}}`   //删除最后一个逗号
}

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g   //{{ aaa }}   //匹配到的内容就是表达式的变量
function gen(node) {
    if (node.type === 1) {
        //是元素
        return codegen(node)
    } else {
        //文本
        let text = node.text;
        if (!defaultTagRE.test(text)) {
            return `_v(${JSON.stringify(text)})`
        } else {
            //_v(_s(name) + 'hello' + _s(name))
            let tokens = [];
            let match;
            defaultTagRE.lastIndex = 0;   //exec捕获清零，重置位置
            let lastIndex = 0;
            while (match = defaultTagRE.exec(text)) {
                let index = match.index;   //匹配到变量的位置{{name}} hello {{ age }} hello;
                if (index > lastIndex) {   
                    tokens.push(JSON.stringify(text.slice(lastIndex, index)))  //得到通配符中间的文本
                }
                tokens.push(`_s(${match[1].trim()})`);
                lastIndex = index + match[0].length
            }
            if(lastIndex < text.length) {   //防止最后一个通配符后还有文本
                tokens.push(JSON.stringify(text.slice(lastIndex)))
            }
            return `_v(${tokens.join('+')})`
        }
    }
}
function getChildren(children) {
    return children.map(child => gen(child)).join(',')
}
function codegen(ast) {
    let children = getChildren(ast.children);
    let code = ` _c('${ast.tag}', ${ast.attrs.length > 0 ? getProps(ast.attrs) : 'null'}${ast.children.length ? `,${children}` : ''})`;
    return code
}

//vue3采用的不是正则
export function compileToFunction(template) {
    //1.就是将template转化成ast语法树
    let ast = parseHTML(template);
    
    //2.生成render方法（render方法执行后的返回结果就是虚拟Dom）
    //模板引擎的实现原理就是with + new Function
    let code = codegen(ast);
    code = `with(this){return ${code}}`   //with的用法
    let render = new Function(code); //根据代码生成render函数
    return render
}