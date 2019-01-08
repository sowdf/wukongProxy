var str = 'HTTP/1.1 200 OK\n' +
    'server: ecstatic-2.2.1\n' +
    'last-modified: Mon, 16 Jan 2017 02:56:26 GMT\n' +
    'etag: "1007157-6189981-"2017-01-16T02:56:26.000Z""\n' +
    'cache-control: max-age=3600\r\n' +
    'content-length: 6189981\n' +
    'content-type: application/zip; charset=utf-8\n' +
    'Date: Mon, 07 Jan 2019 00:45:27 GMT\n' +
    'Connection: keep-alive';


let arr = str.match(/\r\ncontent-lengt[^\r\n]+/gi);

console.log(arr);
