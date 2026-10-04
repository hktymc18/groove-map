/* 簡易 Firebase compat スタブ（テスト専用・インメモリ） */
(function(){
"use strict";
// 使い方ガイドの初回吹き出しはテストでは出さない（ガイドのテストは __gxShowHint をセットして確認）
try{ if(!localStorage.getItem("__gxShowHint")) localStorage.setItem("bci_guide_hint","1"); }catch(e){}
var OWNER_UID = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
var store = {};              // fullPath -> data
var listeners = {};          // collPath -> [fn]
var authCb = null;
var curUser = { uid: OWNER_UID, email: 'owner@example.com' };

// 事前データ: オーナーのプロフィール
store['cards/tokwhitetokwhitetokwhitetokwhite'] = { no:'101', name:'白石 一般', group:'馬越BD', union:'BASE ANTARES', grade:'' };
store['cards/toksilvertoksilvertoksilvertoksil'] = { no:'102', name:'銀山 昇', group:'井上BD', union:'BASE REVE', grade:'BR' };
store['cards/tokgoldtokgoldtokgoldtokgoldtokgo'] = { no:'103', name:'金田 輝', group:'馬越BD', union:'BASE ANTARES', grade:'BR' };
store['cards/tokplattokplattokplattokplattokpl'] = { no:'104', name:'白金 澄', group:'小川BD', union:'LIEN LOAD', grade:'プラチナ' };
store['cards/tokblacktokblacktokblacktokblackt'] = { no:'105', name:'黒岩 頂', group:'馬越BD', union:'BASE ANTARES', grade:'JETCLUB' };
store['cards/cafebabecafebabecafebabecafebabe'] = { no:'100', name:'アン 太郎', group:'馬越BD', union:'ANTARES' };
(function(){
  var d = new Date();
  function pd(n){ return (n<10?'0':'')+n; }
  var today = d.getFullYear()+'-'+pd(d.getMonth()+1)+'-'+pd(d.getDate());
  store['checkinEvents/evself1'] = { date: today, month: today.slice(0,7), name: 'RALLY', speaker: '講師A',
    mode:'self', selfOpen:true, hostLabel:'CLAVIS', hostUnion:'ANTARES', unions:['ANTARES'], requireCode:false };
  store['checkinEvents/evself2'] = { date: today, month: today.slice(0,7), name: 'SUMMIT',
    mode:'self', selfOpen:true, hostLabel:'CLAVIS', hostUnion:'ANTARES', unions:['ANTARES'], requireCode:true, venueCode:'4821' };
  store['checkinEvents/evon1'] = { date: today, month: today.slice(0,7), name: 'ONLINE-HOWDY', speaker: '講師B',
    hostUnion:'ANTARES', unions:['ANTARES'], online:true, onlineFee:1000, onlinePayTo:'PayPay ID km' };
  var d2 = new Date(d.getTime() + 86400000 * 2);
  var day2 = d2.getFullYear()+'-'+pd(d2.getMonth()+1)+'-'+pd(d2.getDate());
  store['checkinEvents/evnext1'] = { date: today, month: today.slice(0,7), name: 'P&P', speaker: '山内',
    hostUnion:'ANTARES', unions:['ANTARES'] };
  store['checkinEvents/evnext2'] = { date: day2, month: day2.slice(0,7), name: 'SYS',
    hostUnion:'ANTARES', unions:['ANTARES'] };
  store['checkinEvents/evclosed'] = { date: today, month: today.slice(0,7), name: 'CLOSED',
    mode:'self', selfOpen:false, hostLabel:'CLAVIS', hostUnion:'ANTARES', unions:['ANTARES'] };
})();
store['users/' + OWNER_UID] = { name:'テスト管理者', union:'ANTARES', area:'福岡', role:'admin', status:'active' };

// テストからの事前シード（localStorage経由・reload後に反映）
try{
  var seed = JSON.parse(localStorage.getItem('__stubSeed') || 'null');
  if(seed) Object.keys(seed).forEach(function(k){ store[k] = seed[k]; });
}catch(e){}
window.__stubStore = store;
window.__stubNotify = function(p){ notify(p); };

function notify(collPath){
  (listeners[collPath] || []).forEach(function(fn){ fn(snapForColl(collPath, null)); });
}
function docsIn(collPath, filters){
  var out = [];
  Object.keys(store).forEach(function(p){
    if(p.indexOf(collPath + '/') !== 0) return;
    var rest = p.slice(collPath.length + 1);
    if(rest.indexOf('/') >= 0) return;  // 直下のみ
    var d = store[p];
    var ok = true;
    (filters || []).forEach(function(f){
      if(f.op === '==' && d[f.field] !== f.value) ok = false;
      if(f.op === 'array-contains' && (d[f.field] || []).indexOf(f.value) < 0) ok = false;
      if(f.op === '>=' && !(d[f.field] >= f.value)) ok = false;
      if(f.op === '<=' && !(d[f.field] <= f.value)) ok = false;
    });
    if(ok) out.push({ id: rest, _data: d });
  });
  return out;
}
function snapForColl(collPath, filters){
  var docs = docsIn(collPath, filters);
  return {
    forEach: function(cb){ docs.forEach(function(x){ cb({ id: x.id, data: function(){ return x._data; }, exists: true }); }); },
    size: docs.length
  };
}
function DocRef(path){
  this.path = path;
  this.id = path.split('/').pop();
}
DocRef.prototype.get = function(){
  var p = this.path;
  return Promise.resolve({ exists: !!store[p], id: this.id, data: function(){ return store[p]; } });
};
DocRef.prototype.set = function(data, opts){
  var p = this.path;
  if(opts && opts.merge && store[p]){
    var merged = {}; Object.keys(store[p]).forEach(function(k){ merged[k] = store[p][k]; });
    Object.keys(data).forEach(function(k){
      if(data[k] === '__del__') delete merged[k]; else merged[k] = data[k];
    });
    store[p] = merged;
  } else store[p] = data;
  notify(p.split('/').slice(0, -1).join('/'));
  return Promise.resolve();
};
DocRef.prototype.update = function(data){
  if(!store[this.path]) return Promise.reject({ code: 'not-found', message: 'No document to update' });
  return this.set(data, { merge: true });
};
DocRef.prototype.delete = function(){
  delete store[this.path];
  notify(this.path.split('/').slice(0, -1).join('/'));
  return Promise.resolve();
};
DocRef.prototype.collection = function(name){ return new CollRef(this.path + '/' + name); };

function CollRef(path, filters){ this.path = path; this.filters = filters || []; }
CollRef.prototype.doc = function(id){ return new DocRef(this.path + '/' + id); };
CollRef.prototype.where = function(f, op, v){
  return new CollRef(this.path, this.filters.concat([{field:f, op:op, value:v}]));
};
CollRef.prototype.get = function(){ return Promise.resolve(snapForColl(this.path, this.filters)); };
CollRef.prototype.add = function(data){
  var id = 'auto' + Math.random().toString(36).slice(2, 9);
  store[this.path + '/' + id] = data;
  notify(this.path);
  return Promise.resolve(new DocRef(this.path + '/' + id));
};
CollRef.prototype.onSnapshot = function(a, b, c){
  var cb = (typeof a === 'function') ? a : b;
  var path = this.path, filters = this.filters;
  var fn = function(){ cb(snapForColl(path, filters)); };
  (listeners[path] = listeners[path] || []).push(fn);
  setTimeout(fn, 0);
  return function(){ listeners[path] = (listeners[path] || []).filter(function(x){ return x !== fn; }); };
};
CollRef.prototype.count = function(){
  var path = this.path, filters = this.filters;
  return { get: function(){ return Promise.resolve({ data: function(){ return { count: docsIn(path, filters).length }; } }); } };
};

function Batch(){ this.ops = []; }
Batch.prototype.set = function(ref, data, opts){ this.ops.push(['set', ref, data, opts]); };
Batch.prototype.delete = function(ref){ this.ops.push(['del', ref]); };
Batch.prototype.commit = function(){
  var ps = this.ops.map(function(o){
    return o[0] === 'del' ? o[1].delete() : o[1].set(o[2], o[3]);
  });
  return Promise.all(ps);
};

var fsFactory = function(){
  return {
    collection: function(name){ return new CollRef(name); },
    batch: function(){ return new Batch(); }
  };
};
fsFactory.FieldValue = {
  serverTimestamp: function(){ return '__ts__'; },
  delete: function(){ return '__del__'; }
};

window.firebase = {
  initializeApp: function(){},
  auth: function(){
    return {
      onAuthStateChanged: function(cb){ authCb = cb; setTimeout(function(){ cb(curUser); }, 0); },
      signInWithEmailAndPassword: function(){ curUser = { uid: OWNER_UID, email:'owner@example.com' }; if(authCb) authCb(curUser); return Promise.resolve({user:curUser}); },
      createUserWithEmailAndPassword: function(){ return Promise.resolve({ user: curUser }); },
      signOut: function(){ curUser = null; if(authCb) authCb(null); return Promise.resolve(); }
    };
  },
  firestore: fsFactory
};

})();
