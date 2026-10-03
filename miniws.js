// 依存なしの最小WebSocketサーバー(npmの ws が無い環境用フォールバック)
const crypto=require('crypto'),{EventEmitter}=require('events');
class Conn extends EventEmitter{
  constructor(sock,head){super();this.sock=sock;this.readyState=1;this.buf=Buffer.alloc(0);
    sock.on('data',d=>{this.buf=Buffer.concat([this.buf,d]);this.parse()});sock.on('close',()=>this.fin());sock.on('error',()=>this.fin());
    if(head&&head.length){this.buf=Buffer.from(head);this.parse()}}
  fin(){if(this.readyState===3)return;this.readyState=3;this.emit('close')}
  parse(){for(;;){const b=this.buf;if(b.length<2)return;const op=b[0]&15,mk=b[1]&128;let len=b[1]&127,o=2;
    if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);o=4}else if(len===127){if(b.length<10)return;len=Number(b.readBigUInt64BE(2));o=10}
    if(len>1e6)return this.terminate();const need=o+(mk?4:0)+len;if(b.length<need)return;
    let p=b.subarray(o+(mk?4:0),need);if(mk){const m=b.subarray(o,o+4);p=Buffer.from(p);for(let i=0;i<p.length;i++)p[i]^=m[i&3]}
    this.buf=b.subarray(need);
    if(op===1)this.emit('message',p.toString());else if(op===8)this.close();else if(op===9)this.frame(10,p);else if(op===10)this.emit('pong')}}
  frame(op,p){if(!this.sock.writable)return;const n=p.length;const h=n<126?Buffer.from([128|op,n]):n<65536?Buffer.from([128|op,126,n>>8,n&255]):(()=>{const x=Buffer.alloc(10);x[0]=128|op;x[1]=127;x.writeBigUInt64BE(BigInt(n),2);return x})();this.sock.write(Buffer.concat([h,p]))}
  send(s){this.frame(1,Buffer.from(String(s)))}ping(){this.frame(9,Buffer.alloc(0))}
  close(){if(this.readyState===1){this.frame(8,Buffer.alloc(0));this.readyState=2;this.sock.end()}}
  terminate(){this.sock.destroy();this.fin()}}
class WebSocketServer extends EventEmitter{
  constructor({server}){super();this.clients=new Set;server.on('upgrade',(req,sock,head)=>{const k=req.headers['sec-websocket-key'];if(!k)return sock.destroy();
    const acc=crypto.createHash('sha1').update(k+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
    const c=new Conn(sock,head);this.clients.add(c);c.on('close',()=>this.clients.delete(c));this.emit('connection',c)})}}
module.exports={WebSocketServer};
