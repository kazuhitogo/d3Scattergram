<?php
    //configファイル読み込み
    require_once('config.php');
    $username = DB_USERNAME; 
    $password = DB_PASSWORD;
    $host = DB_HOST;
    $database=DATABASE;
    $table_name=TABLE_NAME;
    $mysqli = new mysqli( $host , $username , $password , $database );
	if ($mysqli->connect_errno){
	    echo "Failed to connect to MySQL: " . $mysqli->connect_error;
        exit;
    }
	$mysqli->set_charset("utf8"); // 文字化け防止
    $myquery = 
    "SHOW COLUMNS FROM ";
    $myquery .= $table_name;
    $data = array();
    if ($result = $mysqli->query($myquery)) {
        while ($row = $result->fetch_assoc()) {
            array_push($data,$row);
        }
        /* 結果セットを開放します */
        $result->close();
    }

    header('Content-type:application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
	$mysqli->close();

?>