var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
//@ts-ignore
//import { inflate } from '../node_modules/zlib.es/dist/browser/zlib.min.js';
import { inflate } from '../node_modules/zlib.es/dist/esm/zlib.js';
import { buffToNum, calcCRC32, outBytewData } from "./pngutil.js";
/**
 * npm install crc-32
 * npm install zlib
 * npm i --save-dev @types/node
 * npm i -D webpack webpack-cli
 *
 */
export class PNG {
    /**
     *
     */
    constructor() {
        this.buff = undefined;
        this.PNGData = {
            IHDR: undefined,
            PLTE: undefined,
            IDAT: undefined,
            tRNS: undefined,
            gAMA: undefined,
            cHRM: undefined,
            sRGB: undefined,
            iCCP: undefined,
            tEXt: undefined,
            zTXt: undefined,
            iTXt: undefined,
            bKGD: undefined,
            pHYs: undefined,
            sBIT: undefined,
            sPLT: undefined,
            hIST: undefined,
            tIME: undefined,
            fRAc: undefined,
            gIFg: undefined,
            gIFt: undefined,
            gIFx: undefined,
            oFFs: undefined,
            pCAL: undefined,
            sCAL: undefined
        };
    }
    /**
     * PNGを読み込みます
     * @param url 読み込むPNGファイルのURL
     */
    static load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let png = new PNG();
            let data = yield fetch(url.toString());
            let buffBase = yield data.arrayBuffer();
            png.buff = new Uint8Array(buffBase);
            // PNGファイルシグネチャの確認
            // PNGファイルシグネチャ           8byte 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
            let chkData = png.buff.slice(0, 8);
            if (JSON.stringify(PNG.PNG_SIGNATURE) != JSON.stringify(chkData)) {
                console.log("[" + url + "] : not png");
                throw url + " is not PNG format.";
            }
            var bytePos = 8;
            while (png.buff.length > bytePos) {
                // 長さはチャンクデータのサイズ
                let len = buffToNum(png.buff.slice(bytePos, bytePos + 4), 4);
                bytePos += 4;
                // Chunk Type + Chunk Data
                let dataBuff = png.buff.slice(bytePos, bytePos + len + 4);
                bytePos += len + 4;
                if ((dataBuff.byteLength - 4) != len) {
                    throw "Invalid Size";
                }
                // ChunkTypeを取得する
                let buffChunkType = dataBuff.slice(0, 4);
                let chunkType = String.fromCharCode(buffChunkType[0], buffChunkType[1], buffChunkType[2], buffChunkType[3]);
                // crc32
                let crc32Buff = png.buff.slice(bytePos, bytePos + 4);
                let crc32 = calcCRC32(dataBuff);
                bytePos += 4;
                if (JSON.stringify(crc32) != JSON.stringify(crc32Buff)) {
                    console.log("[" + url + "] : " + chunkType + " : Invalid CRC32");
                    outBytewData(url, crc32Buff);
                    outBytewData(url, crc32);
                    throw "[" + url + "] : " + chunkType + " : Invalid CRC32";
                }
                // ChunkTypeをのぞいたバッファを渡す
                PNG.anProcMap[chunkType](chunkType, dataBuff.slice(4), len, png);
            }
            return png;
        });
    }
}
/**
 * PNGファイルシグネチャ
 */
PNG.PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/**
 * PLTEのサイズ
 * 非推奨：使わないように修正予定
 */
PNG.PLT_LENGTH = 0x0300;
/**
 * パレットのChunk Typeの位置
 * 非推奨：使わないように修正予定
 */
PNG.PALETTE_CHUNK_TYPE_POS = 37;
/**
 * パレットデータの位置
 * 非推奨：使わないように修正予定
 */
