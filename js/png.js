/**
 * require
 * crc32.js https://cdnjs.cloudflare.com/ajax/libs/crc-32/1.2.1/crc32.min.js
 * pako.js  https://github.com/nodeca/pako
 */

// PNGファイルシグネチャ
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** 
 * PLTEのサイズ 
 * 非推奨：使わないように修正予定
 */
const PLT_LENGTH = 0x0300;

/** 
 * パレットのChunk Typeの位置 
 * 非推奨：使わないように修正予定
 */
const PALETTE_CHUNK_TYPE_POS = 37;

/** 
 * パレットデータの位置 
 * 非推奨：使わないように修正予定
 */
const PALETTE_DATA_POS = 41;

/**
 * PNGのフォーマットは以下を参考にした
 * https://www.setsuki.com/hsp/ext/png.htm
 * @param {String} url 
 * @returns imgData
 */
 async function loadPng(url){
    let response = await fetch(url);
    let imgData = null;
    if(response.ok){
        try{
            let data = await response.arrayBuffer();
            let buff = new Uint8Array(data);
            //outBytewData(url, buff);
    
    
            // PNGファイルシグネチャの確認
            // PNGファイルシグネチャ           8byte 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
            let chkData = buff.slice(0, 8);
            if(JSON.stringify(PNG_SIGNATURE) != JSON.stringify(chkData)){
                console.log("[" + url + "] : not png");
                return;
            }

            // URLからファイル名の拡張子を覗いたものを取得
            const fileName = url.split('/').pop();
            const baseName = fileName.replace(/\.[^/.]+$/, '');                            

            imgData = {
                "url":url,
                "name":baseName,
            };
    
            // チャンクの構造
            // length 4byte
            // Chunk Type 4byte
            // ChundData length - 4byte
            // CRC32 4byte
            let bytePos = 8;
            while(buff.length > bytePos){
    
                // 長さはチャンクデータのサイズ
                //console.log(bytePos + "-" + (bytePos + 4));
                let len = buffToNum(buff.slice(bytePos, bytePos + 4), 4);
                bytePos += 4;
                //console.log("Length  : " + len);
    
                // Chunk Type + Chunk Data
                //console.log("-- Chunk Type / Chunk Data ----");
                //console.log(bytePos + "-" + (bytePos + len + 4));
                let dataBuff = buff.slice(bytePos, bytePos + len + 4);
                bytePos += len + 4;
    
                if((dataBuff.byteLength - 4)!= len){
                    console.log("Invalid Size");
                    throw "Invalid Size";
                }
    
                // ChunkTypeを取得する
                let buffChunkType = dataBuff.slice(0, 4);
                //outBytewData(url, buffChunkType);
                //let chunkType = String.fromCharCode(buffChunkType);
                let chunkType = String.fromCharCode(buffChunkType[0], buffChunkType[1], buffChunkType[2], buffChunkType[3]);
    
                // crc32
                //console.log(bytePos + "-" + (bytePos + 4));
                let crc32Buff = buff.slice(bytePos, bytePos + 4);
                let crc32 = calcCRC32(dataBuff);
                bytePos += 4;
    
                if(JSON.stringify(crc32) != JSON.stringify(crc32Buff)){
                    console.log("[" + url + "] : " + chunkType + " : Invalid CRC32");
                    outBytewData(url, crc32Buff);
                    outBytewData(url, crc32);
                    throw "[" + url + "] : " + chunkType + " : Invalid CRC32";
                }

                try{
                    anProcMap[chunkType](chunkType, dataBuff.slice(4), len, imgData);
                }catch(e){
                    console.error("[" + url + "] : chunkType : " + chunkType);
                    console.log("[" + url + "] : len       : " + dataBuff.byteLength + " / " + len);
                    console.log("width    : " + imgData.ihdr.width);
                    console.log("height   : " + imgData.ihdr.height);
                    console.log("deps     : " + imgData.ihdr.deps);
                    console.log("Color    : " + imgData.ihdr.color);
                    console.log("Compress : " + imgData.ihdr.compress);
                    console.log("Filter   : " + imgData.ihdr.filter);
                    console.log("Interlace: " + imgData.ihdr.interlace);
                    console.log(e);
                    throw e;
                }
            }

            // 各種メソッド追加
    
            // 現在のデータでbuffの内容を更新する
            imgData.updateBuffer = () => {
                let newBuff = new Uint8Array();
                // PNG ファイルシグネチャ
                //newBuff.
                // IHDR チャンク
                // PLTE チャンク
                // IDAT チャンク
                // tRNS チャンク
                // gAMA チャンク
                // cHRM チャンク
                // sRGB チャンク
                // iCCP チャンク
                // tEXt チャンク
                // zTXt チャンク
                // iTXt チャンク
                // bKGD チャンク
                // pHYs チャンク
                // sBIT チャンク
                // sPLT チャンク
                // hIST チャンク
                // tIME チャンク
                // IEND チャンク
            };
    
            /*
            // Data Urlの作成
            imgData.createDataURL = () => {
                // バッファをバイナリ文字列に変換
                let binStr = Array.from(this.buff, e => String.fromCharCode(e)).join("");
                // dataURLの生成
                let dataUrl = "data:image/png;base64,"+btoa(binStr);
            };
            */
        }catch(e){
            imgData = undefined;
            console.log("[" + url + "] : load faild");
            console.error("[" + url + "] : " + e);
        }

    //console.log("[" + url + "] : load end");
    }else{
        console.log("[" + url + "] : load faild");
    }
    //console.log("loaded : " + JSON.stringify(imgData));
    return imgData;
}

