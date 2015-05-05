<?php
  // data.php
  // mysqlからデータを取得し、
  // 結果をjson形式で返すデータ取得API
  // 接続するmysqlはconfig.phpにて設定

  // mysqlの接続先を設定
  require_once('config.php');
  $username = DB_USERNAME;
  $password = DB_PASSWORD;
  $host = DB_HOST;
  $database=DATABASE;
  $table_name=TABLE_NAME;

  // mysqlに接続する
  $mysqli = new mysqli( $host , $username , $password , $database );
	if ($mysqli->connect_errno){
	   echo "Failed to connect to MySQL: " . $mysqli->connect_error;
     exit;
  }

  // クエリを作成
  $mysqli->set_charset("utf8"); // 文字化け防止
  $myquery = "SELECT * FROM "; //クエリ作成1
  $myquery .= $table_name . " "; //クエリ作成2

  // クエリの実行と結果の格納
  $data = array();
  if ($result = $mysqli->query($myquery)) {
    while ($row = $result->fetch_assoc()) {
      array_push($data,$row);
    }
    // 結果セットを開放
    $result->close();
  }

  // 呼び出し元に結果を返す
  header('Content-type:application/json; charset=UTF-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
	$mysqli->close();
?>
