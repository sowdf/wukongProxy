#!/usr/bin/env node
const net = require('net');
const io = require('socket.io-client');
var prompt = require('prompt');
const request = require('request');
const {host,serverHost,serverPort} = require('./config');
console.log(serverHost);


class Client {
    constructor() {
        //this.port = readlineSync.question('请输入转发的本地端口(8080):');
        //this.token = readlineSync.question('请输入授权码(token):');
        this.port = '8090';
        this.key = 'iXiJQiNFFn2MtYDkp52eNbdkMeaPT2pX';
        //new Client(result);
        this.getHost();
    }
    getHost(){
        request.get(`${host}/client/getHost?key=${this.key}`,(err,response,body)=>{
            if(err){
                console.log(err);
                return false;
            }
            let {code,result,message} = JSON.parse(body);
            if(code === 100){
                let {host} = result;
                this.host = host;
                this.init();
                return console.log(`您的访问域名：http://${host}.wkdl.ltd`);
            }
            console.log(message);
        })
    }
    init(){
        this.socket = io(serverHost, {
            query: {
                host: this.host,
                key : this.key
            }
        });
        this.clients = {};
        
        this.start();
    }
    
    start() {
        this.socket.on('connect', () => {
            console.log('server connected (连接成功)');
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
                    this.socket.emit('response', {
                        addr: addr,
                        buffer: buffer
                    })
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
                this.clients[addr].on('error', end);
            } else {
                this.clients[addr].write(data.buffer);
            }
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