let anProcMap = {
    "IHDR":function(chunkType, buff, len, imgData){
        //イメージヘッダ
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
        let pos = 0;
        let width = buffToNum(buff.slice(pos, pos + 4), 4);        
        pos += 4;

        let height = buffToNum(buff.slice(pos, pos + 4), 4);        
        pos += 4;

        let depsBuff = buff.slice(pos, pos + 1);        
        pos += 1;

        let colorTypeBuff = buff.slice(pos, pos + 1);        
        pos += 1;

        let compTypeBuff = buff.slice(pos, pos + 1);        
        pos += 1;

        let filterBuff = buff.slice(pos, pos + 1);        
        pos += 1;

        let interlaceBuff = buff.slice(pos, pos + 1);        
        pos += 1;

        imgData.ihdr = {
            "width":width,
            "height":height,
            "deps":depsBuff[0],
            "color":colorTypeBuff[0],
            "compress":compTypeBuff[0],
            "filter":filterBuff[0],
            "interlace":interlaceBuff[0],
        };
    },
    "PLTE":function(chunkType, buff, len, imgData){
        //パレット
        imgData.plte = buff;
    },
    "IDAT":function(chunkType, buff, len, imgData){
        //イメージデータ
        if(imgData.ihdr.compress == 0){
            /*
            // zlib形式
            let inflate = new Zlib.Inflate(buff);
            let plain = inflate.decompress();
            */
            imgData.idat = pako.inflate(buff);
        }else{
            // サポートしていない            
            throw new Exception("unsupport compress type = " + imgData.ihdr.compress);
        }

    },
    "tRNS":function(chunkType, buff, len, imgData){
        //透明度
        /*
        switch(colorType){
            case 0:
                // グレースケール
                break;
            case 2:
                // True Color
                break;
            case 3:
                // インデックスカラー
                break;
        }
        */
        imgData.trns = buff;
    },
    "gAMA":function(chunkType, buff, len, imgData){
        //イメージガンマ
        console.warn("!!" + chunkType +" no test!!");
        let pos = 0;
        imgData.gAMA = buffToNum(buff.slice(pos, pos+4), 4);
    },
    "cHRM":function(chunkType, buff, len, imgData){
        //基礎色度
        console.warn("!!" + chunkType +" no test!!");
        imgData.cHRM = {
            "whiteX":buffToNum(buff.slice(0, 4), 4),
            "whiteY":buffToNum(buff.slice(4, 8), 4),
            "rX":buffToNum(buff.slice(8, 12), 4),
            "rY":buffToNum(buff.slice(12, 16), 4),
            "gX":buffToNum(buff.slice(16, 20), 4),
            "gY":buffToNum(buff.slice(20, 24), 4),
            "bX":buffToNum(buff.slice(24, 28), 4),
            "bY":buffToNum(buff.slice(28, 32), 4),
        };
    },
    "sRGB":function(chunkType, buff, len, imgData){
        // 標準 RGB カラースペース
        console.warn("!!" + chunkType +" no test!!");
        imgData.sRGB = buff[0];
    },
    "iCCP":function(chunkType, buff, len, imgData){
        // 組み込み ICC プロフィール
        console.warn("!!" + chunkType +" no test!!");
        imgData.iCCP.compress = buff[1];
        imgData.iCCP.compress_info = "";
        for(let i = 2; i < len; i++){
            imgData.iCCP.compress_info += String.fromCharCode(buff[i]);
        }
    },
    "tEXt":function(chunkType, buff, len, imgData){
        // テキストデータ
        console.warn("!!" + chunkType +" no test!!");
        imgData.tEXt = "";
        for(let i = 2; i < len; i++){
            imgData.tEXt.compress_info += String.fromCharCode(buff[i]);
        }
    },
    "zTXt":function(chunkType, buff, len, imgData){
        // 圧縮されたテキストデータ
        console.warn("!!" + chunkType +" unimplemented!!");
        //圧縮されたテキストデータ
        imgData.zEXt.compress = buff[1];
        switch(imgData.zEXt.compress){
            case 0:
                // deflateアルゴリズム
                break;
            default:
                // inflateある囲碁リズム
                break;
        }
        //imgData.zEXT.data = buff;
    },
    "iTXt":function(chunkType, buff, len, imgData){
        // 国際的なテキストデータ
        console.warn("!!" + chunkType +" unimplemented!!");
        //圧縮されて居おるかどうか
        //0:無圧縮
        //1:圧縮済み
        imgData.iEXt.compressflag = buff[1];
        //圧縮形式
        imgData.iEXt.compress = buff[2];

        if(0 == imgData.iEXt.compressflag){

        }else{
            switch(imgData.iEXt.compress){
                case 0:
                    // deflateアルゴリズム
                    break;
                default:
                    // inflateある囲碁リズム
                    break;
            }
        }

        //言語タグ。終端文字は0(bit)

        //翻訳キーワード。終端文字は0(bit)

        //テキスト文字列

        //imgData.iEXT.data = buff;
    },
    "bKGD":function(chunkType, buff, len, imgData){
        // 背景色
        console.warn("!!" + chunkType +" no test!!");
        switch(colorType){
            case 0:
            case 4:
                // グレースケール
                imgData.bKGD = buff.slice(1,3);
                break;
            case 2:
            case 6:
                // True Color
                imgData.bKGD = buff.slice(1,4);
                break;
            case 3:
                // インデックスカラー
                imgData.bKGD = buff[4];
                break;
        }
    },
    "pHYs":function(chunkType, buff, len, imgData){
        // 物理的なピクセル寸法
        console.warn("!!" + chunkType +" no test!!");
        try{
            imgData.pHYs.xpix = buffToNum(buff.slice(1,5), 4);
            imgData.pHYs.ypix = buffToNum(buff.slice(5,9), 4);
            imgData.pHYs.unit = buff[13];
        }catch(e){
            console.error("error : " + e);
        }
    },
    "sBIT":function(chunkType, buff, len, imgData){
        // 有効なビット
        console.warn("!!" + chunkType +" no test!!");
        try{
            switch(colorType){
                case 0:
                    // グレースケール
                    imgData.sBIT.gray = buff[1];
                    break;
                case 2:
                case 6:
                    // True Color
                    imgData.sBIT.r = buff[1];
                    imgData.sBIT.g = buff[2];
                    imgData.sBIT.b = buff[3];
                    break;
                case 3:
                    // インデックスカラー
                    imgData.sBIT.r = buff[1];
                    imgData.sBIT.g = buff[2];
                    imgData.sBIT.b = buff[3];
                    break;
                case 4:
                    // グレイスケール＋アルファ
                    imgData.sBIT.gray = buff[1];
                    imgData.sBIT.trans = buff[2];
                    break;
                case 6:
                    //トゥルーカラー＋アルファ
                    imgData.sBIT.r = buff[1];
                    imgData.sBIT.g = buff[2];
                    imgData.sBIT.b = buff[3];
                    imgData.sBIT.trans = buff[4];
                    break;
            }

        }catch(e){
            console.error("error : " + e);
        }
    },
    "sPLT":function(chunkType, buff, len, imgData){
        // 推奨パレット
        console.warn("!!" + chunkType +" unimplemented!!");
        // サンプル精度
        imgData.sPLT.accuracy = buff[2];

        // ここからの処理は要調査
    },
    "hIST":function(chunkType, buff, len, imgData){
        // パレットヒストグラム
        console.warn("!!" + chunkType +" unimplemented!!");
        // ここからの処理は要調査
        //imgData.hIST;
    },
    "tIME":function(chunkType, buff, len, imgData){
        // イメージの最終更新時間
        console.warn("!!" + chunkType +" no test!!");
        imgData.tIME.year = buffToNum(buff.slice(1,3), 2);
        imgData.tIME.month = buff[3];
        imgData.tIME.day   = buff[4];
        imgData.tIME.hour  = buff[5];
        imgData.tIME.minute = buff[6];
        imgData.tIME.second = buff[7];
    },
    "fRAc":function(chunkType, buff, len, imgData){
        // フラクタル・イメージ・パラメータ
        console.warn("!!" + chunkType +" unimplemented!!");
    },
    "gIFg":function(chunkType, buff, len, imgData){
        // GIFグラフィック制御拡張
        console.warn("!!" + chunkType +" unimplemented!!");
    },
    "gIFt":function(chunkType, buff, len, imgData){
        // GIFプレーン・テキスト拡張
        console.warn("!!" + chunkType +" unimplemented!!");
    },
    "gIFx":function(chunkType, buff, len, imgData){
        // GIF応用拡張
        console.warn("!!" + chunkType +" unimplemented!!");
    },
    "oFFs":function(chunkType, buff, len, imgData){
        // イメージ・オフセット
        console.warn("!!" + chunkType +" unimplemented!!");
    },
    "pCAL":function(chunkType, buff, len, imgData){
        // 画素値の較正
        console.warn("!!" + chunkType +" unimplemented!!");
    },
    "sCAL":function(chunkType, buff, len, imgData){
        // イメージの物理寸法
        console.warn("!!" + chunkType +" unimplemented!!");
    },
    "IEND":function(chunkType, buff, len, imgData){
        // イメージ終端
    }
};

/**
 * 
 * @param {*} buff 
 * @returns 
 */
//function buffToNum(buff){
//    if((buff.byteLength) != 4){
//        return;
//    }
//    return (0xff000000 & buff[0] << (8 * 3)) +
//           (0x00ff0000 & buff[1] << (8 * 2)) +
//           (0x0000ff00 & buff[2] << (8 * 1)) +
//           (0x000000ff & buff[3]);
//}

/**
 * 
 * @param {*} buff 
 * @param {*} digit 
 * @returns 
 */
 function buffToNum(buff, digit){
    if((buff.byteLength) < digit){
        return;
    }
    let ret = 0;
    for(let i = 0; i < digit; i++){
        let maskVal = (0x000000ff << ((digit - 1) - i) * 8) >>> 0;
        ret = ret + (maskVal & buff[i] << ((digit - 1) - i) * 8);
    }
    return ret;
}

/**
 * 引数のUint8ArrayのCRC32を求める
 */
 function calcCRC32(buff){
    let crcTarget = Array.from(buff, e => String.fromCharCode(e)).join("");
        let crc = CRC32.bstr(crcTarget) >>> 0;
        let crcBuff = [
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
    let bytedata = "";
    for(let i = 0; i < buff.byteLength; i++){
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