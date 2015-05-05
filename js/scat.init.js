/*
 * d3Scat.js
 * 散布図初期化モジュール
*/

/* jslint         browser  : true, continue : true,
   devel  : true, indent   : 2,    maxerr   : 50,
   newcap : true, nomen    : true, plusplus : true,
   regexp : true, sloppy   : true, vars     : false,
   white  : true, laxbreak : true
*/
/* global $, scat, d3: true */

scat.init = (function() {
  // モジュール内で使用する変数の宣言
  var
    // mysqlが返した結果を格納する変数
    data,strct,
      
    // 静的設定値
    configMap = {
      key : {
        'numType':[],
        'dateType':[],
        'charType':[],
        'allType':[]
      },
      'axSlct' : {
        'x': null,
        'y': null,
        'r': null,
        'c': null
      },
      svgSize : {
        'w' : 1200, 
        'h' : 600
      },
      margin :  {
        'top'    : 20, 
        'right'  : 110, 
        'bottom' : 40, 
        'left'   : 50
      },
      graphSize : {
        'w': null,
        'h': null
      }
    },
    stateMap={
      'getStrct' : false,
      'getData'  : false,
      'setFrame' : false,
      
      'svg' : null,
      'axSlct' : {
        'x': null,
        'y': null,
        'r': null,
        'c': null
      },
      'axSort' : {
        'x': [],
        'y': [],
        'c': []
      },
      'scale' : {
        'x': null,
        'y': null,
        'r': null,
        'c': null
      },
      'color':null,
      'bubble': null,
      'axLine':{
        'x':null,
        'y':null
      },
      'table':null,
      'key':{
        'x':null,
        'y':null
      },
      'domain':{
        'x':null,
        'y':null,
        'r':null
      },
      'regLine':null,
      'ols':null,
      'legend':null
    },
      
    //関数宣言
    initModule,
    setFrame,
    getData,
    getStrct,
    tableReset,
    unique,
    redraw,
    makeScat,
    dummy,
    actvBtn,
    olsCalc;

  
  // getData関数
  // 散布図に描画するデータのロード
  // mysqlのテーブルを想定()
  // * 引数 - コールバック関数
  //
  getData = function(callback) {
    d3.json("api/data.json",function(e, d) {
//    d3.json("api/data.php",function(e, d) {
      data = d;
      stateMap.getData = true;
      callback();
    });
  };
  
  // getStrct関数
  // 散布図に描画するデータの構造を取得する
  // mysqlのテーブルを想定()
  // * 引数 - コールバック関数
  //
  getStrct = function(callback) {
    d3.json("api/strct.json", function(e, d){
    //d3.json("api/strct.php", function(e, d){
      strct = d;
      $.each(strct, function(i){
        // 数値型の場合
        if(
          strct[i].Type               === 'double' || 
          strct[i].Type               === 'float' || 
          strct[i].Type.substring(0,3)=== 'int' || 
          strct[i].Type.substring(0,6)=== 'bigint' ||
          strct[i].Type.substring(0,7)=== 'decimal'
        ){
          configMap.key.numType.push(strct[i].Field);
        }
        // 日付型の場合
        else if (
          strct[i].Type==='date' ||
          strct[i].Type==='timestamp'
        ){
          configMap.key.dateType.push(strct[i].Field);
        }
        // 文字型の場合
        else if (
          strct[i].Type==='char' ||
          strct[i].Type.substring(0,7)==='varchar'
        ){
          configMap.key.charType.push(strct[i].Field);
        }
        configMap.key.allType.push(strct[i].Field);
      });
      stateMap.getStrct = true;
      callback();
    });
  };
  
  setFrame = function(callback){
    configMap.graphSize.w = configMap.svgSize.w - configMap.margin.right - configMap.margin.left;
    configMap.graphSize.h = configMap.svgSize.h - configMap.margin.top - configMap.margin.bottom;
    stateMap.setFrame = true;
    callback();
  };

  tableReset = function(dataIn,colIn,targetIn){
    stateMap.table = d3.select(targetIn);
    stateMap.table.selectAll('th').remove();
    stateMap.table.selectAll('th').data(colIn).enter().append('th') 
            .text(function(d){return d;});
    stateMap.table.selectAll('tr').remove();
	stateMap.table.selectAll('td').remove();
    stateMap.table.selectAll('tr').data(dataIn).enter().append('tr')
            .selectAll('td').data(function(d){return d3.values(d);})
            .enter().append('td').text(function(d){return d;});
    return true;
  };

  // ユーティリティメソッド/unique/
  // 用途：配列を与えると一意にしてソートした上で返す
  // 引数：
  //  * 一次元配列
  // 使用：unique(array);
  //
  unique = function(arr){
    var d = {};
    var uArr = [];
    var i,value;
    for ( i=0; i<arr.length; i++) {
      value = arr[i];
      if (!(value in d)) {
        d[value] = true;
        uArr.push(value);
      }
    }
    return uArr.sort();
  };
    
  makeScat = function(){
    // データロードと、データ構造取得と、フレーム作成が終わるまで動かさない
    if (stateMap.getData && stateMap.getStrct && stateMap.setFrame){
      
      // ロードしたデータの中で日付/数値型データを文字列から日付/数値へ変換する
      data.forEach(function(d){
        configMap.key.numType.forEach(function(dd){
          d[dd] = Number(d[dd]);
        });
      });
      
      // svg領域作成
      stateMap.svg = 
        d3.select('#svg')
          .attr({
            'width'  :configMap.svgSize.w,
            'height' :configMap.svgSize.h});
      // X軸に割り当てる可能性のある項目をオプションに入れる（すべての型）
      //
      configMap.axSlct.x = 
        d3.select('#axSlct-xIn').selectAll('option')
        .data(configMap.key.allType).enter()
        .append('option')
        .text(function(d){return d;})
        .attr({'value':function(d){return d;}});
      
      // Y軸に割り当てる可能性のある項目をオプションに入れる（すべての型）
      //
      configMap.axSlct.y = 
        d3.select('#axSlct-yIn').selectAll('option')
        .data(configMap.key.allType).enter()
        .append('option')
        .text(function(d){return d;})
        .attr({'value':function(d){return d;}});
      
      // バブルサイズに割り当てる可能性のある項目をオプションに入れる（数値型のデータのみ）
      //
      configMap.key.numType.unshift(''); //空行の追加(bubble sizeを使わない時のため)
      configMap.axSlct.r = 
        d3.select('#axSlct-rIn')
        .selectAll('option')
        .data(configMap.key.numType).enter()
        .append('option')
        .text(function(d){return d;})
        .attr({'value':function(d){return d;}});
      configMap.key.numType.shift(); //空行削除
      
      // 色に割り当てる可能性のある項目をオプションに入れる（数値型のデータのみ）
      //
      configMap.axSlct.c = 
        d3.select('#axSlct-cIn').selectAll('option')
          .data(configMap.key.charType).enter()
          .append('option')
          .text(function(d){return d;})
          .attr({'value':function(d){return d;}});
      
      // X軸、Y軸、バブルサイズ、色のスケール初期化
      //
      stateMap.scale.x = 
        d3.scale.linear().domain([0,1])
          .range([ configMap.margin.left, (configMap.margin.left + configMap.graphSize.w)]);
      stateMap.scale.y = 
        d3.scale.linear().domain([0,1])
          .range([ configMap.margin.top + configMap.graphSize.h, configMap.margin.top]);
      stateMap.scale.r = d3.scale.sqrt().domain([0,1]).range([0]);
      
      // バブルの配置
      // 初期なのですべて真ん中に見えないように配置する
      //
      stateMap.bubble = 
        stateMap.svg.selectAll('circle').data(data).enter().append('circle')
                .attr({
                  'class'        : 'bubble',
                  'cx'           : function(){
                    return (configMap.graphSize.w -
                            (configMap.margin.left+configMap.margin.right))/2+configMap.margin.left;
                  },
                  'cy'           : function(){
                    return (configMap.graphSize.h -
                            (configMap.margin.top+configMap.margin.bottom))/2+configMap.margin.top;},
                  'r'            : 0,
                  'fill'         : '#FFFFFF',
                  'stroke-width' : 0,
                  'opacity'      : 0.7});
      
      // 軸の初期化
      // 
      stateMap.axLine.x = 
        stateMap.svg.append('g')
                .attr({
                  'id'        : 'axLine-x',
                  'class'     : 'axLine',
                  'transform' : 'translate(0,' + (configMap.svgSize.h-configMap.margin.bottom)+')'})
                .call(d3.svg.axis().scale(stateMap.scale.x).orient('bottom').ticks(9));
      
      stateMap.axLine.y = 
        stateMap.svg.append('g')
                .attr({
                  'id'        : 'axLine-y',
                  'class'     : 'axLine',
                  'transform' : 'translate('+configMap.margin.left+',0)'})
                .call(d3.svg.axis().scale(stateMap.scale.y).orient('left').ticks(6));
      tableReset(data,configMap.key.allType,'#table');
      
      //ボタンに再描画関数をバインドしてからボタンをアクティブにする
      $('#redraw').bind('click',function(){redraw(actvBtn);}).val('draw now!').prop('disabled',false);
      
      
      return true;

    }else{
      return true;
    }
  };
  actvBtn = function(){
    $('#redraw').val('draw now!').prop('disabled',false);
  };
  
  dummy = function(){};
  
  olsCalc = function(d,pk,x,y,c,cm,sd,ss){
    var rgLn = new Array(pk.length), // 近似直線の頂点が格納される
        xSgm = new Array(pk.length), // Σx
        ySgm = new Array(pk.length), // Σy
        xySgm = new Array(pk.length), // Σx*y
        xSgmPow = new Array(pk.length), // Σx^2
        length = new Array(pk.length),// データを各項目毎に振り分けた時の母数
        i,j;
    // 数値型で初期化
    for(i=0;i<pk.length;i++){
      xSgm[i] = 0;
      ySgm[i] = 0;
      xySgm[i] = 0;
      xSgmPow[i] = 0;
      length[i] = 0;
    }
    
    for(i=0;i<d.length;i++){
      j = -1;
      while(d[i][c] !== pk[j]){
        j++;
        if(d[i][c] === pk[j]){
          xSgm[j] = xSgm[j] + d[i][x];
          ySgm[j] = ySgm[j] + d[i][y];
          xySgm[j] = xySgm[j] + (d[i][x] * d[i][y]);
          xSgmPow[j] = xSgmPow[j] + Math.pow(d[i][x],2);
          length[j]++;
        }
      }
    }
    for(i=0;i<pk.length;i++){
      rgLn[i] ={
        'slp':null,
        'itcpt':null,
        'minxy':{
          'x':null,
          'y':null
        },
        'maxxy':{
          'x':null,
          'y':null
        },
        'olsClr':null
      }; 
      rgLn[i].slp = 
        ((length[i])*xySgm[i]-xSgm[i]*ySgm[i])/((length[i])*xSgmPow[i]-Math.pow(xSgm[i],2));
      rgLn[i].itcpt = 
        (xSgmPow[i]*ySgm[i]-xySgm[i]*xSgm[i])/((length[i])*xSgmPow[i]-Math.pow(xSgm[i],2));      
      rgLn[i].minxy.x = ss.x.invert(configMap.margin.left);
      rgLn[i].minxy.y = rgLn[i].slp * rgLn[i].minxy.x + rgLn[i].itcpt;
      rgLn[i].maxxy.x = ss.x.invert((cm.margin.left + cm.graphSize.w));
      rgLn[i].maxxy.y = rgLn[i].slp * rgLn[i].maxxy.x + rgLn[i].itcpt;
      rgLn[i].olsClr=pk[i];
    }
    return rgLn;
  };
  
  redraw = function(callback){
    // redrawボタンを無効にして二重押下を防止
    $('#redraw').prop('disabled',true).val('loading...');
    stateMap.axSlct = {
      'x':$('#axSlct-xIn').val(),
      'y':$('#axSlct-yIn').val(),
      'r':$('#axSlct-rIn').val(),
      'c':$('#axSlct-cIn').val()
    };
    // x軸とy軸に設定された項目の型を判別してstateMap.keyに格納する
    $.each(configMap.key.charType, function(i,d){
      if ($('#axSlct-xIn').val()==d){ stateMap.key.x='char'; }
    });
    $.each(configMap.key.numType, function(i,d){
      if ($('#axSlct-xIn').val()==d){ stateMap.key.x='num'; }
    });
    $.each(configMap.key.dateType, function(i,d){
      if ($('#axSlct-xIn').val()==d){ stateMap.key.x='date'; }
    });
    $.each(configMap.key.charType, function(i,d){
      if ($('#axSlct-yIn').val()==d){ stateMap.key.y='char'; }
    });
    $.each(configMap.key.numType, function(i,d){
      if ($('#axSlct-yIn').val()==d){ stateMap.key.y='num'; }
    });
    $.each(configMap.key.dateType, function(i,d){
      if ($('#axSlct-yIn').val()==d){ stateMap.key.y='date'; }
    });
    
    // domainの設定
    // 軸に設定したものが数値型だった場合はdomainを設定する
    // 
    if(stateMap.key.x==='num'){
      stateMap.domain.x = d3.extent(data,function(d){return d[stateMap.axSlct.x];});
    }else if(stateMap.key.x==='date'){
      stateMap.domain.x = d3.extent(data,function(d){return new Date(d[stateMap.axSlct.x]);});
    }
    if(stateMap.key.y==='num'){
      stateMap.domain.y = d3.extent(data,function(d){return d[stateMap.axSlct.y];});
    }else if(stateMap.key.y==='date'){
      stateMap.domain.y = d3.extent(data,function(d){return new Date(d[stateMap.axSlct.y]);});
    }

    if(stateMap.axSlct.r!==''){
      stateMap.domain.r = d3.extent(data,function(d){return d[stateMap.axSlct.r];});
    }else{
      stateMap.domain.r = [1,1];
    }
    
    // scaleの設定
    
    // xScaleの設定
    if(stateMap.key.x==='char'){
      stateMap.axSort.x=[];
      $.each(data,function(i,d) {
        stateMap.axSort.x.push(d[stateMap.axSlct.x]);
      });
      stateMap.axSort.x = unique(stateMap.axSort.x);
      stateMap.scale.x = 
        d3.scale.ordinal()
          .rangeRoundBands([configMap.margin.left,configMap.svgSize.w-configMap.margin.right])
          .domain(stateMap.axSort.x);

    }else if (stateMap.key.x==='num'){
      stateMap.scale.x = d3.scale;
      if($('#axSlct-xScale').val()==='linear'){
        stateMap.scale.x = stateMap.scale.x.linear();
      }else if($('#axSlct-xScale').val()==='log'){
        stateMap.scale.x = stateMap.scale.x.log();
      }else if($('#axSlct-xScale').val()==='power'){
        stateMap.scale.x = stateMap.scale.x.pow().exponent(2);
      }else if($('#axSlct-xScale').val()==='sqrt'){
        stateMap.scale.x = stateMap.scale.x.sqrt();
      }
      if($('#axSlct-xScale').val()==='log'){
        stateMap.scale.x = 
          stateMap.scale.x
                  .domain([1,stateMap.domain.x[1]]);
      }else if($('#axSlct-xScale').val()!=='log'){
        stateMap.scale.x = 
          stateMap.scale.x
                  .domain(stateMap.domain.x);
      }
      stateMap.scale.x = 
        stateMap.scale.x
                .range([configMap.margin.left,(configMap.margin.left + configMap.graphSize.w)]);
                        
    }else if (stateMap.key.x==='date'){      
      stateMap.scale.x = 
        d3.time.scale()
          .domain([new Date(stateMap.domain.x[0]), new Date(stateMap.domain.x[1])])
          .range([configMap.margin.left,(configMap.margin.left + configMap.graphSize.w)]);
      
    }
    // yScaleの設定
    if(stateMap.key.y==='char'){
      stateMap.axSort.y=[];
      $.each(data,function(i,d) {
        stateMap.axSort.y.push(d[stateMap.axSlct.y]);
      });
      stateMap.axSort.y = unique(stateMap.axSort.y);
      stateMap.scale.y =
        d3.scale.ordinal()
          .rangeRoundBands([configMap.svgSize.h-configMap.margin.bottom,configMap.margin.top])
          .domain(stateMap.axSort.y);  
    }else if (stateMap.key.y==='num'){
      stateMap.scale.y = d3.scale;
      if($('#axSlct-yScale').val()==='linear'){
        stateMap.scale.y = stateMap.scale.y.linear();
      }else if($('#axSlct-yScale').val()==='log'){
        stateMap.scale.y = stateMap.scale.y.log();
      }else if($('#axSlct-yScale').val()==='power'){
        stateMap.scale.y = stateMap.scale.y.pow().exponent(2);
      }else if($('#axSlct-yScale').val()==='sqrt'){
        stateMap.scale.y = stateMap.scale.y.sqrt();
      }
      if($('#axSlct-yScale').val()==='log'){
        stateMap.scale.y = 
          stateMap.scale.y
                  .domain([1,stateMap.domain.y[1]]);
      }else if($('#axSlct-yScale').val()!=='log'){
        stateMap.scale.y = 
          stateMap.scale.y
                  .domain(stateMap.domain.y);
      }
      stateMap.scale.y = 
        stateMap.scale.y
                .range([configMap.margin.top + configMap.graphSize.h,configMap.margin.top]);
    }else if (stateMap.key.y==='date'){
      stateMap.scale.y = 
        d3.time.scale()
          .domain([new Date(stateMap.domain.y[0]), new Date(stateMap.domain.y[1])])
          .range([configMap.margin.top + configMap.graphSize.h,configMap.margin.top]);
      
    }
    stateMap.scale.r = d3.scale.sqrt()
                         .domain(stateMap.domain.r)
                         .range([3,10]);
    stateMap.color = d3.scale.category10();
    stateMap.scale.c = stateMap.color.domain([]);
    
    // ----------/軸の設定完了/------------
    
    // 散布図描画開始
    // 軸再描画
    stateMap.axLine.x.transition().duration(1000)
            .call(d3.svg.axis().scale(stateMap.scale.x).orient('bottom').ticks(9));
    
    
    stateMap.axLine.y.transition().duration(1000)
            .call(d3.svg.axis().scale(stateMap.scale.y).orient('left').ticks(6));
    
    
    // 補助線描画
    stateMap.svg.on('mousemove',function(){
      if($('#axSlct-aIn').prop('checked')===true){
        stateMap.svg.selectAll('.assLine').remove();
        var mp = d3.mouse(this);//マウスポジションの座標を格納
        if(mp[0] > configMap.margin.left &&
           mp[0] < configMap.svgSize.w - configMap.margin.right &&
           mp[1] > configMap.margin.top &&
           mp[1] < configMap.svgSize.h - configMap.margin.bottom
          ){
          stateMap.svg.append('line')
                  .attr({
                    'x1'   : mp[0],
                    'x2'   : mp[0],
                    'y1'   : configMap.margin.top,
                    'y2'   : configMap.svgSize.h-configMap.margin.bottom,
                    'class': 'assLine'});
          stateMap.svg.append('line')
                  .attr({
                    'x1'   : configMap.margin.left,
                    'x2'   : configMap.svgSize.w-configMap.margin.bottom,
                    'y1'   : mp[1],
                    'y2'   : mp[1],
                    'class': 'assLine'});
        }
        if(stateMap.key.x === 'num' || stateMap.key.x === 'date'){
          stateMap.svg.append('text')
                  .text(
                    function(){
                      if(stateMap.key.x === 'num'){
                        return Math.round(stateMap.scale.x.invert(mp[0]));
                      }else if(stateMap.key.x === 'date'){
                        return stateMap.scale.x.invert(mp[0]);
                      }
                    }
                  )
                  .attr({
                    'x':mp[0],
                    'y':configMap.svgSize.h - configMap.margin.bottom,
                    'class':'assLine',
                    'text-anchor':'middle',
                    'alignment-baseline':'text-before-edge'});
        }
        if(stateMap.key.y === 'num'||stateMap.key.y === 'date'){
          stateMap.svg.append('text')
                  .text(
                    function(){
                      if(stateMap.key.y === 'num'){
                        return Math.round(stateMap.scale.y.invert(mp[1]));
                      }else if(stateMap.key.y === 'date'){
                        return stateMap.scale.y.invert(mp[1]);
                      }
                    }
                  )
                  .attr({
                    'x':configMap.margin.left,
                    'y':mp[1],
                    'class': 'assLine',
                    'text-anchor':'end',
                    'alignment-baseline':'middle'});
        }
      }
    });
    stateMap.svg.on('mouseout',function(){
      stateMap.svg.selectAll('.assLine').remove();
    });
    
    // 区切り線作成(文字列の時のみ)
    stateMap.svg.selectAll('.partLine').remove();
    if(stateMap.key.x==='char'){
      $.each(stateMap.axSort.x, function(i){
        stateMap.svg.append('line')
                .attr({
                  'x1':stateMap.scale.x(stateMap.axSort.x[i]) + stateMap.scale.x.rangeBand(),
                  'x2':stateMap.scale.x(stateMap.axSort.x[i]) + stateMap.scale.x.rangeBand(),
                  'y1':configMap.margin.top,
                  'y2':configMap.svgSize.h-configMap.margin.bottom,
                  'class':'partLine'});
      });
    }
    if(stateMap.key.y==='char'){
      $.each(stateMap.axSort.y, function(i){
        stateMap.svg.append('line')
                .attr({
                  'x1':configMap.margin.left,
                  'x2':configMap.svgSize.w-configMap.margin.right,
                  'y1':stateMap.scale.y(stateMap.axSort.y[i]),
                  'y2':stateMap.scale.y(stateMap.axSort.y[i]),
                  'class':'partLine'});
      });
    }
    
    // bubbleを再描画する
    stateMap.bubble.transition().duration(2000)
            .attr({
              'cx':function(d){
                if(stateMap.key.x==='char'){
                  return stateMap.scale.x(d[stateMap.axSlct.x])
                         +stateMap.scale.x.rangeBand()*0.5
                         +(Math.random()-0.5)*stateMap.scale.x.rangeBand()*0.48;
                }else if(stateMap.key.x==='num'){
                  // Infinityの場合とNanの場合の処理を入れたい
                  return stateMap.scale.x(d[stateMap.axSlct.x]);
                }else if(stateMap.key.x==='date'){
                  return stateMap.scale.x(new Date(d[stateMap.axSlct.x]));
                }
              },
              'cy':function(d){
                if(stateMap.key.y==='char'){
                  return stateMap.scale.y(d[stateMap.axSlct.y])
                         +stateMap.scale.y.rangeBand()*0.5
                         +(Math.random()-0.5)*stateMap.scale.y.rangeBand()*0.48;
                }else if(stateMap.key.y==='num'){
                  // Infinityの場合とNanの場合の処理を入れたい
                  return stateMap.scale.y(d[stateMap.axSlct.y]);
                }else if(stateMap.key.y==='date'){
                  return stateMap.scale.y(new Date(d[stateMap.axSlct.y]));
                }
              },
              'r':function(d){
                if(stateMap.axSlct.r===''){
                  return 3.5;
                }else{
                  return stateMap.scale.r(d[stateMap.axSlct.r]);
                }
              },
              'fill':function(d){
                return stateMap.scale.c(d[stateMap.axSlct.c]);
              }
            });
    
    // bubbleのマウスオンで表の一番上にデータ詳細を表示するようにする
    stateMap.bubble
      .on('mouseover',function(s){
        if($('#axSlct-pIn').prop('checked')===true){
          var sTemp=[s];
          tableReset(sTemp,configMap.key.allType,'#table');
        }
      })
      .on('mouseout',function(){
        tableReset(data,configMap.key.allType,'#table');
      });
    
    // olsにチェックが入っていて、X軸もY軸も数値型の場合は近似直線を表示する
    stateMap.svg.selectAll('.ols').remove();
    if(
      stateMap.key.x==='num'&&
      stateMap.key.y==='num'&&
      $('#axSlct-xScale').val()==='linear' &&
      $('#axSlct-yScale').val()==='linear' &&
      $('#axSlct-oIn').prop('checked')===true
    ){
      //色に設定されている項目を一意にする
      stateMap.axSort.c = [];
      $.each(data,function(i,d) {
        stateMap.axSort.c.push(d[stateMap.axSlct.c]);
      });
      stateMap.axSort.c = unique(stateMap.axSort.c);
      // 色ごとにolsを引くための演算
      stateMap.regLine = 
        olsCalc(
          data,
          stateMap.axSort.c,
          stateMap.axSlct.x,
          stateMap.axSlct.y,
          stateMap.axSlct.c,
          configMap,
          stateMap.domain,
          stateMap.scale
        );
      // olsの描画
      stateMap.ols = 
        stateMap.svg.selectAll('.ols').data(stateMap.regLine).enter().append('line')
                .attr({
                  'x1':function(d){return stateMap.scale.x(d.minxy.x);},
                  'x2':function(d){return stateMap.scale.x(d.maxxy.x);},
                  'y1':function(d){return stateMap.scale.y(d.minxy.y);},
                  'y2':function(d){return stateMap.scale.y(d.maxxy.y);},
                  'stroke':function(d){return stateMap.scale.c(d.olsClr);},
                  'stroke-opacity':0.7,
                  'class':'ols'});
    }
    
    
    // 色の判例を表示する
    stateMap.svg.selectAll('.legend').remove();
    
    stateMap.legend = 
      stateMap.svg.selectAll('.legend').data(stateMap.color.domain()).enter().append('g')
                  .attr({'class':'legend'});
    
    stateMap.legend.append('rect')
            .attr({
              'x'      : configMap.svgSize.w - configMap.margin.right,
              'y'      : function(d,i){return (19*i);},
              'width'  : 18,
              'height' :18
            })
            .style({
              'fill':stateMap.color
            })
            .on('mouseover',function(s){
              stateMap.bubble.filter(function(d){return s === d[stateMap.axSlct.c];})
                      .attr({'fill-opacity':1});
              stateMap.bubble.filter(function(d){return s !== d[stateMap.axSlct.c];})
                      .attr({'fill-opacity':0.05,'stroke-width':0});
              if(
                stateMap.key.x==='num'&&
                stateMap.key.y==='num'&&
                $('#axSlct-oIn').prop('checked')===true
              ){
                stateMap.ols.filter(function(d){return s === d.olsClr;})
                        .attr({'stroke-opacity':1});
                stateMap.ols.filter(function(d){return s !== d.olsClr;})
                        .attr({'stroke-opacity':0.05});
              }
              var dTemp = [];
              for(var i = 0;i<data.length;i++){
                if(s===data[i][stateMap.axSlct.c]){
                  dTemp.push(data[i]);
                }
              }
              tableReset(dTemp,configMap.key.allType,'#table');
            })
            .on('mouseout',function(){
              stateMap.bubble.attr({'fill-opacity':0.7,'stroke-width':0.5});
              if(
                stateMap.key.x==='num'&&
                stateMap.key.y==='num'&&
                $('#axSlct-oIn').prop('checked')===true
              ){
                stateMap.ols.attr({'stroke-opacity':0.7});
              }
              tableReset(data,configMap.key.allType,'#table');
            });
    stateMap.legend.append('text')
            .attr({
              'x':configMap.svgSize.w - configMap.margin.right + 20,
              'y':function(d,i){return (19*i)+10;},
              'dy':'0.35em'
            })
            .text(function(d){return d;});
    
    
    callback();
  };
  
  initModule = function(){
    getData(makeScat);
    getStrct(makeScat);
    setFrame(makeScat);
  };
  return { initModule : initModule };
})();
