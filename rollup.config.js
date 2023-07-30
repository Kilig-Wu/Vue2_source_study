//rollup默认可以导出一个对象
import babel from 'rollup-plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
export default {
    input: './src/index.js',   
    output: {
        file: './dist/vue.js',  //出口
        name: 'Vue',
        format: 'umd',    //esm:es6模块  commonjs模块  iife    umd
        sourcemap: true   //希望可以调试源代码
    },
    plugins: [  //插件
        babel({   //默认去取.babelrc文件
            exclude: 'node_modules/**'  //排除node_modules
        }),
        resolve()
    ]
}

//为什么vue2只支持ie9以上 因为Object.defineProperty不支持低版本
//vue3也没有替代方案