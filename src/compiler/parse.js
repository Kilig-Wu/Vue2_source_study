const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);   //匹配到的是一个开始标签名<div
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)  //匹配到的是一个结束标签名</div
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;  //匹配属性,第一个分组是属性的key value就是分组3/分组4/分组5
const startTagClose = /^\s*(\/?)>/;   //<div><br />  //开始标签的结束

//解析html生成抽象dom树（也有解析html的包：htmlparser2）
export function parseHTML(html) {   //html最开始肯定是<
    const ELEMENT_TYPE = 1;
    const TEXT_TYPE = 3;
    const stack = [];   //用于存放元素
    let currentParent;  //指向栈中最后一个
    let root;   //当前树的根节点

    //最终需要转化成一颗抽象语法树（父元素下有子元素）
    function createASTElement(tag, attrs) {
        return {
            tag,
            type: ELEMENT_TYPE,
            children: [],
            attrs,
            parent: null
        }
    }
    //利用栈型结构 来构造一棵树
    function start(tag, attrs) {
        let node = createASTElement(tag, attrs);
        if (!root) {    //看一下是否是空树
            root = node   //如果为空则当前是树的根节点
        }
        if(currentParent) {
            node.parent = currentParent;   //只赋予了parent属性
            currentParent.children.push(node);   //还需要让父亲记住自己
        }
        stack.push(node);
        currentParent = node;  //currentParent为栈中最后一个
    }
    function chars(text) {   //文本直接放到当前指向的节点中
        text = text.replace(/\s/g, '')  //如果空格超过两个就删除两个以上的
        text && currentParent.children.push({ type: TEXT_TYPE, text, parent: currentParent })

    }
    function end(tag) {
        let node = stack.pop(); //弹出最后一个, 校验标签是否合法
        currentParent = stack[stack.length - 1]
    }
    function advance(n) {
        html = html.substring(n)
    }
    function parseStartTag() {
        const start = html.match(startTagOpen)
        if (start) {
            const match = {
                tagName: start[1],  //标签名
                attrs: []
            }
            advance(start[0].length)

            //如果不是开始标签的结束,就一直匹配下去
            let attr, end;
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                advance(attr[0].length)
                match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] || true })  //style的name,value需要去除空格
            }
            if (end) {
                advance(end[0].length)
            }
            return match
        }
        return false;  //不是开始标签

    }
    while (html) {
        //如果textEnd=0 说明是一个开始标签或者结束标签
        //如果textEnd>0 说明是文本的结束位置
        let textEnd = html.indexOf('<')   //如果indexOf的索引是0 则说明是个标签
        if (textEnd == 0) {
            const startTagMatch = parseStartTag();
            if (startTagMatch) {  //解析到的开始标签
                start(startTagMatch.tagName, startTagMatch.attrs)
                continue;
            }
            let endTagMatch = html.match(endTag);
            if (endTagMatch) {    //解析到的结束标签
                advance(endTagMatch[0].length);
                end(endTagMatch[1])
                continue;
            }
        }
        if (textEnd > 0) {
            let text = html.substring(0, textEnd)  //文本内容
            if (text) {
                chars(text);
                advance(text.length);  //解析到的文本
            }
        }
    }
    return root
}