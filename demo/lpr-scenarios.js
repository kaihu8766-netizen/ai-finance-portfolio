/* Shared reader for the Python-generated local CSV. Rates returned as decimals. */
(function(global){
  'use strict';
  var KEYS=['P10','P50','P90'];
  var COLS={P10:'q10',P50:'q50',P90:'q90'};
  var HEADER=['month','q10','q50','q90','q10_5y','q50_5y','q90_5y'];

  function parse(text){
    var lines=String(text).replace(/^\uFEFF/,'').trim().split(/\r?\n/);
    if(lines.length!==61 || lines[0].trim()!==HEADER.join(',')){
      throw new Error('CSV必须含标准表头和连续60个月分位数；请选择脚本生成的lpr_mc_quantiles.csv');
    }
    var rows=[],byMonth=Object.create(null),previous=null;
    lines.slice(1).forEach(function(line){
      var values=line.split(',').map(function(v){return v.trim();});
      if(values.length!==HEADER.length || !/^\d{4}-(0[1-9]|1[0-2])$/.test(values[0])){
        throw new Error('CSV列数或月份格式错误');
      }
      var month=values[0],year=+month.slice(0,4),m=+month.slice(5),serial=year*12+m-1;
      if(previous!==null && serial!==previous+1) throw new Error('CSV月份必须唯一、递增且连续');
      previous=serial;
      var row={month:month};
      HEADER.slice(1).forEach(function(key,i){
        if(!values[i+1] || !Number.isFinite(Number(values[i+1]))) throw new Error('CSV存在缺失或非有限利率');
        row[key]=Number(values[i+1])/100; // CSV percentage points -> decimal annual rate.
      });
      if(row.q10>row.q50 || row.q50>row.q90 || row.q10_5y>row.q50_5y || row.q50_5y>row.q90_5y){
        throw new Error('CSV分位数必须满足P10 ≤ P50 ≤ P90');
      }
      rows.push(Object.freeze(row));byMonth[month]=row;
    });
    return Object.freeze({rows:Object.freeze(rows),first:rows[0].month,last:rows[rows.length-1].month,
      at:function(date,scenario){
        if(KEYS.indexOf(scenario)<0) throw new Error('请选择P10、P50或P90');
        var month=typeof date==='string'?date.slice(0,7):date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0');
        if(!byMonth[month]) throw new Error('重定价月份'+month+'超出CSV覆盖期'+rows[0].month+'至'+rows[rows.length-1].month+'；不外推');
        return Object.freeze({month:month,scenario:scenario,rate:byMonth[month][COLS[scenario]]});
      }
    });
  }

  function load(relativePath){
    var url=new URL(relativePath,document.baseURI);
    if(url.origin!==location.origin || (url.protocol!=='http:' && url.protocol!=='https:')){
      return Promise.reject(new Error('请通过本地HTTP服务打开，或手动选择同一份CSV；不请求外部数据源'));
    }
    return fetch(url.href,{credentials:'same-origin',cache:'no-cache'}).then(function(response){
      if(!response.ok) throw new Error('本地CSV加载失败（HTTP '+response.status+'）');
      return response.text();
    }).then(parse);
  }
  global.LprScenarios=Object.freeze({keys:Object.freeze(KEYS),parse:parse,load:load});
})(window);