PNG.PALETTE_DATA_POS = 41;
PNG.anProcMap = {
    "IHDR": function (chunkType, buff, len, imgData) {
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
        var pos = 0;
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
        imgData.PNGData.IHDR = {
            "width": width,
            "height": height,
            "deps": depsBuff[0],
            "color": colorTypeBuff[0],
            "compress": compTypeBuff[0],
            "filter": filterBuff[0],
            "interlace": interlaceBuff[0],
        };
    },
    "PLTE": function (chunkType, buff, len, imgData) {
        //パレット
        imgData.PNGData.PLTE = buff;
    },
    "IDAT": function (chunkType, buff, len, imgData) {
        //イメージデータ
        //var plain = deflate(buff);
        var plain = inflate(buff);
        imgData.PNGData.IDAT = plain;
    },
    "tRNS": function (chunkType, buff, len, imgData) {
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
        imgData.PNGData.tRNS = buff;
    },
    "gAMA": function (chunkType, buff, len, imgData) {
        //イメージガンマ
        console.warn("!!" + chunkType + " no test!!");
        let pos = 0;
        imgData.PNGData.gAMA = buffToNum(buff.slice(pos, pos + 4), 4);
    },
    "cHRM": function (chunkType, buff, len, imgData) {
        //基礎色度
        console.warn("!!" + chunkType + " no test!!");
        imgData.PNGData.cHRM = {
            "whiteX": buffToNum(buff.slice(0, 4), 4),
            "whiteY": buffToNum(buff.slice(4, 8), 4),
            "rX": buffToNum(buff.slice(8, 12), 4),
            "rY": buffToNum(buff.slice(12, 16), 4),
            "gX": buffToNum(buff.slice(16, 20), 4),
            "gY": buffToNum(buff.slice(20, 24), 4),
            "bX": buffToNum(buff.slice(24, 28), 4),
            "bY": buffToNum(buff.slice(28, 32), 4),
        };
    },
    "sRGB": function (chunkType, buff, len, imgData) {
        // 標準 RGB カラースペース
        console.warn("!!" + chunkType + " no test!!");
        imgData.PNGData.sRGB = buff[0];
    },
    "iCCP": function (chunkType, buff, len, imgData) {
        // 組み込み ICC プロフィール
        console.warn("!!" + chunkType + " no test!!");
        var info = "";
        for (var i = 2; i < len; i++) {
            info += String.fromCharCode(buff[i]);
        }
        imgData.PNGData.iCCP = {
            "compress": buff[1],
            "compress_info": info
        };
    },
    "tEXt": function (chunkType, buff, len, imgData) {
        // テキストデータ
        console.warn("!!" + chunkType + " no test!!");
        var info = "";
        for (var i = 2; i < len; i++) {
            info += String.fromCharCode(buff[i]);
        }
        imgData.PNGData.tEXt = {
            "text": "",
            "compress_info": info
        };
    },
    "zTXt": function (chunkType, buff, len, imgData) {
        // 圧縮されたテキストデータ
        console.warn("!!" + chunkType + " unimplemented!!");
        imgData.PNGData.zTXt = {
            "compress": buff[1]
        };
        //圧縮されたテキストデータ
        switch (imgData.PNGData.zTXt ? ["compress"][0] : 0) {
            case 0:
                // deflateアルゴリズム
                break;
            default:
                // inflateある囲碁リズム
                break;
        }
    },
    "iTXt": function (chunkType, buff, len, imgData) {
        // 国際的なテキストデータ
        console.warn("!!" + chunkType + " unimplemented!!");
        var iTxt = {
            //圧縮されて居おるかどうか
            //0:無圧縮
            //1:圧縮済み
            "compressflag": buff[1],
            //圧縮形式
            "compress": buff[2]
        };
        if (0 == imgData.PNGData.iTXt["compressflag"]) {
        }
        else {
            switch (imgData.PNGData.iTXt["compress"]) {
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
    "bKGD": function (chunkType, buff, len, imgData) {
        var colorType = imgData.PNGData.IHDR["color"];
        // 背景色
        console.warn("!!" + chunkType + " no test!!");
        switch (colorType) {
            case 0:
            case 4:
                // グレースケール
                imgData.PNGData.bKGD = buff.slice(1, 3);
                break;
            case 2:
            case 6:
                // True Color
                imgData.PNGData.bKGD = buff.slice(1, 4);
                break;
            case 3:
                // インデックスカラー
                imgData.PNGData.bKGD = buff[4];
                break;
        }
    },
    "pHYs": function (chunkType, buff, len, imgData) {
        // 物理的なピクセル寸法
        console.warn("!!" + chunkType + " no test!!");
        try {
            imgData.PNGData.pHYs = {
                "xpix": buffToNum(buff.slice(1, 5), 4),
                "ypix": buffToNum(buff.slice(5, 9), 4),
                "unit": buff[13]
            };
        }
        catch (e) {
            console.error("error : " + e);
        }
    },
    "sBIT": function (chunkType, buff, len, imgData) {
        // 有効なビット
        console.warn("!!" + chunkType + " no test!!");
        var colorType = imgData.PNGData.IHDR["color"];
        try {
            switch (colorType) {
                case 0:
                    // グレースケール
                    imgData.PNGData.sBIT = {
                        "gray": buff[1]
                    };
                    break;
                case 2:
                case 6:
                    // True Color
                    imgData.PNGData.sBIT = {
                        "r": buff[1],
                        "g": buff[2],
                        "b": buff[3]
                    };
                    break;
                case 3:
                    // インデックスカラー
                    imgData.PNGData.sBIT = {
                        "r": buff[1],
                        "g": buff[2],
                        "b": buff[3]
                    };
                    break;
                case 4:
                    // グレイスケール＋アルファ
                    imgData.PNGData.sBIT = {
                        "gray": buff[1],
                        "trans": buff[2]
                    };
                    break;
                case 6:
                    //トゥルーカラー＋アルファ
                    imgData.PNGData.sBIT = {
                        "r": buff[1],
                        "g": buff[2],
                        "b": buff[3],
                        "trans": buff[4]
                    };
                    break;
            }
        }
        catch (e) {
            console.error("error : " + e);
        }
    },
    "sPLT": function (chunkType, buff, len, imgData) {
        // 推奨パレット
        console.warn("!!" + chunkType + " unimplemented!!");
        // サンプル精度
        imgData.PNGData.sPLT = {
            "accuracy": buff[2]
        };
        // ここからの処理は要調査
    },
    "hIST": function (chunkType, buff, len, imgData) {
        // パレットヒストグラム
        console.warn("!!" + chunkType + " unimplemented!!");
        // ここからの処理は要調査
        //imgData.hIST;
    },
    "tIME": function (chunkType, buff, len, imgData) {
        // イメージの最終更新時間
        console.warn("!!" + chunkType + " no test!!");
        imgData.PNGData.tIME = {
            "year": buffToNum(buff.slice(1, 3), 2),
            "month": buff[3],
            "day": buff[4],
            "hour": buff[5],
            "minute": buff[6],
            "second": buff[7]
        };
    },
    "fRAc": function (chunkType, buff, len, imgData) {
        // フラクタル・イメージ・パラメータ
        console.warn("!!" + chunkType + " unimplemented!!");
    },
    "gIFg": function (chunkType, buff, len, imgData) {
        // GIFグラフィック制御拡張
        console.warn("!!" + chunkType + " unimplemented!!");
    },
    "gIFt": function (chunkType, buff, len, imgData) {
        // GIFプレーン・テキスト拡張
        console.warn("!!" + chunkType + " unimplemented!!");
    },
    "gIFx": function (chunkType, buff, len, imgData) {
        // GIF応用拡張
        console.warn("!!" + chunkType + " unimplemented!!");
    },
    "oFFs": function (chunkType, buff, len, imgData) {
        // イメージ・オフセット
        console.warn("!!" + chunkType + " unimplemented!!");
    },
    "pCAL": function (chunkType, buff, len, imgData) {
        // 画素値の較正
        console.warn("!!" + chunkType + " unimplemented!!");
    },
    "sCAL": function (chunkType, buff, len, imgData) {
        // イメージの物理寸法
        console.warn("!!" + chunkType + " unimplemented!!");
    },
    "IEND": function (chunkType, buff, len, imgData) {
        // イメージ終端
    }
};
