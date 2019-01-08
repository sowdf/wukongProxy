#!/usr/bin/env node
const net = require('net');
const io = require('socket.io-client');
var prompt = require('prompt');
const request = require('request');
const {host,serverHost,serverPort} = require('./config');


class Client {
    constructor() {
        //this.port = readlineSync.question('请输入转发的本地端口(8080):');
        //this.token = readlineSync.question('请输入授权码(token):');
        this.questionInit();
    }
    questionInit(successCallback){
        prompt.start();
        prompt.get([{
            name: 'port',
            message: '请输入转发的本地端口默认',
            default : 8080,
            required: false
        }, {
            name: 'token',
            message: '请输入授权码(token) 前往 http://www.39nat.com 注册获取',
            required: true,
        }], (err, result) =>{
            let {token,port} = result;
            this.port = port;
            this.token = token;
            //new Client(result);
            this.getHost();
            return true;
        });
    }
    getHost(){
        request.get(`${host}/token/getHost?token=${this.token}`,(err,response,body)=>{
            if(err){
                console.log(err);
                return false;
            }
            let {code,result,message} = JSON.parse(body);
            if(code === 100){
                let {hostname} = result;
                this.host = hostname;
                this.init();
                return console.log(`您的访问域名：http://${hostname}.39nat.com`);
            }
            this.questionInit();
        })
    }
    init(){
        this.socket = io(serverHost, {
            query: {
                host: this.host,
                token : this.token
            }
        });
        this.clients = {};

        this.start();
    }

    start() {
        this.socket.on('connect', () => {
            console.log('server connected (连接成功)');
        });
    
        this.socket.on('ping',(data)=>{
        
        });
   
        this.socket.on('request', data => {
            if (!data.addr) {
                return;
            }
            let addr = data.addr;
            if (!this.clients[addr]) {
                this.clients[addr] = new net.Socket();
                this.clients[addr].connect(this.port, '127.0.0.1', () => {
                    this.clients[addr].write(data.buffer);
                });

                this.clients[addr].on('data', (buffer) => {
                 /*   if(!this.clients[addr].size){
                        let response = buffer.toString();
                        let arr = response.match(/\r\ncontent-lengt[^\r\n]+/gi);
                        let contentLength = arr ? arr[0].split(':')[1] : '';
                        if(contentLength){
                            contentLength = parseInt(contentLength);
                            if(contentLength > 50000){
                                this.socket.emit('response', {
                                    addr: addr,
                                    buffer: "HTTP/1.1 200 OK\r\n\r\n 不支持大文件传输，如有需要请联系管理员！"
                                })
                            }
                            this.clients[addr] && this.clients[addr].destroy();
                            if (this.clients[addr]) {
                                delete this.clients[addr];
                            }
                        }
                     
                    }*/
                    this.clients[addr] && this.clients[addr].pause();
                    this.socket.emit('response', {
                        addr: addr,
                        buffer: buffer
                    })
                    setTimeout(()=>{
                        this.clients[addr] && this.clients[addr].resume();
                    },100);
                });
                let end = () => {
                    this.socket.emit('response/end', {
                        addr: addr,
                        buffer: null
                    });
                    if (this.clients[addr]) {
                        delete this.clients[addr];
                    }
                };
                this.clients[addr].on('end', end);
                this.clients[addr].on('close', end);
                this.clients[addr].on('error', (message)=>{
                    console.log(message);
                    end()
                });
            } else {
                this.clients[addr].write(data.buffer);
            }
        });
        
        this.socket.on('response/clientEnd',(data)=>{
            let addr = data.addr;
            this.clients[addr] && this.clients[addr].destroy();
            if (this.clients[addr]) {
                delete this.clients[addr];
            }
        });
        this.socket.on('error',message => {
            console.log(message);
        });
        this.socket.on('close', message => {
            console.log(message);
            this.socket.close();
            process.exit(1);
        });
        this.socket.on('disconnect', () => {
            this.clients = {}
        });
    }
}

let client = new Client();
