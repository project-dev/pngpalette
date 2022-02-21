var imgMap = {};
var imgIdx = 0;
var canvas;
var ctx;

// PNGファイルシグネチャ
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** ビット深度とカラータイプ */
const IMAGE_FORMAT = new Uint8Array([0x08, 0x03]);

/** PLTEシグネチャ のサイズ */
const PLTE_SIZE = new Uint8Array([0x00, 0x00, 0x03, 0x00]);

/** PLTEシグネチャ名 */
const PLTE_PNG_SIGNATURE = new Uint8Array([0x50, 0x4c, 0x54, 0x45]);

/** PLTEのサイズ */
const PLT_LENGTH = 0x0300;

/** ビット深度の位置 */
const BIT_DEPTH_POS = 24;

/** パレットデータの長さの位置 */
const PALETTE_DATA_LENGTH_POS = 33;

/** パレットのChunk Typeの位置 */
const PALETTE_CHUNK_TYPE_POS = 37;

/** パレットデータの位置 */
const PALETTE_DATA_POS = 41;

document.addEventListener('DOMContentLoaded', function() {
    console.log("start");
    console.log("load start");
    Promise.all([
        loadPng("test01", "./img/test.png"),
        loadPng("test02", "./img/testbig.png"), 
        loadPng("test03", "./img/ingresspc.png"),
    ]).then(result =>{
        console.log("Finish");
        console.log(result);
        document.getElementById('viewImageButton').disabled = false;
        viewImage();
    }).catch(reject =>{
        console.log(reject);
    });

    document.getElementById('viewImageButton').addEventListener('click', (e) => {
        console.log("click");
        let keys = Object.keys(imgMap);
        imgIdx++;
        if(keys.length <= imgIdx ){
            imgIdx = 0;
        }
        viewImage();
    });
    
    document.getElementById('dumpCanvasButton').addEventListener('click', (e) => {
        let canvas = document.getElementById('canvas');
        var data = canvas.toDataURL('image/png8');
        data = data.replace("data:image/png;base64,", "");
        console.log(data);
        var buff = atob(data);
        outBytewData("dump", buff);

    });
    
    window.requestAnimationFrame(animation);
    resize();
});

// アニメーション用のカウンタ
var anicnt = 0;
function animation(){
    try{
        let keys = Object.keys(imgMap);
        let image = imgMap[keys[imgIdx]].image;
        let buff = imgMap[keys[imgIdx]].buff;
        let palette = imgMap[keys[imgIdx]].palette;

        // パレットアニメーション用のパレット情報
        let animePlt = [
            new Uint8Array([
                0, 0, 225,
                72, 72, 225,
                103, 103, 225,
                162, 162, 225,
            ]),
            new Uint8Array([
                162, 162, 225,
                0, 0, 225,
                72, 72, 225,
                103, 103, 225,
            ]),
            new Uint8Array([
                103, 103, 225,
                162, 162, 225,
                0, 0, 225,
                72, 72, 225,
            ]),
            new Uint8Array([
                72, 72, 225,
                103, 103, 225,
                162, 162, 225,
                0, 0, 225,
            ]),
        ];

        let idx =  Math.floor(anicnt / 20);
        palette.set(animePlt[idx], 10 * 3 + 4);
        anicnt++;
        if(anicnt >= 20 * 4){
            anicnt = 0;
        }
        updatePalette(image, buff, palette);
    }catch(e){
        console.log(e);
    }
    window.requestAnimationFrame(animation);
}

window.addEventListener('resize', function() {
    resize();
});

function resize(){
    try{
        let canvas = document.getElementById('canvas');
        let poarentElement = canvas.parentElement;
        let width = poarentElement.clientWidth;
        let height = poarentElement.clientHeight;
        canvas.width = width;
        canvas.height = height;
//                    console.log("width : " + width);
//                    console.log("height : " + height);
        viewImage();
    }catch(e){
        console.log(e);
    }
}

/**
 * イメージ表示 
 */
function viewImage(){
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    let keys = Object.keys(imgMap);
    //console.log(imgIdx + " : " + keys[imgIdx]);

    let img = imgMap[keys[imgIdx]].image;
    ctx.drawImage(img, 0, 0, img.width * 4, img.height * 4);
}

/**
 * パレットの更新
 * @param image Imageオブジェクト
 * @param buff 画像データ配列
 * @param palette パレットのChunk TypeとChunk Data
 */
async function updatePalette(image, buff, palette){
    // CRC32を計算
    let crc = calcCRC32(palette);

    // バッファにパレットを適用
    buff.set(palette, PALETTE_CHUNK_TYPE_POS);
    //CRC32を適用
    buff.set(crc, PALETTE_DATA_POS + PLT_LENGTH);

    // バッファをバイナリ文字列に変換
    let binStr = Array.from(buff, e => String.fromCharCode(e)).join("");

    // dataURLの生成
    let dataUrl = "data:image/png;base64,"+btoa(binStr);

    // Promiseでやる必要性があるかどうかはわからないけど
    // 試したいことがあったのでこんなことしてる。
    let imgPromise = new Promise((resolve, reject) =>{
        image.onload = () => {
            resolve();
        }
        /*
        // 遅延ローディングはしない(意味はあまりない)
        image.loading = 'eager';
        // 同期的な読み込み(意味はあまりない)
        image.decoding = 'sync';
        */
        image.src = dataUrl;
    }).then(() => {
        viewImage();
    });
}

/**
 * パレットのみ読み込み
 * いまは使わない
 */ 
async function loadPalette(name, url){
    return loadPng(name, url, true);
}

/**
 * 画像の読み込み
 * @param name キー名称
 * @param url 対象URL
 */
async function loadImage(name, url){
    return loadPng(name, url, false);
}

