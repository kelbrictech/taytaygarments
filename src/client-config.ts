/** Deployment-scoped PUBLIC config. Never store secrets here. */
export type Feature='orders'|'inventory'|'quality'|'careers';
export type ClientConfig={
 id:string;
 brand:{displayName:string;tagline:string;location:string;primaryColor:string;accentColor:string};
 features:Record<Feature,boolean>;
};
const featureNames:Feature[]=['orders','inventory','quality','careers'];
const DEFAULT:ClientConfig={id:'taytaygarments',brand:{displayName:'Taytay Textile Co.',tagline:'UNIFORMS & APPAREL',location:'Taytay, Rizal · Philippines',primaryColor:'#153c36',accentColor:'#bc7454'},features:{orders:true,inventory:true,quality:true,careers:true}};
const obj=(x:unknown):Record<string,unknown>=>{if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Config must be an object');return x as Record<string,unknown>};
const only=(x:Record<string,unknown>,allowed:string[])=>{if(Object.keys(x).some(k=>!allowed.includes(k)))throw Error('Unknown client config field')};
export function loadClientConfig(env:{CLIENT_CONFIG_JSON?:string}):ClientConfig{
 const result:ClientConfig=JSON.parse(JSON.stringify(DEFAULT));
 if(!env.CLIENT_CONFIG_JSON)return result;
 if(env.CLIENT_CONFIG_JSON.length>4096)throw Error('Config exceeds maximum length');
 const c=obj(JSON.parse(env.CLIENT_CONFIG_JSON));only(c,['id','brand','features']);
 if(typeof c.id!=='string'||!/^[a-z0-9][a-z0-9-]{2,48}$/.test(c.id))throw Error('Invalid client ID');
 result.id=c.id;
 if(c.brand!==undefined){
  const b=obj(c.brand);only(b,['displayName','tagline','location','primaryColor','accentColor']);
  for(const key of ['displayName','tagline','location'] as const){
   if(b[key]===undefined)continue;
   const value=b[key];
   if(typeof value!=='string'||!value.trim()||value.trim().length>120||/[<>\u0000-\u001f]/.test(value))throw Error('Invalid brand text');
   result.brand[key]=value.trim();
  }
  for(const key of ['primaryColor','accentColor'] as const){
   if(b[key]===undefined)continue;
   if(typeof b[key]!=='string'||!/^#[A-Fa-f0-9]{6}$/.test(b[key]))throw Error('Invalid color');
   result.brand[key]=b[key];
  }
 }
 if(c.features!==undefined){
  const f=obj(c.features);only(f,featureNames);
  for(const key of featureNames)if(f[key]!==undefined){
   if(typeof f[key]!=='boolean')throw Error('Feature must be boolean');
   result.features[key]=f[key];
  }
 }
 return result;
}
export function featureForApiPath(path:string):Feature|null{
 if(/^\/api\/v2\/orders(?:\/|$)/.test(path))return 'orders';
 if(/^\/api\/v2\/(?:stock|suppliers|purchase-orders)(?:\/|$)/.test(path))return 'inventory';
 if(/^\/api\/v2\/qms(?:\/|$)/.test(path))return 'quality';
 if(path==='/api/v2/jobs'||path==='/api/v2/pages/careers')return 'careers';
 return null;
}
