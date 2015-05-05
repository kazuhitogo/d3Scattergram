<?php
    $env = 'develop';

    switch($env){
    case 'production':
        break;
    case 'develop':
        # 開発環境用
        define('DB_USERNAME','root');
        define('DB_PASSWORD','');
        define('DB_HOST','localhost:3306');
        define('DATABASE','stock');
        define('TABLE_NAME','STOCK.LOVE_HOTEL_LOG2');
        break;
    }
?>
