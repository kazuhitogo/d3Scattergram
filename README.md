# mysqlのテーブルを散布図で表現する(making scattergram from mysql with d3.js/php/browser)
d3.js/php/ブラウザを用いて、mysqlに格納されているテーブルのデータを、散布図で可視化する。

## 使い方(How to use)
1. phpが使えて、mysqlに接続できるwebサーバを用意する(require php, mysql, Web Server)

1. api/config.phpを設定する(configure api/config.php)
 * DB_USERNAME -> mysql username
 * DB_PASSWORD -> mysql username password
 * DB_HOST     -> IP/host:port
 * DATABASE    -> DB NAME
 * TABLE_NAME  -> TABLE NAME

1. scat.init.jsのd3.json部分をjsonファイルではなくphpファイル呼び出しにする(scat.init.js fix json -> php)
 * 113行目をコメントアウト、114行目のコメントアウト解除(line 113 -> comment,line 114 -> uncomment)
 * 127行目をコメントアウト、128行目のコメントアウト解除(line 127 -> comment,line 128 -> uncomment)

1. ファイル郡をWebサーバに配置する(put files on Web Server)

1. ブラウザでscat.htmlにアクセスする(access scat.html)

## 対応するmysqlのカラム型(can use column type)
* X軸(x axis)
  * double
  * float
  * int
  * bigint
  * decimal
  * date
  * timestamp
  * varchar
  * char

* Y軸(y axis)
  * double
  * float
  * int
  * bigint
  * decimal
  * date
  * timestamp
  * varchar
  * char

* 色(color)
  * varchar
  * char

* バブルサイズ(bubble size)
  * double
  * float
  * int
  * bigint
  * decimal
   
## インタラクション(interaction)
* プルダウンとボタン(pull down and button)
  * X軸、Y軸、色、バブルサイズを選んで、draw nowボタンを押すと散布図を描画してくれる
* 判例にマウスオーバー(mouseover on regend)
  * 該当するものだけ散布図で強調表示と、シートで該当するものだけを表示
* バブルにマウスオーバー(mouseover on mouseover)
  * 該当するデータだけをシートに表示

## バグを見つけたら(if find a bug)
直してください。(please fix)

