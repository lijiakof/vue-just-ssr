'use strict'
var fs = require('fs');
var path = require('path');

// 定义 node 端的全局 Vue
global.Vue = require('vue');
// 获取 HTML 布局
var layout = fs.readFileSync('./index.html', 'utf8');
// 创建渲染器
var renderer = require('vue-server-renderer').createRenderer();
// 创建 Express 服务器
var express = require('express');
var server = express();

// 部署静态文件夹 /assets
server.use('/assets', express.static(path.resolve(__dirname, 'assets')));

// 处理所有的 get 请求
server.get('*', function(request, response){
	// 渲染 Vue 应用为字符串
    renderer.renderToString(
        require('./assets/app')(),
        function(error, html) {
            if(error){
                console.error(error);
                return response.status(500).send('Server Error');
            }
            // 返回 HTML 文件
            response.send(layout.replace('<div id="app"></div>', html));
        }
    );
});

// 监听 5001 端口
server.listen(5001, function(error){
    if(error) throw error
    console.log('Server is running at localhost:5001');
})