#!/usr/bin/env node
const {isDev,dev,pro} = require('./config');
const config = isDev ? dev : pro;
let {serverHost,host,serverPort} = config;
let net = require('net');
let io = require('socket.io-client');
let request = require('request');
var prompt = require('prompt');
//const serverHost = "http://localhost";

//
// Start the prompt
//
prompt.start();

//
// Get two properties from the user: username and password
//
prompt.get([{
    name: 'port',
    message: '请输入您的端口号：如（8080）',
    required: true
}, {
    name: 'key',
    message: '请输入您的key ， 如果没有请打http://wwww.wkdl.ltd 注册获取',
    required: true,
}], function (err, result) {
    //
    // Log the results.
    //
    new Client(result);
    return true;
});


class Client{
    constructor({key,port}){
        this.listenPort = port;
        this.getHost(key);
    }
    getHost(key){
        request.get(`${host}/client/getHost?key=${key}`,(err,response,body)=>{
            if(err){
                console.log(err);
                return false;
            }
            let {code,result,message} = JSON.parse(body);
            if(code === 100){
                let {host} = result;
                this.connect(host,key);
                return console.log(`您的访问域名：http://${host}.wkdl.ltd`);
            }
            return console.log(message);
        })
    }
    connect(host,key){
        //var socket = io('http://120.24.169.84:3838');
        let socket = io(`${serverHost}:${serverPort}?host=${host}&key=${key}`, {"force new connection":true});
        let client = {};
        socket.on('disconnect', () => {
            console.log('断开');
        });
  /*      socket.on('message/headerEnd', (data) => {
            console.log('浏览器告诉我结束了。。。。');
            let {name} = data;
            socket.emit('message/end', {
                name: name,
                buffer: null
            })
        });*/
        socket.on('connect', () => {
            console.log('socket.io server connected');
            socket.on('message', data => {
                let {name,buffer} = data;
                let clientFree = client[name];
                if (!name) {
                    return;
                }
                if (clientFree) {
                    clientFree.write(buffer);
                } else {
                    clientFree = new net.Socket();
                    clientFree.connect(this.listenPort, '127.0.0.1', function () {
                        //写到浏览器
                        clientFree.write(buffer);
                    });
                    clientFree.on('data', function (buf) {
                        socket.emit('message', {
                            name: name,
                            buffer: buf,
                            host
                        })
                    });
                    clientFree.on('end', () => {
                        console.log('我结束了');
                        socket.emit('message/end', {
                            name: name,
                            buffer: null,
                            host
                        })
                    });
                    clientFree.on('error', err => {
                        socket.emit('message/end', {
                            name: name,
                            buffer: null,
                            host
                        })
                    });
                    /*    clientFree.on('disconnect', err => {
                            console.log('断开');
                        });*/
                }
            });
        });
    }
}



