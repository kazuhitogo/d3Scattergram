/*
 * d3Scat.js
 * 散布図描画javascript(親ファイル)
*/

/* jslint         browser  : true, continue : true,
   devel  : true, indent   : 2,    maxerr   : 50,
   newcap : true, nomen    : true, plusplus : true,
   regexp : true, sloppy   : true, vars     : false,
   white  : true, laxbreak : true
*/
/* global $, scat: true */

var scat = (function () {
  var initModule = function () {
    scat.init.initModule();
  };
  return { initModule: initModule };
})();