/**
 * PNGの読み込み
 * @param name キー名称
 * @param url 対象URL
 * @param isPaletteOnly パレットのみ読み込み
 */
async function loadPng(name, url, isPaletteOnly){
    console.log("[" + url + "] : request");
    let response = await fetch(url);
    if(response.ok){
        let data = await response.arrayBuffer();
        var buff = new Uint8Array(data);

        outBytewData(url, buff);

        //PNGの参考資料
        //https://www.setsuki.com/hsp/ext/png.htm
        // PNGファイルシグネチャ           8byte 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
        // IHDRチャンク                   25byte 
        //    長さ                         4byte 0x00 0x00 0x00 0x0D
        //    Chunk Type                   4byte 0x49 0x48 0x44 0x52 (IHDR)
        //    Chunk Data 画像の幅          4byte
        //    Chunk Data 画像の高さ        4byte
        //    Chunk Data ビット深度        1byte  1,2,4,8,16 今回は8かな？
        //    Chunk Data カラータイプ      1byte  1:パレット 2:カラー 4:アルファチャンネル  今回は3以外は非対応
        //    Chunk Data 圧縮方法          1byte
        //    Chunk Data フィルター手法    1byte
        //    Chunk Data インターレス手法  1byte
        //    CRC                          4byte Chunk TypeとChukd Dataを元に計算
        // パレットチャンク ※パレットアニメーションはここを書き換える
        //    長さ                         4byte
        //    Chunk Type                   4byte 0x50 0x4c 0x54 0x45 (PLTE)
        //    CHunk Data パレット1 R       1byte 赤 0-255
        //    CHunk Data パレット1 G       1byte 緑 0-255
        //    CHunk Data パレット1 B       1byte 青 0-255
        //    ・・・略・・・
        //    CRC                          4byte Chunk TypeとChukd Dataを元に計算

        // PNGファイルシグネチャの確認
        let chkData = buff.slice(0, 8);
        if(JSON.stringify(PNG_SIGNATURE) != JSON.stringify(chkData)){
            console.log("[" + url + "] : not png");
            return;
        }

        // ビット深度（25Byte目)とカラータイプ(26Byte目)をチェックする
        // ビット深度 が 8 なら 256
        // カラータイプが 3 ならパレット持ってると判断
        let fmtData = buff.slice(BIT_DEPTH_POS, BIT_DEPTH_POS + 2);
        if(JSON.stringify(IMAGE_FORMAT) != JSON.stringify(fmtData)){
            console.log("[" + url + "] : not support format");
            return;
        }

        // パレットデータ取得
        // 長さ取得
        let lenData = buff.slice(PALETTE_DATA_LENGTH_POS, PALETTE_DATA_LENGTH_POS + 4);
        if(JSON.stringify(PLTE_SIZE) != JSON.stringify(lenData)){
            console.log("[" + url + "] : Palette size faild");
            return;
        }

        // Chunk Type
        let chunkTypePLT = buff.slice(PALETTE_CHUNK_TYPE_POS, PALETTE_CHUNK_TYPE_POS + 4);
        if(JSON.stringify(PLTE_PNG_SIGNATURE) != JSON.stringify(chunkTypePLT)){
            console.log("[" + url + "] : Palette data not found");
            return;
        }

        // パレットデータの取得
        var paletdata = buff.slice(PALETTE_CHUNK_TYPE_POS, PALETTE_CHUNK_TYPE_POS + 4 + PLT_LENGTH);
        outBytewData(url, paletdata);

        // CRCを取得
        var crcdata = buff.slice(PALETTE_DATA_POS + PLT_LENGTH, PALETTE_DATA_POS + PLT_LENGTH + 4);
        outBytewData(url, crcdata);

        if(isPaletteOnly){
            // パレットの保存
            imgMap[name] = {
                "palette" : paletdata
            };
        }else{
            // 画像を読み込んで保存
            // PNG形式のUint8ArrayをDataURIに変換する場合、BinalyStringにしてからBase64に変換する必要がある
            // btoaの引数にBinalyStringを指定すると、Base64になる
            // http://var.blog.jp/archives/62330155.html
            let binStr = Array.from(buff, e => String.fromCharCode(e)).join("");
            let dataUrl = "data:image/png;base64,"+btoa(binStr);
            let img = new Image();
            img.src = dataUrl;
            // 読み込んだイメージを保存する
            // dataURIで保存すべきかちょっと悩ましい
            imgMap[name] = {
                "buff":buff,
                "image" : img,
                "palette" : paletdata
            };
        }
        console.log("[" + url + "] : load end");
    }else{
        console.log("[" + url + "] : load faild");
    }
}

/**
 * 引数のUint8ArrayのCRC32を求める
 */
function calcCRC32(buff){
    let crcTarget = Array.from(buff, e => String.fromCharCode(e)).join("");
        var crc = CRC32.bstr(crcTarget) >>> 0;
        var crcBuff = [
            (crc & 0xff000000) >>> (8 * 3),
            (crc & 0x00ff0000) >>> (8 * 2),
            (crc & 0x0000ff00) >>> (8 * 1),
            (crc & 0x000000ff)
        ];
    return new Uint8Array(crcBuff);
}

/**
 * 引数の配列を16進数でコンソールに出力
 */
function outBytewData(url, buff){
    var bytedata = "";
    for(var i = 0; i < buff.byteLength; i++){
        bytedata = bytedata + ("00" + buff[i].toString(16)).slice(-2) + " ";
        if(0 == (i + 1) % 8){
            bytedata = bytedata + "\n";
        }else if(0 == (i + 1) % 4){
            bytedata = bytedata + " ";
        }
    }
    // デバッグ用
    console.log("[" + url + "] : DATA\n" + bytedata);
}