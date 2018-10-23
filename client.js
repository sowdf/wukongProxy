const net = require('net');
const io = require('socket.io-client');
var prompt = require('prompt');

class Client {
    constructor() {
        //this.port = readlineSync.question('请输入转发的本地端口(8080):');
        //this.token = readlineSync.question('请输入授权码(token):');

        prompt.start();
        prompt.get([{
            name: 'port',
            message: '请输入转发的本地端口默认',
            default : 8080,
            required: false
        }, {
            name: 'token',
            message: '请输入授权码(token) 前往 http://wwww.wkdl.ltd 注册获取',
            required: true,
        }], (err, result) =>{
            console.log(result);
            let {token,port} = result;
            this.port = port;
            this.token = token;
            //new Client(result);
            this.init();
            return true;
        });
    }
    init(){
        this.socket = io('http://service.wkdl.ltd', {
            query: {
                token: this.token || 'lzp'
            }
        });
        this.clients = {};

        this.start();
    }

    start() {
        this.socket.on('connect', () => {
            console.log('socket.io server connected');
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
