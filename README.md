# PetalWindow  
### 概要  
ホスト側のウィンドウ画像をリモート側のブラウザで表示するシステム  
ホスト : 晒す側  
リモート : 観る側  

### 起動方法  
#### ホスト側
electronでシステムを起動
```  
npm install
./node_modules/.bin/electron .
```  
#### リモート側  
- ブラウザで指定されたURL（PCのIPアドレス53000番ポート/remote/index）にアクセス  
初期はhttp://localhost:50000/remote/index
- 観たいウィンドウをクリック
- ウィンドウキャプチャ動画を観る

### 設定  
URLを変更する（初期はhttp://localhost:53000）  
- /client/module/js/RDSetting.js  
- /main.js

SKYWAY APIの変更  
- /client/module/js/RDSetting.js  
自分で利用するサイトのドメインでSKYWAY APIを取得する  
記述してるAPIはlocalhostのみ利用可能  
