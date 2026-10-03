// ドラゴンズ・オース v2 ゲームロジック(サーバー権威)
const R=n=>Math.floor(Math.random()*n),pick=a=>a[R(a.length)];
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=R(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const S={db:{}};
const STEPS=24,CH=['霧深き森','凍てつく山脈','灼熱の砂漠','呪われた沼地','竜の谷'],chOf=s=>Math.min(4,s/5|0);
const CHT=['霧が立ち込める古い森。獣と亡者の気配がする…','吹雪が吹き荒れる白い山脈。凍てつく風が肌を刺す。','陽炎の揺れる灼熱の砂漠。砂の下には古の王墓が眠る。','毒の霧が漂う呪われた沼地。足を取られれば二度と戻れない。','竜の谷。空は赤黒く染まり、賢き邪竜の咆哮が響く…'];
const GN=['森の主 ウルサリオン','氷牙の魔狼王 ヴァルガ','砂漠の王 サンドロス','沼の九頭竜 ヒュドラ','賢き邪竜 ヴァルドラクス'];
const CARDS={},CLS=[],K=['k0','k1','k2','k3'];
const mk=(id,a,co,d,b,h,fx,cl)=>({id,n:a,c:+co,d:+d,b:+b,h:+h,fx,cl,aoe:fx==='aoe',pt:fx==='party',dr:fx==='draw'?2:0,bn:fx==='burn'?4:0,wk:fx==='weak'?2:0});
// クラス|HP|カード(名,コスト,ダメージ,防御,回復,効果) 効果: aoe全体 burn燃焼 weak弱体 draw2枚引く party味方全員
`戦士|60|大斬り,1,9,0,0,;盾打ち,1,5,5,0,;薙ぎ払い,2,7,0,0,aoe;咆哮,1,0,0,0,weak;英雄の一撃,3,24,0,0,
魔法使い|40|火球,1,8,0,0,burn;雷撃,2,9,0,0,aoe;魔力集中,0,0,0,0,draw;氷の壁,1,0,9,0,;隕石,3,20,0,0,aoe
盗賊|45|急所突き,1,10,0,0,;毒塗り,1,3,0,0,burn;影渡り,0,0,4,0,draw;乱れ斬り,2,6,0,0,aoe;暗殺,2,18,0,0,
僧侶|50|癒し,1,0,0,9,;聖光,1,7,0,0,;祝福,2,0,6,6,party;浄化,1,0,0,4,draw;天の裁き,3,14,0,0,aoe
弓使い|45|速射,1,7,0,0,;連射,2,5,0,0,aoe;狙撃,2,16,0,0,;罠設置,1,0,3,0,weak;矢の雨,3,12,0,0,aoe
騎士|65|大盾,1,0,10,0,;突撃,1,8,4,0,;守護の誓い,2,0,8,0,party;聖剣,2,14,0,0,;鉄壁,2,0,18,0,
吟遊詩人|42|勇気の歌,1,0,5,0,party;癒しの調べ,1,0,0,6,party;皮肉,1,5,0,0,weak;即興曲,0,0,0,0,draw;英雄譚,3,0,8,8,party
森番|50|棘の矢,1,6,0,0,burn;獣呼び,2,10,0,0,aoe;樹皮の護り,1,0,8,0,;癒しの草,1,0,0,8,;自然の怒り,3,18,0,0,aoe
死霊術師|42|骨の槍,1,8,0,0,;呪詛,1,0,0,0,weak;生命吸収,2,8,0,8,;死者の行進,2,6,0,0,aoe;冥府の門,3,22,0,0,
修道僧|55|連打,0,4,0,0,;気功,1,0,6,4,;崩拳,1,9,0,0,;瞑想,1,0,0,0,draw;百裂拳,3,16,0,0,aoe
錬金術師|45|爆薬,1,7,0,0,aoe;回復薬,1,0,0,8,;酸の瓶,1,4,0,0,burn;賢者の石,1,0,0,0,draw;大爆発,3,18,0,0,aoe
竜騎士|60|槍投げ,1,9,0,0,;竜鱗,1,0,8,0,;竜の息,2,8,0,0,aoe;急降下,2,16,0,0,;竜王の咆哮,3,14,6,0,aoe`.split('\n').forEach((l,i)=>{
  const[n,hp,cs]=l.split('|');
  CLS.push({n,hp:+hp,ids:cs.split(';').map((c,k)=>{const[a,co,d,b,h,fx]=c.split(',');const id=i+'_'+k;CARDS[id]=mk(id,a,co,d,b,h,fx,i);return id})})});
'打撃,1,6,0,0,;防御,1,0,5,0,;応急,1,0,0,4,;深呼吸,0,0,0,0,draw'.split(';').forEach((c,k)=>{const[a,co,d,b,h,fx]=c.split(',');CARDS['k'+k]=mk('k'+k,a,co,d,b,h,fx,-1)});
// 強化版カード(+)を全カード分生成
Object.values({...CARDS}).forEach(c=>{const u={...c,id:c.id+'+',n:c.n+'+'};if(c.d||c.b||c.h){if(c.d)u.d+=3;if(c.b)u.b+=3;if(c.h)u.h+=3}else u.c=Math.max(0,c.c-1);CARDS[u.id]=u});
CARDS.x0={id:'x0',n:'呪い',c:99,d:0,b:0,h:0,fx:'',cl:-2};
// 職業固有スキル(1戦闘1回・コスト0)
const ULT=[['戦の雄叫び',{mp:2,b:6}],['流星群',{d:10,aoe:1,bn:4}],['影の舞',{dr:3,mp:1}],['聖なる癒し',{h:12,pt:1}],['一矢必殺',{d:20}],['鉄壁の陣',{b:12,pt:1}],['英雄の賛歌',{mp:1,pt:1,b:4}],['自然の怒り',{d:6,aoe:1,bn:6}],['死の抱擁',{d:9,aoe:1,h:9}],['気の解放',{mp:3}],['万能薬',{d:8,aoe:1,h:8}],['竜の一撃',{d:26}]].map(([n,o])=>({n,...o,aoe:!!o.aoe,pt:!!o.pt}));

const TREE=[['a1','剛力','武','dmg',10],['a2','猛攻','武','dmg',10],['a3','鋭眼','武','draw',1],['a4','覇気','武','dmg',15],['a5','竜殺し','武','bossd',30],
['b1','頑強','守','hp',10],['b2','鉄壁','守','blk',2],['b3','生命力','守','hp',15],['b4','守護','守','blk',3],['b5','不屈','守','hp',25],
['c1','癒しの心','術','heal',3],['c2','商才','術','gold',25],['c3','精神集中','術','en',1],['c4','聖なる加護','術','heal',3],['c5','英雄の魂','術','dmg',15]]
.map(([id,n,br,st,v])=>({id,n,br,st,v,req:+id[1]>1?id[0]+(id[1]-1):null}));
// 職業別スキルツリー(各職5段)。その職業で遊ぶときだけ効果が出る
`戦士|hp:15,dmg:12,ultp:40,aoe:3,bossd:20|不屈の肉体,剣技錬磨,雄叫びの極意,旋風剣,竜討ちの誓い
魔法使い|dmg:10,burn:2,ultp:40,aoe:3,en:1|魔力増幅,炎の理,星降る詠唱,連鎖雷,賢者の境地
盗賊|dmg:12,draw:1,ultp:40,bossd:15,gold:25|急所看破,早業,影の舞踏,竜の隙,盗みの才
僧侶|heal:3,party:2,ultp:40,hp:15,blk:2|祈りの手,加護の輪,聖なる癒しの極意,不屈の信仰,天の恵み
弓使い|dmg:12,aoe:2,ultp:40,draw:1,bossd:15|鷹の目,矢継ぎ早,一矢の極意,矢の雨,竜眼を射る
騎士|blk:2,hp:15,ultp:40,party:2,dmg:10|鉄壁の心得,重装の誇り,鉄壁の陣・極,守護の誓約,聖騎士の剣
吟遊詩人|party:2,heal:3,ultp:40,draw:1,en:1|美声,癒しの旋律,賛歌の極意,即興の才,伝説の詩人
森番|burn:2,hp:15,ultp:40,aoe:2,heal:3|森の知恵,棘の加護,自然の怒り・極,獣の群れ,森の主
死霊術師|dmg:10,heal:3,ultp:40,burn:2,aoe:3|死の理解,吸命の術,死の抱擁・極,呪詛濃縮,冥王の血脈
修道僧|dmg:12,blk:2,ultp:40,draw:1,hp:15|拳の鍛錬,気の巡り,気の解放・極,無我の境地,羅漢の肉体
錬金術師|aoe:3,heal:3,ultp:40,burn:2,gold:25|調合の才,薬効増強,万能薬・極,爆薬改良,賢者の石
竜騎士|dmg:12,hp:15,ultp:40,bossd:20,aoe:3|竜との絆,竜鱗の加護,竜の一撃・極,竜の血,竜王の継承者`.split('\n').forEach((l,c)=>{const[n,ss,ns]=l.split('|'),nm=ns.split(',');ss.split(',').forEach((x,i)=>{const[st,v]=x.split(':');TREE.push({id:'u'+c+'_'+i,n:nm[i],br:n,st,v:+v,req:i?'u'+c+'_'+(i-1):null,cls:c})})});
const LB={dmg:'与ダメ%',blk:'毎ターン防御',heal:'回復',hp:'最大HP',gold:'金貨%',draw:'手札',en:'MP',bossd:'対竜%',ultp:'固有スキル強化%',aoe:'全体ダメ',burn:'燃焼',party:'味方支援'};

// アイテム: 通常300種(形容詞20×15) + 名前付き20種
const ADJ=['錆びた','古びた','銀の','鉄の','鋼の','魔法の','輝く','祝福された','呪われた','影の','炎の','氷の','雷の','風の','星の','竜の','王の','英雄の','神々の','伝説の'];
const BASE=[['剣','dmg'],['盾','blk'],['指輪','heal'],['杖','draw'],['外套','hp'],['長靴','gold'],['魔導書','dmg'],['兜','hp'],['首飾り','blk'],['弓','dmg'],['聖印','heal'],['薬瓶','hp'],['羅針盤','gold'],['角笛','blk'],['宝珠','heal']];
const MUL={dmg:3,blk:1,heal:2,hp:4,gold:5,draw:1};
const NAMED=[['竜殺しの剣ドラグブレイカー','bossd',40,'古の英雄が竜鱗を断った剣'],['聖剣アルヴェイン','dmg',25,'王家に伝わる白銀の剣'],['影縫いの短剣シェイド','dmg',18,'影を縫い止める暗殺者の刃'],['嵐の杖ストームコーラー','draw',1,'雷雲を呼ぶ賢者の杖'],['ミスリルの大盾アイギス','blk',6,'あらゆる炎を弾く盾'],['癒しの聖杯','heal',6,'一滴で傷を癒す聖杯'],['王の指輪','gold',50,'持ち主に富を招く黄金の指輪'],['星屑の外套','hp',30,'星の加護が身を守る'],['炎の弓イグニス','dmg',20,'矢が炎を纏う名弓'],['氷槍ヴァルグレイシア','dmg',22,'凍てつく北の槍'],['世界樹の枝','en',1,'魔力が枝から溢れ出す'],['不死鳥の羽根','heal',8,'灰から蘇る炎の羽根'],['ドワーフの鎚ムルデイン','dmg',28,'山を砕く鍛冶神の鎚'],['月光の弓セレナ','dmg',20,'月夜に真価を放つ弓'],['賢者の書オルド','draw',1,'万象の知恵が記された書'],['竜鱗の鎧','blk',5,'倒した竜の鱗で作った鎧'],['勇者の兜','hp',25,'かつての勇者が被った兜'],['旅人の長靴','gold',40,'千里を駆ける魔法の長靴'],['エルフの竪琴','heal',5,'調べが傷を優しく癒す'],['深淵の宝珠','en',1,'覗く者に力を与える宝珠']];
const item=id=>{if(id>=1000){const x=NAMED[id-1000];return{n:x[0],t:x[1],v:x[2],lore:x[3],nm:1}}const a=id/15|0;let t=BASE[id%15][1];if(t==='draw'&&a<10)t='blk';return{n:ADJ[a]+BASE[id%15][0],t,v:(1+(a/4|0))*MUL[t]}};

const prof=p=>S.db[p.key]||(S.db[p.key]={sp:0,skills:[],wins:0});
function restore(key,pf){if(S.db[key]||!pf||typeof pf!=='object')return;const ids=TREE.map(t=>t.id);
  S.db[key]={sp:Math.min(50,Math.max(0,pf.sp|0)),skills:(Array.isArray(pf.skills)?pf.skills:[]).filter((k,i,a)=>ids.includes(k)&&a.indexOf(k)===i),wins:Math.min(999,Math.max(0,pf.wins|0))}}
const stats=p=>{const s={dmg:0,hp:0,blk:0,draw:0,en:0,heal:0,gold:0,bossd:0,ultp:0,aoe:0,burn:0,party:0};(prof(p).skills||[]).forEach(k=>{const t=TREE.find(x=>x.id===k);if(t&&(t.cls===undefined||t.cls===p.cls))s[t.st]+=t.v});(p.items||[]).forEach(id=>{const it=item(id);s[it.t]+=it.v});s.draw=Math.min(s.draw,3);s.en=Math.min(s.en,3);return s};
const refresh=p=>{const m=p.base+p.hpb+stats(p).hp;if(m>p.mhp)p.hp+=m-p.mhp;p.mhp=m;p.hp=Math.min(p.hp,m)};

// 敵48種(系統8×格6) + 竜の眷属
const FAM=[['ゴブリン',18,4],['スケルトン',22,5],['オーク',32,6],['ウルフ',20,6],['トロル',42,7],['ゴースト',18,6],['大蜘蛛',24,5],['ワイト',28,7],['雪男',38,7],['ハーピー',22,6],['氷の精霊',20,7],['サソリ',24,6],['ミイラ',30,7],['砂蟲',44,8],['リザードマン',32,7],['沼ゾンビ',34,6],['毒蛙',22,6],['沼の魔女',24,9],['ガーゴイル',40,8],['ドラゴニュート',46,10]],PRE=['','荒くれ','狂える','古の','呪われた','闇の'];
const BP={1:['atk','summon','all','charge'],2:['heavy','all','summon','charge','weak'],3:['all','charge','doom','heavy','all','heavy']};
const intent=e=>{const k=e.pat[e.ti%e.pat.length];const o={k,v:Math.round(e.d*({atk:1,heavy:1.8,all:.7,weak:.6,guard:0,charge:2.2,summon:0,doom:2.6}[k]))};if(k==='charge')o.need=12+14*e.pn;return o};
const RF=[[0,1,3,6],[2,4,8,9,10],[11,12,13,5,7],[14,15,16,17,6],[18,19,4,7,2]];
const PT={6:['atk','weak','atk','heavy'],5:['atk','all','atk','heavy'],9:['atk','heavy','all'],10:['atk','all','weak','heavy'],11:['weak','atk','heavy'],16:['weak','atk','atk','heavy'],17:['weak','all','atk','heavy'],19:['heavy','atk','all','heavy']};
function mkEnemy(s,x=0){const f=pick(RF[chOf(s)]);s=Math.round(s*.4);const t=Math.min(5,Math.floor(s*.6)+R(2)+x),F=FAM[f],hp=Math.round((F[1]*(1+t*.3)+s*3)*(x?1.5:1));
  const e={n:PRE[t]+F[0],hp,mhp:hp,d:Math.round(F[2]*(1+t*.2)+s*.5),pat:PT[f]||['atk','atk','heavy','guard'],ti:R(2),burn:0,weak:0,pn:1};e.intent=intent(e);return e}
const GD=[['森の主 ウルサリオン',90,8,['atk','heavy','weak','guard']],['氷牙の魔狼王 ヴァルガ',130,10,['atk','all','heavy','weak','guard']],['砂漠の王 サンドロス',160,10,['atk','charge','heavy','weak','guard']],['沼の九頭竜 ヒュドラ',200,11,['atk','all','summon','heavy','weak','all']]];
function mkGuard(i){const[n,hp,d,pat]=GD[i];const e={n:'👑'+n,hp,mhp:hp,d,pat,ti:0,burn:0,weak:0,pn:1};e.intent=intent(e);return e}
function mkWhelp(n,d,nm='竜の眷属'){const e={n:nm,hp:12+6*n,mhp:12+6*n,d:Math.round(d*.5),pat:['atk','atk','heavy'],ti:0,burn:0,weak:0,pn:n};e.intent=intent(e);return e}

// イベント: 場所25×状況28=700種 + 分岐ストーリー8編
const PL=['霧深い森','朽ちた砦','凍てつく山道','静かな湖畔','古の街道','荒れ果てた村','暗い洞窟','燃えた橋','霧の沼地','忘れられた墓所','竜の丘','黒き森','星降る平原','廃坑','古代の神殿','雪原','砂嵐の谷','海辺の断崖','呪われた城下','エルフの遺跡','ドワーフの坑道','月夜の泉','嵐の岬','黄金の草原','影の峡谷'];
const PLR=[['霧深い森','朽ちた砦','静かな湖畔','古の街道','荒れ果てた村','黒き森','月夜の泉','エルフの遺跡'],
['凍てつく山道','雪原','氷の洞窟','吹雪の峠','ドワーフの坑道','廃坑','雪に埋もれた神殿','氷河の裂け目'],
['砂嵐の谷','燃える砂丘','古代の王墓','オアシスの跡','崩れた神殿','岩の迷宮','黄金の遺跡','熱砂の街道'],
['毒霧の沼','朽ちた桟橋','忘れられた墓所','呪われた城下','腐った森','魔女の庭','底なしの泥地','沈んだ聖堂'],
['竜の丘','焼けた谷','灰の平原','嵐の岬','溶岩の裂け目','竜骨の荒野','黒き城門','影の峡谷']];
const TP=[
['宝箱を見つけた',[['開ける','gamble'],['鍵を探す','gold',12],['無視する','pass']]],
['傷ついた旅人が助けを求めている',[['手当てする','sp'],['持ち物を奪う','gold',8],['立ち去る','pass']]],
['古びた祭壇がある',[['祈る','maxhp',5],['供物を捧げる','card'],['壊す','hurt',6]]],
['行商人が荷を広げている',[['装備を買う(金貨40)','buy',40],['薬を買う(金貨15)','buyheal',15],['立ち去る','pass']]],
['焚き火の跡を見つけた',[['休息する','heal',25],['探索する','gold',10],['先を急ぐ','pass']]],
['怪しい泉が湧いている',[['飲む','gamble'],['傷を洗う','heal',10],['無視する','pass']]],
['山賊が道を塞いでいる',[['戦う','fight'],['強行突破','hurt',10]]],
['謎めいた賢者が現れた',[['教えを請う','sp'],['謎かけに挑む','gamble'],['無視する','pass']]],
['崩れかけた遺跡がある',[['探索する','gamble'],['壁画を読む','card']]],
['罠だらけの通路が続く',[['解除する','gold',15],['走り抜ける','hurt',7]]],
['魔物の巣を見つけた',[['襲撃する','fight'],['財宝をそっと盗む','gamble']]],
['迷子の子供に出会った',[['送り届ける','item'],['無視する','pass']]],
['錬金術師の露店がある',[['霊薬を買う(金貨20)','buyheal',20],['研究を手伝う','gold',20]]],
['竜の骨が横たわっている',[['牙を拾う','item'],['骨を調べる','maxhp',3],['立ち去る','pass']]],
['吟遊詩人が歌っている',[['聴き入る','heal',15],['歌に加わる','gold',10]]],
['鍛冶場が残されている',[['武具を研ぐ','card'],['防具を直す','maxhp',4]]],
['ゴブリンの野営地だ',[['奇襲する','fight'],['食料を盗む','heal',12]]],
['呪われた宝石が落ちている',[['拾う','gamble'],['砕く','sp']]],
['静かな墓地が広がる',[['祈りを捧げる','heal',10],['墓を暴く','gamble'],['立ち去る','pass']]],
['霧の中に灯りが見える',[['近づく','fight'],['灯りを奪う','item'],['引き返す','pass']]],
['倒れた冒険者の荷物がある',[['漁る','item'],['弔う','maxhp',3]]],
['大鷲が道を示している',[['従う','heal',20],['無視する','pass']]],
['名も無き鍛冶師が槌を振るっている',[['カードを鍛えてもらう(金貨30)','buyup',30],['手伝う','gold',18]]],
['僧院で僧侶が祈っている',[['懺悔する','remove'],['寄進する','heal',20]]],
['古い図書室を見つけた',[['読み耽る','card'],['禁書を開く','gamble']]],
['竜の爪痕が地面に残っている',[['調べる','sp'],['追跡する','fight'],['避ける','pass']]],
['旅の一座が野営している',[['芸に加わる','gold',22],['占ってもらう','gamble'],['休む','heal',15]]],
['古井戸から冷たい風が吹き出している',[['降りる','gamble'],['水を汲む','heal',12]]]];
const ST={
kn1:{t:'霧の中、傷だらけの老騎士が座り込んでいる。「竜に挑み敗れた…最期に頼みがある」',o:[['話を聞く','go',0,'「竜は賢い。溜めた炎は仲間と力を合わせ、一気に叩けば止められる」老騎士は静かに語った。','kn2'],['荷物を漁る','item',0,'老騎士は何も言わず目を閉じた…'],['立ち去る','pass']]},
kn2:{t:'老騎士は震える手で古い包みを差し出した。',o:[['受け取る','named',0,'「竜を…頼む」それが最期の言葉だった。'],['介抱する','maxhp',6,'老騎士は微笑み、祝福を残して眠りについた。']]},
im1:{t:'小さな竜が木の上から語りかけてくる。「主は強き者を見たがっている」',o:[['話に乗る','go',0,'小竜は愉快そうに笑い、問いを投げかけた。','im2'],['斬りかかる','fight'],['無視する','pass']]},
im2:{t:'「一つ問おう。傷ついた仲間を守るのは、盾か、癒しか?」',o:[['盾だ','maxhp',5,'「ほう、覚えておこう」小竜は羽ばたいて去った。'],['癒しだ','heal',35,'「甘いな。だが嫌いではない」小竜が光を投げた。'],['どちらも要る','gold',40,'「欲張りめ」小竜は金貨を投げ捨てた。']]},
cm1:{t:'夜市に怪しげな露店。「命以外なら何でも売るよ」と店主が囁く。',o:[['商品を覗く','go',0,'店主は布を捲り、禁断の品を見せた。','cm2'],['立ち去る','pass']]},
cm2:{t:'棚には妖しく輝く武具が並ぶ。呪いの気配がする。',o:[['禁断の武具を手にする','curseitem',0,'強大な力と引き換えに、呪いが体に絡みついた。'],['断る','gold',15,'店主は舌打ちし、口止め料を置いていった。']]},
wt1:{t:'老魔女が焚き火の前で手招きしている。「取引をしようじゃないか」',o:[['応じる','go',0,'魔女は歯のない口で笑い、代償を語り始めた。','wt2'],['断る','pass']]},
wt2:{t:'「力が欲しいなら、代償を払いな」',o:[['血を差し出す','hurtsp',15,'魔女は血を瓶に受け、知識を授けた。'],['髪を差し出す','up',0,'魔女はカードに呪文を刻み直した。'],['帰る','pass']]},
cu1:{t:'竜を崇める黒衣の教団が儀式を行っている。「竜の目覚めは近い」',o:[['信者に紛れ込む','go',0,'儀式の奥に、光る聖杯が見えた。','cu2'],['襲撃する','fight']]},
cu2:{t:'教団の宝物庫が目の前にある。',o:[['聖杯を盗む','named',0,'警報が鳴る前に、闇に消えた。'],['教義書を読む','sp',0,'竜の弱点についての記述を見つけた。']]},
gh1:{t:'廃墟に幽霊が佇んでいる。「私の…未練を…」',o:[['話しかける','go',0,'幽霊は竜に滅ぼされた故郷を語った。','gh2'],['祓う','fight']]},
gh2:{t:'「どうか、私の祈りを受け取って…」',o:[['祈りを受ける','remove',0,'不要な重荷が心から消えた。'],['祈りを返す','heal',40,'幽霊は安らかに消えていった。']]},
sp1:{t:'星降る泉に精霊が現れた。「願いを一つだけ叶えよう」',o:[['願いを唱える','go',0,'精霊は微笑み、耳を傾けた。','sp2'],['立ち去る','pass']]},
sp2:{t:'「何を望む?」',o:[['力を','up',0,'カードが星の光を帯びた。'],['命を','maxhp',10,'生命の輝きが身体を満たした。'],['富を','gold',60,'泉から金貨が溢れ出した。']]},
dw1:{t:'ドワーフの古い工房。炉はまだ温かい。',o:[['炉に火を入れる','go',0,'炉が唸り、古の技が蘇った。','dw2'],['素通りする','pass']]},
dw2:{t:'金床の上に未完成の武具が置かれている。',o:[['武器を仕上げる','named',0,'完成した武具は、確かな重みを持っていた。'],['防具を鍛える','up',0,'カードが鍛えられ、より鋭くなった。'],['道具を売る','gold',50,'ドワーフ商人が高値で買い取った。']]}};
Object.assign(ST,{
mr1:{t:'砂丘の向こうに、水と宝を積んだ隊商が見える。だが影が不自然に揺らいでいる…',o:[['近づく','go',0,'隊商は蜃気楼ではなく、盗賊団の罠だった。','mr2'],['避けて進む','pass']]},
mr2:{t:'盗賊団の頭が笑う。「通行料を置いていきな」',o:[['戦う','fight'],['水を分けてもらう','heal',40,'頭は肩をすくめ、水袋を投げてよこした。'],['隙を見て宝を狙う','gamble']]},
kg1:{t:'砂に埋もれた石の入口が、風で顔を出している。古い王墓のようだ。',o:[['入口を掘る','go',0,'砂の下に、石の階段が現れた。','kg2'],['立ち去る','pass']]},
kg2:{t:'暗い玄室の奥に、王の副葬品が並んでいる。',o:[['宝を持ち出す','named',0,'呪いの気配はなかった。王は許してくれたらしい。'],['壁画を読む','sp',0,'砂漠の王サンドロスの伝承を知った。']]},
sw1:{t:'沼の中から巨大な蛙が語りかけてくる。「口づけを…してくれぬか…」',o:[['口づけする','go',0,'蛙は光に包まれ、気品ある王子の姿になった。','sw2'],['槍で突く','fight'],['無視する','pass']]},
sw2:{t:'「礼に、願いを一つ叶えよう」',o:[['力を','up',0,'カードが光を帯びた。'],['宝を','named',0,'王子は隠し財宝を差し出した。'],['癒しを','heal',50,'王子の魔法が傷を癒した。']]},
sh1:{t:'毒霧の向こうに小屋の灯りがある。薬師が住んでいるらしい。',o:[['訪ねる','go',0,'老いた薬師は毒を恐れず、愉快そうに笑っていた。','sh2'],['通り過ぎる','pass']]},
sh2:{t:'「毒を飲めば強くなる。死ななければな」',o:[['毒薬を飲む','hurtsp',12,'苦しみの果てに、知識が身についた。'],['解毒薬をもらう','heal',45,'薬師の腕は確かだった。'],['断る','pass']]},
ic1:{t:'吹雪の中、凍えた旅人が倒れている。',o:[['焚き火で温める','go',0,'旅人は息を吹き返し、礼を述べた。','ic2'],['防寒具を剥ぐ','item',0,'旅人は力なく目を閉じた…']]},
ic2:{t:'旅人は元・竜狩りだと語る。「あの竜は賢い…油断するな」',o:[['弱点を聞く','sp',0,'竜の鱗には継ぎ目があるという。'],['武具を受け取る','named',0,'「俺にはもう要らん」と旅人は微笑んだ。']]},
vl1:{t:'谷の岩陰に、脈打つ巨大な卵がある。',o:[['卵を調べる','go',0,'殻から温かい魔力が溢れている。','vl2'],['通り過ぎる','pass']]},
vl2:{t:'卵の魔力が、あなたを誘っている。',o:[['魔力を吸収する','maxhp',12,'竜の魔力が体に満ちた。'],['卵を砕く','fight'],['殻の欠片を持ち帰る','named',0,'殻は鉄より硬かった。']]}});
[['mr1',2],['kg1',2],['sw1',3],['sh1',3],['ic1',1],['vl1',4]].forEach(([k,c])=>ST[k].ch=c);
const SS=Object.keys(ST).filter(k=>k.endsWith('1'));
const evScene=n=>({t:'event',res:null,nx:null,ev:{text:n.t,opts:n.o.map(([l,k,v,tx,nx])=>({l,k,v,tx,nx}))}});

const newRoom=code=>({code,phase:'lobby',host:null,pl:{},order:[]});
function addPlayer(r,name,key){const id=Math.random().toString(36).slice(2,8),tok=Math.random().toString(36).slice(2)+Date.now().toString(36);
  const p={id,name,key,tok,cls:null,scene:null,ws:null,hp:0,mhp:0,gold:0,step:0,items:[],deck:[],seen:[]};r.pl[id]=p;r.order.push(id);if(!r.host)r.host=id;return p}
function init(p){Object.assign(p,{base:CLS[p.cls].hp,hpb:0,items:[],gold:0,step:0,shown:-1,seen:[],deck:[...CLS[p.cls].ids.slice(0,4),'k0','k0','k0','k1','k1','k1']});p.mhp=p.base+stats(p).hp;p.hp=p.mhp}

const NW={battle:32,event:28,rest:10,shop:10,treasure:8,elite:12};
function nodes(p){const s=p.step;if(s>=STEPS-1)return[{k:'rest'},{k:'shop'}];
  const w={...NW};if(s===0){delete w.rest;delete w.shop;delete w.elite}if(s<2)delete w.shop;if(s<3)delete w.elite;
  const out=[];while(out.length<3&&Object.keys(w).length){const ks=Object.keys(w),tot=ks.reduce((a,k)=>a+w[k],0);let q=R(tot),k=ks[0];for(const x of ks){if((q-=w[x])<0){k=x;break}}out.push({k});delete w[k]}
  if(!out.some(o=>o.k==='battle'||o.k==='event'))out[0]={k:'battle'};return out}
function next(r,p){
  if(p.step>=STEPS){if(!p.scene||p.scene.t!=='gather')p.hp=Math.min(p.mhp,p.hp+Math.round(p.mhp*.3));p.scene={t:'gather'};return}
  if(p.step%5===0&&p.shown!==p.step){p.shown=p.step;p.scene={t:'chapter',ch:chOf(p.step)};return}
  if(p.step%5===4)return startBattle(r,[p],false,'guard');
  p.scene={t:'map',opts:nodes(p)}}
function enter(r,p,i){const sc=p.scene;if(!sc||sc.t!=='map')return;const o=sc.opts[i];if(!o)return;const k=o.k;
  if(k==='battle')return startBattle(r,[p],false);
  if(k==='elite')return startBattle(r,[p],false,'elite');
  if(k==='shop'){p.scene=mkShop(p);return}
  if(k==='rest'){p.scene=evScene({t:'焚き火の炎が揺れている。しばし体を休められそうだ。',o:[['眠って体力を回復する','healp',40],['武具を手入れしてカードを強化する','up',0],['瞑想して不要なカードを外す','remove',0]]});return}
  if(k==='treasure'){p.scene=evScene({t:'道端に古びた宝箱が置かれている。罠の気配はない。',o:[['宝を取り出す','item',0],['金貨を探す','gold',30]]});return}
  if(R(100)<16){const l=SS.filter(s=>!p.seen.includes(s)&&(ST[s].ch===undefined||ST[s].ch===chOf(p.step)));if(l.length){const s=pick(l);p.seen.push(s);p.scene=evScene(ST[s]);return}}
  const T=pick(TP);p.scene=evScene({t:pick(PLR[chOf(p.step)])+'にて、'+T[0]+'。',o:T[1]})}
function mkShop(p){const g=[];for(let i=0;i<2;i++){const id=R(300);g.push({k:'item',id,it:item(id),price:40+R(30)})}
  const cl=CLS[p.cls].ids.concat(K);for(let i=0;i<3;i++){const c=pick(cl)+(R(100)<30?'+':'');g.push({k:'card',id:c,price:c.endsWith('+')?55:35})}
  g.push({k:'heal',price:20},{k:'remove',price:35},{k:'up',price:45});return{t:'shop',goods:g,msg:''}}
function buy(r,p,i){const sc=p.scene;if(!sc||sc.t!=='shop')return;const x=sc.goods[i];if(!x||x.sold)return;if(p.gold<x.price){sc.msg='金貨が足りない。';return}
  p.gold-=x.price;x.sold=1;
  if(x.k==='item'){p.items.push(x.id);refresh(p);sc.msg=`「${x.it.n}」を買った!`}
  else if(x.k==='card'){p.deck.push(x.id);sc.msg=`カード「${CARDS[x.id].n}」を買った。`}
  else if(x.k==='heal'){p.hp=Math.min(p.mhp,p.hp+Math.round(p.mhp*.4));sc.msg='薬で体力が回復した。';x.sold=0}
  else if(x.k==='remove')sc.msg=removeCard(p);
  else sc.msg=upgrade(p)}
function giveItem(p,nm){const l=NAMED.map((x,i)=>i).filter(i=>!p.items.includes(1000+i));
  if(l.length&&(nm||R(100)<15)){const i=pick(l);p.items.push(1000+i);refresh(p);const it=item(1000+i);return`伝説の武具「${it.n}」を手に入れた!(${LB[it.t]}+${it.v})${it.lore}。`}
  const id=R(300);p.items.push(id);refresh(p);const it=item(id);return`「${it.n}」を手に入れた!(${LB[it.t]}+${it.v})`}
function upgrade(p){const l=p.deck.map((c,i)=>i).filter(i=>p.deck[i]!=='x0'&&CARDS[p.deck[i]+'+']);if(!l.length){p.gold+=10;return'強化できるカードがなく、金貨10枚を得た。'}const i=pick(l),o=CARDS[p.deck[i]].n;p.deck[i]+='+';return`「${o}」が強化された!`}
function removeCard(p){let i=p.deck.indexOf('x0');if(i<0)i=p.deck.findIndex(c=>c==='k0'||c==='k1');if(i<0||p.deck.length<=6)return'手放せるカードはなかった。';const o=CARDS[p.deck[i]].n;p.deck.splice(i,1);return`「${o}」をデッキから外した。`}
function choose(r,p,i){
  const sc=p.scene;if(!sc||sc.t!=='event'||sc.res)return;const o=sc.ev.opts[i];if(!o)return;
  const s=Math.round(p.step*.4);let k=o.k,v=o.v||0,res='';
  if(k==='gamble'){const q=R(100);k=q<55?'item':q<70?'curse':'hurt';v=8+s}
  if(k==='fight'){startBattle(r,[p],false);return}
  if(k==='go')res='';
  else if(k==='gold'){const g=v+s*3+R(10);p.gold+=g;res=`金貨${g}枚を手に入れた。`}
  else if(k==='healp'){const h=Math.round(p.mhp*v/100);p.hp=Math.min(p.mhp,p.hp+h);res=`体力が${h}回復した。`}
  else if(k==='heal'){p.hp=Math.min(p.mhp,p.hp+v);res=`体力が${v}回復した。`}
  else if(k==='maxhp'){p.hpb+=v;refresh(p);res=`最大体力が${v}上がった。`}
  else if(k==='hurt'){const d=Math.max(0,Math.min(p.hp-1,v+s));p.hp-=d;res=`${d}のダメージを受けた…`}
  else if(k==='hurtsp'){const d=Math.max(0,Math.min(p.hp-1,v));p.hp-=d;prof(p).sp+=2;res=`${d}のダメージと引き換えにスキルポイントを2得た。`}
  else if(k==='item')res=giveItem(p);
  else if(k==='named')res=giveItem(p,1);
  else if(k==='curseitem'){res=giveItem(p,1);p.deck.push('x0','x0')}
  else if(k==='curse'){p.deck.push('x0');res='呪いのカードがデッキに混ざった…'}
  else if(k==='card'){const c=pick([...CLS[p.cls].ids,...K]);p.deck.push(c);res=`カード「${CARDS[c].n}」がデッキに加わった。`}
  else if(k==='sp'){prof(p).sp++;res='スキルポイントを1得た。'}
  else if(k==='up')res=upgrade(p);
  else if(k==='remove')res=removeCard(p);
  else if(k==='buy'||k==='buyheal'||k==='buyup'){if(p.gold<v)res='金貨が足りない。';else{p.gold-=v;res=k==='buy'?giveItem(p):k==='buyup'?upgrade(p):(p.hp=Math.min(p.mhp,p.hp+30),'薬で体力が回復した。')}}
  else res='何事もなく先へ進んだ。';
  sc.res=(o.tx?o.tx+' ':'')+res||'…';sc.nx=o.nx||null}

function drawN(b,id,n){const pt=b.parts[id];for(let i=0;i<n;i++){if(!pt.draw.length){pt.draw=shuf(pt.disc);pt.disc=[]}if(!pt.draw.length)break;pt.hand.push(pt.draw.pop())}}
const L=(b,s)=>{b.log.push(s);if(b.log.length>8)b.log.shift()};
const over=b=>{const bo=b.en.find(e=>e.boss);return bo?bo.hp<=0:!b.en.some(e=>e.hp>0)};
function startBattle(r,ps,boss,kind){
  const b={boss,kind,en:[],parts:{},ids:ps.map(p=>p.id),log:[],dt:0},n=ps.length;
  if(boss){const e={n:'賢き邪竜 ヴァルドラクス',hp:180+100*n,mhp:180+100*n,d:9+2*n,ph:1,pn:n,pat:BP[1],ti:0,burn:0,weak:0,boss:1};e.intent=intent(e);b.en=[e];L(b,'竜「我が眠りを妨げる者は誰だ」')}
  else if(kind==='guard'){b.en.push(mkGuard((ps[0].step+1)/5-1));L(b,'守護者が立ちはだかった!')}
  else if(kind==='elite'){const e=mkEnemy(ps[0].step,2);e.n='👹'+e.n;b.en.push(e)}
  else{const c=ps[0].step>=4&&R(2)?2:1;for(let i=0;i<c;i++)b.en.push(mkEnemy(ps[0].step))}
  ps.forEach(p=>{const st=stats(p);b.parts[p.id]={draw:shuf(p.deck),hand:[],disc:[],en:3+st.en,blk:st.blk,ended:false,weak:0,used:0,linked:0};drawN(b,p.id,5+st.draw);p.scene={t:'battle',b}})}
function use(r,p,b,c,t){
  const st=stats(p),pt=b.parts[p.id],live=b.en.filter(e=>e.hp>0);let tg=b.en[t];if(!tg||tg.hp<=0)tg=live[0];
  const T=c.aoe?live:[tg];
  if(c.d){const d=(c.d+(c.aoe?st.aoe:0))*(1+st.dmg/100)*(pt.weak?.75:1);T.forEach(e=>{const x=Math.round(d*(e.boss?1+st.bossd/100:1));e.hp=Math.max(0,e.hp-x);if(e.boss)b.dt+=x})}
  if(c.bn)T.forEach(e=>e.burn+=c.bn+st.burn);
  if(c.wk)(c.d?[tg]:live).forEach(e=>e.weak=c.wk);
  (c.pt?b.ids.map(i=>r.pl[i]):[p]).filter(a=>a.hp>0).forEach(a=>{const q=b.parts[a.id];if(c.b)q.blk+=c.b+(c.pt?st.party:0);if(c.h)a.hp=Math.min(a.mhp,a.hp+c.h+st.heal+(c.pt?st.party:0));if(c.mp)q.en+=c.mp});
  if(c.dr)drawN(b,p.id,c.dr);
  if(over(b))win(r,b)}
function play(r,p,i,t){const sc=p.scene;if(!sc||sc.t!=='battle'||p.hp<=0)return;const b=sc.b,pt=b.parts[p.id];if(!pt||pt.ended)return;
  const c=CARDS[pt.hand[i]];if(!c||c.c>pt.en)return;pt.en-=c.c;pt.hand.splice(i,1);pt.disc.push(c.id);use(r,p,b,c,t)}
function ult(r,p,t){const sc=p.scene;if(!sc||sc.t!=='battle'||p.hp<=0)return;const b=sc.b,pt=b.parts[p.id];if(!pt||pt.ended||pt.used)return;pt.used=1;const u=ULT[p.cls],k=1+stats(p).ultp/100;use(r,p,b,{...u,d:u.d&&Math.round(u.d*k),b:u.b&&Math.round(u.b*k),h:u.h&&Math.round(u.h*k)},t)}
function chk(r,b){const l=b.ids.map(i=>r.pl[i]).filter(p=>p.hp>0&&p.ws);if(l.length&&l.every(p=>b.parts[p.id].ended))enemyTurn(r,b)}
function endTurn(r,p){const sc=p.scene;if(!sc||sc.t!=='battle')return;sc.b.parts[p.id].ended=true;chk(r,sc.b)}
function combo(r,b){const ls=b.ids.filter(i=>b.parts[i].linked&&r.pl[i].hp>0),n=ls.length;b.combo=n;if(!n)return;const bo=b.en.find(e=>e.boss);
  const x=14*n+8*n*(n-1);if(bo){bo.hp=Math.max(0,bo.hp-x);b.dt+=x}ls.forEach(i=>b.parts[i].blk+=5*n);
  L(b,`✨ ${['','連携の一閃','双撃連携','三位一体','四天の陣'][n]}!${ls.map(i=>r.pl[i].name).join('・')}の力が竜を撃つ ${x}ダメージ`)}
function link(r,p){const sc=p.scene;if(!sc||sc.t!=='battle'||!sc.b.boss||p.hp<=0)return;const pt=sc.b.parts[p.id];if(!pt||pt.ended||pt.linked||pt.en<1)return;pt.en--;pt.linked=1;L(sc.b,`🤝 ${p.name}が連携の構えを取った`)}
function enemyTurn(r,b){combo(r,b);
  b.en.forEach(e=>{if(e.burn&&e.hp>0){e.hp=Math.max(0,e.hp-e.burn);e.burn=Math.max(0,e.burn-1)}});
  if(over(b))return win(r,b);
  b.ids.forEach(i=>b.parts[i].weak=0);
  const alive=()=>b.ids.map(i=>r.pl[i]).filter(p=>p.hp>0);
  b.en.filter(e=>e.hp>0).forEach(e=>{
    const it=e.intent,m=(e.weak>0?.5:1)*(e.boss&&e.ph===3?1.25:1);
    const hit=(p,v)=>{const pt=b.parts[p.id];let x=Math.round(v*m);const a=Math.min(pt.blk,x);pt.blk-=a;x-=a;p.hp=Math.max(0,p.hp-x);return x};
    if(it.k==='summon'){let c=0;while(b.en.filter(x=>x.hp>0&&!x.boss).length<2&&c<2){b.en.push(mkWhelp(b.ids.length,e.d,e.boss?'竜の眷属':'毒蛇の首'));c++}L(b,c?'竜「来い、我が眷属よ」':'竜は眷属を鼓舞した')}
    else if(it.k==='charge'){if(b.dt>=it.need){L(b,'⚡ 溜めを阻止!竜がひるんだ');e.weak=2}else{L(b,'🔥 竜の業火が全員を焼く!');alive().forEach(p=>hit(p,it.v))}}
    else if(it.k==='doom'){const q=Math.min(3,alive().length);if((b.combo||0)>=q){L(b,'✨ 連携の光が終焉の詠唱を打ち破った!');e.weak=2}else{L(b,'💀 終焉の詠唱が全員を襲う!');alive().forEach(p=>hit(p,it.v))}}
    else if(it.k==='all'){alive().forEach(p=>hit(p,it.v));L(b,`${e.n}の範囲攻撃!`)}
    else if(it.k==='guard')e.hp=Math.min(e.mhp,e.hp+Math.round(e.mhp*.1));
    else{const l=alive();if(l.length){const p=e.boss&&e.ph>=2?l.reduce((a,c)=>c.hp<a.hp?c:a):pick(l);const x=hit(p,it.v);L(b,`${e.n}→${p.name} ${x}ダメージ${e.boss&&e.ph>=2?'(弱き者を狙う)':''}`);if(it.k==='weak')b.parts[p.id].weak=1}}
    e.weak=Math.max(0,e.weak-1);e.ti++});
  if(!alive().length)return lose(r,b);
  const bo=b.en.find(e=>e.boss&&e.hp>0);
  if(bo){const q=bo.hp/bo.mhp,ph=q>.66?1:q>.33?2:3;if(ph>bo.ph){bo.ph=ph;bo.pat=BP[ph];bo.ti=0;b.flash=ph;L(b,ph===2?'竜「愚かな…ならば我が知略、とくと味わえ」':'竜「よくぞここまで。だが終わりだ、灰となれ!」')}}
  b.en.forEach(e=>e.intent=intent(e));b.dt=0;b.combo=0;
  b.ids.forEach(i=>{const p=r.pl[i],pt=b.parts[i],st=stats(p);pt.disc.push(...pt.hand);pt.hand=[];pt.en=3+st.en;pt.blk=st.blk;pt.ended=p.hp<=0;pt.linked=0;if(p.hp>0)drawN(b,i,5+st.draw)})}
function win(r,b){b.ids.forEach(id=>{const p=r.pl[id],st=stats(p);
  if(b.boss){p.scene={t:'over',gold:p.gold,items:p.items.length,deck:p.deck.length};prof(p).sp+=5;prof(p).wins++;r.phase='over';return}
  const k=b.kind,g=Math.round((8+p.step*2+R(8))*(1+st.gold/100)*(k?2:1));p.gold+=g;p.hp=Math.min(p.mhp,p.hp+st.heal*2+3+(k==='guard'?Math.round(p.mhp*.4):0));prof(p).sp+=k?2:1;
  const note=k==='guard'||(k==='elite'&&R(100)<45)?giveItem(p,1):'';
  p.scene={t:'reward',g,note,cards:shuf([...CLS[p.cls].ids,...K]).slice(0,3).map(c=>R(100)<(k?40:15)?c+'+':c)}})}
function lose(r,b){b.ids.forEach(id=>{const p=r.pl[id];
  if(b.boss){p.hp=Math.ceil(p.mhp*.6);p.scene={t:'gather',lost:1}}
  else{p.hp=p.mhp;p.gold>>=1;p.scene={t:'defeat'}}})}
function raid(r){const ps=r.order.map(i=>r.pl[i]).filter(p=>p.scene&&p.scene.t==='gather');if(ps.length)startBattle(r,ps,true)}
function gather(r){const on=r.order.map(i=>r.pl[i]).filter(p=>p.ws);if(on.length&&on.every(p=>p.scene&&p.scene.t==='gather'&&!p.scene.lost))raid(r)}
function offline(r){r.order.forEach(i=>{const p=r.pl[i];if(p.scene&&p.scene.t==='battle'&&p.scene.b.ids.includes(i))chk(r,p.scene.b)})}

function handle(r,id,m){
  const p=r.pl[id];if(!p)return;
  switch(m.t){
    case'class':if(m.c>=0&&m.c<12&&(r.phase==='lobby'||p.cls==null)){p.cls=m.c;if(r.phase!=='lobby'){init(p);next(r,p)}}break;
    case'start':if(r.host===id&&r.phase==='lobby'&&r.order.every(i=>r.pl[i].cls!=null)){r.phase='run';r.runs=(r.runs||0)+1;r.order.forEach(i=>{init(r.pl[i]);next(r,r.pl[i])})}break;
    case'choose':choose(r,p,m.i);break;
    case'go':enter(r,p,m.i);break;
    case'buy':buy(r,p,m.i);break;
    case'leave':if(p.scene&&p.scene.t==='shop'){p.step++;next(r,p)}break;
    case'play':play(r,p,m.i,m.g);break;
    case'ult':ult(r,p,m.g);break;
    case'link':link(r,p);break;
    case'end':endTurn(r,p);break;
    case'next':{const sc=p.scene;if(sc&&sc.t==='event'&&sc.res){if(sc.nx)p.scene=evScene(ST[sc.nx]);else{p.step++;next(r,p)}}else if(sc&&(sc.t==='defeat'||sc.t==='chapter'))next(r,p);break}
    case'reward':if(p.scene&&p.scene.t==='reward'){const c=p.scene.cards[m.i];if(c)p.deck.push(c);p.step++;next(r,p)}break;
    case'raid':if(r.host===id)raid(r);break;
    case'restart':if(r.host===id&&r.phase==='over'&&r.order.every(i=>r.pl[i].cls!=null)){r.phase='run';r.runs=(r.runs||0)+1;r.order.forEach(i=>{init(r.pl[i]);next(r,r.pl[i])})}break;
    case'again':if(r.host===id&&r.phase==='over'){r.phase='lobby';r.order.forEach(i=>{r.pl[i].scene=null})}break;
    case'skill':{const t=TREE.find(x=>x.id===m.id),pr=prof(p);if(t&&pr.sp>0&&!pr.skills.includes(t.id)&&(!t.req||pr.skills.includes(t.req))&&(t.cls===undefined||t.cls===p.cls)){pr.sp--;pr.skills.push(t.id);if(p.cls!=null&&p.base)refresh(p)}break}
  }
  if(r.phase==='run')gather(r);
}
function view(r,id){
  const p=r.pl[id],pr=prof(p),sc=p.scene;let s=null;
  if(sc){s={...sc};if(sc.t==='battle'){const b=sc.b,pt=b.parts[id],bo=b.en.find(e=>e.boss);
    s={t:'battle',boss:b.boss,kind:b.kind,ph:bo?bo.ph:0,dt:b.dt,log:b.log.slice(-5),en:b.en.map(e=>({n:e.n,hp:e.hp,mhp:e.mhp,burn:e.burn,weak:e.weak,it:e.intent,boss:!!e.boss})),hand:pt.hand,mp:pt.en,blk:pt.blk,ended:pt.ended,dr:pt.draw.length,ds:pt.disc.length,wk:pt.weak,dead:p.hp<=0,ult:{n:ULT[p.cls].n,used:pt.used},lk:b.ids.filter(i=>b.parts[i].linked).length,lkd:pt.linked,req:Math.min(3,b.ids.filter(i=>r.pl[i].hp>0).length),
    allies:b.ids.length>1?b.ids.map(i=>({n:r.pl[i].name,ended:b.parts[i].ended||r.pl[i].hp<=0,blk:b.parts[i].blk})):0}}}
  return{t:'state',code:r.code,phase:r.phase,runs:r.runs||0,host:r.host===id,
    me:{id,name:p.name,ch:chOf(p.step),cls:p.cls,hp:p.hp,mhp:p.mhp,gold:p.gold,step:p.step,deck:p.deck,items:(p.items||[]).map(item),st:p.cls==null?null:stats(p)},
    party:r.order.map(i=>{const q=r.pl[i];return{n:q.name,cls:q.cls,hp:q.hp,mhp:q.mhp,step:q.step,on:!!q.ws,sc:q.scene&&q.scene.t,me:i===id}}),
    sc:s,pr:{sp:pr.sp,skills:pr.skills,wins:pr.wins}}}
const INIT={cards:CARDS,cls:CLS,tree:TREE,lb:LB,ult:ULT,steps:STEPS,ch:CH,cht:CHT,gd:GN};
module.exports={S,newRoom,addPlayer,handle,view,offline,prof,restore,INIT};
