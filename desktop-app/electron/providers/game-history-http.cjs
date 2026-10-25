const https = require('node:https');
const dns = require('node:dns').promises;
const net = require('node:net');

const blocked4 = new net.BlockList(), blocked6 = new net.BlockList();
for (const [address, prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]]) blocked4.addSubnet(address,prefix,'ipv4');
for (const [address,prefix] of [['::',96],['::ffff:0:0',96],['64:ff9b::',96],['64:ff9b:1::',48],['100::',64],['2001::',23],['2001:db8::',32],['2002::',16],['fc00::',7],['fe80::',10],['ff00::',8]]) blocked6.addSubnet(address,prefix,'ipv6');
function publicAddress(address) {
  const family=net.isIP(address);
  return Boolean(family && !(family===6?blocked6:blocked4).check(address,family===6?'ipv6':'ipv4') && (family!==6 || /^[23]/.test(address)));
}
function publicNewsUrl(value, base) {
  try {
    const url=new URL(value,base),host=url.hostname.replace(/^\[|\]$/g,'').toLowerCase();
    if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||!host.includes('.')&& !net.isIP(host)||host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||(net.isIP(host)&&!publicAddress(host)))return '';
    url.hash='';return url.href;
  }catch{return '';}
}
// No Electron session/cookies, credentials, scripts, local network or proxy bypass.
// DNS is checked AND pinned for each hop, including redirects (no rebinding gap).
function createGameHistoryHttp({lookup=dns.lookup.bind(dns),get=https.get.bind(https),timeoutMs=8000,maxBytes=2*1024*1024}={}) {
  async function text(input) {
    const controller=new AbortController();
    let expiry;
    const deadline=new Promise((_,reject)=>{expiry=setTimeout(()=>{controller.abort();reject(new Error('News source timed out.'));},timeoutMs);});
    const visit=async(input,hops=0)=>{
      const url=publicNewsUrl(input);if(!url)throw new Error('Only public HTTPS news sources are supported.');
      const parsed=new URL(url),host=parsed.hostname.replace(/^\[|\]$/g,'');
      const addresses=net.isIP(host)?[{address:host,family:net.isIP(host)}]:await lookup(host,{all:true,verbatim:true});
      if(!addresses.length||addresses.some(item=>!publicAddress(item.address)))throw new Error('News source is not public.');
      if(controller.signal.aborted)throw new Error('News source timed out.');
      const pinned=addresses.find(item=>item.family===4)||addresses[0];
      return new Promise((resolve,reject)=>{
        const request=get(parsed,{signal:controller.signal,agent:false,headers:{'User-Agent':'NEO-LIB/1.0 (public game news reader)','Accept':'application/rss+xml, application/atom+xml, application/json, text/html, text/xml;q=0.9','Accept-Encoding':'identity'},lookup:(_host,options,callback)=>options.all?callback(null,[pinned]):callback(null,pinned.address,pinned.family)},response=>{
          if(response.statusCode>=300&&response.statusCode<400&&response.headers.location){
            response.destroy();if(hops>=3)return reject(new Error('Too many news redirects.'));
            try {const target=new URL(response.headers.location,parsed);
              if(target.hostname.replace(/^www\./,'')!==parsed.hostname.replace(/^www\./,''))return reject(new Error('News redirect changed publisher.'));
              return resolve(visit(target.href,hops+1));
            }catch{return reject(new Error('Invalid news redirect.'));}
          }
          if(response.statusCode!==200 || response.headers['content-encoding']&&response.headers['content-encoding']!=='identity'){response.resume();return reject(new Error('News source unavailable.'));}
          if(Number(response.headers['content-length'])>maxBytes){response.destroy();return reject(new Error('News response is too large.'));}
          const chunks=[];let bytes=0;
          response.on('data',chunk=>{bytes+=chunk.length;if(bytes>maxBytes){request.destroy();response.destroy();reject(new Error('News response is too large.'));}else chunks.push(Buffer.from(chunk));});
          response.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
          response.on('error',reject);response.on('aborted',()=>reject(new Error('News response interrupted.')));
        });request.on('error',reject);
      });
    };
    try{return await Promise.race([visit(input),deadline]);}finally{clearTimeout(expiry);}
  }
  return {text,json:async url=>JSON.parse(await text(url))};
}
module.exports={createGameHistoryHttp,publicNewsUrl,publicAddress};
