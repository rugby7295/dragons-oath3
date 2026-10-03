const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib');
let WebSocketServer;try{({WebSocketServer}=require('ws'))}catch{({WebSocketServer}=require('./miniws'))}
const G=require('./game');
const PUB=__dirname,DATA=process.env.DATA_FILE||path.join(__dirname,'data.json');
// 永続化: Upstash Redis(環境変数があれば) → なければ data.json
const UU=process.env.UPSTASH_REDIS_REST_URL,UT=process.env.UPSTASH_REDIS_REST_TOKEN,KEY='dragons-oath-db';
const rc=async cmd=>(await(await fetch(UU,{method:'POST',headers:{Authorization:'Bearer '+UT},body:JSON.stringify(cmd)})).json()).result;
async function load(){try{if(UU){const v=await rc(['GET',KEY]);if(v)G.S.db=JSON.parse(v)}else G.S.db=JSON.parse(fs.readFileSync(DATA,'utf8'))}catch(e){console.log('load:',e.message)}}
const saveDb=()=>UU?rc(['SET',KEY,JSON.stringify(G.S.db)]).catch(e=>console.log('save:',e.message)):fs.writeFile(DATA,JSON.stringify(G.S.db),()=>{});
let dirty=false;setInterval(()=>{if(dirty){dirty=false;saveDb()}},5000);
process.on('SIGTERM',async()=>{await saveDb();process.exit(0)});
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.mp3':'audio/mpeg'},cache={};
const srv=http.createServer((q,r)=>{
  let f=q.url.split('?')[0];if(f==='/healthz'){r.writeHead(200);return r.end('ok')}if(f==='/')f='/index.html';
  const fp=path.join(PUB,path.normalize(f));if(!fp.startsWith(PUB)){r.writeHead(403);return r.end()}
  const gz=/gzip/.test(q.headers['accept-encoding']||'');
  fs.readFile(fp,(e,d)=>{if(e){r.writeHead(404);return r.end('404')}
    const h={'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'};
    if(path.extname(fp)==='.mp3'){h['Accept-Ranges']='bytes';h['Cache-Control']='public,max-age=86400';const rg=/bytes=(\d*)-(\d*)/.exec(q.headers.range||'');
      if(rg){const s=+rg[1]||0,e=Math.min(rg[2]?+rg[2]:d.length-1,d.length-1);h['Content-Range']=`bytes ${s}-${e}/${d.length}`;r.writeHead(206,h);return r.end(d.subarray(s,e+1))}}
    else if(gz){h['Content-Encoding']='gzip';d=cache[fp+d.length]||(cache[fp+d.length]=zlib.gzipSync(d))}
    r.writeHead(200,h);r.end(d)})});
const wss=new WebSocketServer({server:srv}),rooms={};
const bc=r=>r.order.forEach(i=>{const p=r.pl[i];if(p.ws&&p.ws.readyState===1)p.ws.send(JSON.stringify(G.view(r,i)))});
const err=(ws,m)=>ws.send(JSON.stringify({t:'err',m}));
const gen=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s;do{s=Array.from({length:4},()=>c[Math.random()*c.length|0]).join('')}while(rooms[s]);return s};
wss.on('connection',ws=>{
  ws.alive=true;ws.on('pong',()=>ws.alive=true);
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw)}catch{return}
    if(m.t==='join'){
      const name=String(m.name||'').trim().slice(0,12);if(!name)return err(ws,'名前を入力してください');
      let r=m.room?rooms[String(m.room).toUpperCase()]:null;
      if(m.room&&!r)return err(ws,'ルームが見つかりません(サーバー再起動で消えた可能性があります)');
      if(!r){const c=gen();r=rooms[c]=G.newRoom(c)}
      let p=m.token?Object.values(r.pl).find(x=>x.tok===m.token):null;
      if(!p){if(r.order.length>=4)return err(ws,'このパーティーは満員です(4人まで)');G.restore(name.toLowerCase(),m.prof);p=G.addPlayer(r,name,name.toLowerCase())}
      if(p.ws&&p.ws!==ws)try{p.ws.close()}catch{}
      p.ws=ws;ws.pid=p.id;ws.room=r;G.prof(p);dirty=true;
      ws.send(JSON.stringify({t:'joined',token:p.tok,room:r.code,id:p.id,init:G.INIT}));
      return bc(r)}
    const r=ws.room;if(!r)return;
    G.handle(r,ws.pid,m);dirty=true;bc(r)});
  ws.on('close',()=>{const r=ws.room;if(!r)return;const p=r.pl[ws.pid];if(p&&p.ws===ws){p.ws=null;
    if(r.host===p.id){const o=r.order.find(i=>r.pl[i].ws);if(o)r.host=o}
    G.offline(r);bc(r)}})});
setInterval(()=>{wss.clients.forEach(w=>{if(!w.alive)return w.terminate();w.alive=false;w.ping()});
  for(const c in rooms){const r=rooms[c];if(r.order.some(i=>r.pl[i].ws))r.idle=0;else if((r.idle=(r.idle||0)+1)>60)delete rooms[c]}},30000);
load().then(()=>srv.listen(process.env.PORT||3000,()=>console.log('listening, storage:',UU?'upstash':'file')));
