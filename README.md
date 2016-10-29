# Vue Server Side Render
服务器端渲染不仅对 SEO 友好，并且在 WEB 的性能上有很大提高。要做到这一点，我们只需要这样做：

* 安装 vue 以及 vue-server-renderer；
* 创建 Vue 应用程序；
* 创建 index.html 入口页面；
* 创建 node 服务；

## 安装依赖项
安装如下依赖项：

```
npm install vue --save
npm install express --save
npm install vue-server-renderer --save
```

## 引入独立构件 vue.js

```
assets/vue.js
```

## 创建程序

```
// assets/app.js
(function() {
    var createApp = function(){

        return new Vue({
            template: '<div id="app">Hello {{counter}}' +
                        '<div v-for="item in list">{{item}}</div>' +
                    '</div>',
            data: {
                counter: 0,
                list: ['Shun', 'Jay']
            },
            methods: {
            },
            created: function(){
                var vm = this;
                setInterval(function(){
                    vm.counter += 1;
                }, 1000);
            }
        });
        
    }

    if(typeof module !== 'undefined' && module.exports) {
        module.exports = createApp;
    } else {
        this.app = createApp();
    }
}).call(this);
```

## 创建入口页

```
<!-- index.html -->
<!DOCTYPE html>
<html>
    <head>
        <title>Vue SSR</title>
        <script src="assets/vue.js"></script>
    </head>
    <body>
        <div id="app"></div>
        <script src="assets/app.js"></script>
        <script>app.$mount('#app')</script>
    </body>
</html>
```

## 创建 node 服务，启动服务端渲染

```
// server.js
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
```

这样就可以通过 node 运行 server.js 来开启这个服务：

```
node server.js
```

## 流式渲染
Vue还支持流式渲染，优先选择适用于支持流的Web服务器。允许HTML一边生成一般写入相应流，而不是在最后一次全部写入。其结果是请求服务速度更快，没有缺点！

我们只需要对上面的 server.js 稍作改动：

```
// server.js
'use strict'
var fs = require('fs');
var path = require('path');

global.Vue = require('vue');

var layout = fs.readFileSync('./index.html', 'utf8');

var renderer = require('vue-server-renderer').createRenderer();

var express = require('express');
var server = express();

server.use('/assets', express.static(path.resolve(__dirname, 'assets')));

var layoutSections = layout.split('<div id="app"></div>');
var preAppHTML = layoutSections[0];
var postAppHTML = layoutSections[1];

server.get('*', function(request, response){
	var stream = renderer.renderToStream(require('./assets/app')());
        response.write(preAppHTML);
        stream.on('data', function (chunk) {
            response.write(chunk)
    });
    
    stream.on('end', function () {
        response.end(postAppHTML)
    });
	
	stream.on('error', function (error) {
		console.error(error);
		
		return response
        .status(500)
        .send('Server Error');
	})
});

server.listen(5001, function(error){
    if(error) throw error
    console.log('Server is running at localhost:5001');
})
```