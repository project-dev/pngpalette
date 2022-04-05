//import {PNGType} from "./png";
import {PNGType} from "./png.js";
import crc32 from '../node_modules/crc/mjs/calculators/crc32.js';

/**
 * 仮想キャンバス
 */
export class PNGCanvas{
    /** 仮想CanvasのUint8Array */
    public canvas : Uint8Array = new Uint8Array();

    /** 仮想Canvasの幅 */
    public width : number = -1;

    /** 仮想Canvasの高さ */
    public height : number = -1;

    /** 共通パレット */            
    public palette : Uint8Array = new Uint8Array();

    /** デフォルトの共通パレット */            
    public defaultPalette : Uint8Array = new Uint8Array();

    /** 透過色のインデックス */            
    public trans : Uint8Array = new Uint8Array();

    /**
     * 仮想キャンバスの作成する
     * @param {pngClass} target createCanvas()メソッドで生成したpngClass
     */
    public create(){
        // width * height * rgba(4byte)
        this.canvas = new Uint8Array(this.width * this.height);
    }

    constructor(width:number, height:number){
        this.width = width;
        this.height = height;
        this.create();
    }


    /**
     * PNG(インデックスカラー)を仮想キャンバスに描画する
     * @param {pngClass} target 
     * @param {imgData} pngData 
     * @param {integer} sx 
     * @param {integer} sy 
     * @param {integer} sw 
     * @param {integer} sh 
     * @param {integer} dx 
     * @param {integer} dy 
     * @returns pngClass
     */
    public drawPng(pngData : PNGType, sx : number, sy : number, sw : number, sh : number, dx : number, dy : number){
        if(!pngData.IHDR || pngData.IHDR.color != 3){
            // パレットカラーのみ対応
            return;
        }

        //var startTime = performance.now();
    
        let pngW = pngData.IHDR.width;
        let pngH = pngData.IHDR.height;
    
        let endX = sx + sw <= pngW ? sx + sw : pngW;
        let endY = sy + sh <= pngH ? sy + sh : pngH;
    
        // システムパレットが設定されている場合はシステムパレットを利用する
        // システムパレットがない場合はPNGのパレットを使用する
        let palette = this.palette ? this.palette : pngData.PLTE;
        let buff = pngData.IDAT;
        let trans = pngData.tRNS;

        for(var y = sy; y < endY; y++ ){
            // 0バイト目が必ず0になるので、ここで調節する
            let row = buff!.slice(y * (pngW + 1), y * (pngW + 1) + (pngW + 1));
    
            for(var x = sx; x < endX; x++ ){
                var isTrans = false;
                let pxColorIdx = row[x];
                trans!.forEach(element => {
                    if(element == pxColorIdx){
                        isTrans = true;
                    }
                });
                if(!isTrans){
                    // 透明色は描画しない
                    //let pxidx = ((y + sy) * pngW + (x + sx)) * 4;
                    let drawX = x - sx + dx;
                    let drawY = y - sy + dy;
                    let pxidx = (drawY * this.width + drawX);
                    this.canvas[pxidx] = pxColorIdx;
                }
            }
        }

        //console.log("drawPng time " + (performance.now() - startTime));
    }

    /**
     * 仮想キャンバスに塗りつぶした四角を描画する
     * @param {pngClass} target 
     * @param {integer} sx 
     * @param {integer} sy 
     * @param {integer} w 
     * @param {integer} h 
     * @param {Uint8} colorindex 
     * @returns 
     */
    public fillRect(sx : number, sy : number, w : number, h : number, colorindex : number){
        for(var y = sy; y < this.height; y++){
            for(var x = sx; x < this.width; x++){
                let pxidx = (y * this.width + x);
                this.canvas[pxidx] = colorindex;
            }
        }
    }

        /**
         * 仮想キャンバスの内容をCanvasタグのコンテキストに描画する
         * @param {*} ctx 
         * @param {pngClass} target 
         * @param {integer} sx 
         * @param {integer} sy 
         * @param {integer} dx 
         * @param {integer} dy 
         */
    public drawContext(ctx : CanvasRenderingContext2D , sx : number, sy : number, dx : number, dy : number){
        
        // インデックスから実際のパレットへの変換は、ここでやらないだめ。
        var imgData = ctx.createImageData(this.width, this.height);

        let palette = this.palette;
        let w = this.width;
        let h = this.height;
        let trans = this.trans;

        //  var startTime = performance.now();
        // TODO:このループが時間かかる。まぁ、当たり前なんだけど。
/*
        for(var y = 0; y < h; y++ ){
            for(var x = 0; x < w; x++ ){
                // 0番目は必ず0のようなので+1して参照する
                let idx = y * w + x;
                let pxColorIdx = target.canvas[idx];
                let r = palette[pxColorIdx * 3    ];
                let g = palette[pxColorIdx * 3 + 1];
                let b = palette[pxColorIdx * 3 + 2];
    
                var isTrans = false;
                trans.forEach(element => {
                    if(element == pxColorIdx){
                        isTrans = true;
                    }
                });
    
                if(!isTrans){
                    // 透明色は描画しない
                    //let pxidx = ((y + sy) * pngW + (x + sx)) * 4;
                    let drawX = x - sx + dx;
                    let drawY = y - sy + dy;
                    let pxidx = (drawY * target.width + drawX) * 4;
                    imgData.data[pxidx   ] = r;
                    imgData.data[pxidx + 1] = g;
                    imgData.data[pxidx + 2] = b;
                    imgData.data[pxidx + 3] = 0xff;
                }
            }
        }
*/

        // 暫定的にシンプルにしてみたけど、まぁ、効果はない
        for(var idx = 0; idx < h * w; idx++){
            let pxColorIdx = this.canvas[idx];
            let r = palette[pxColorIdx * 3    ];
            let g = palette[pxColorIdx * 3 + 1];
            let b = palette[pxColorIdx * 3 + 2];

            var isTrans = false;
            trans.forEach(element => {
                if(element == pxColorIdx){
                    isTrans = true;
                }
            });

            if(!isTrans){
                // 透明色は描画しない
                //let pxidx = ((y + sy) * pngW + (x + sx)) * 4;
                let pxidx = idx * 4;
                imgData.data[pxidx   ] = r;
                imgData.data[pxidx + 1] = g;
                imgData.data[pxidx + 2] = b;
                imgData.data[pxidx + 3] = 0xff;
            }
        }
        //console.log("drawContext time " + (performance.now() - startTime));
        ctx.putImageData(imgData, dx, dy);
    }

};

/**
 * 
 * @param {*} buff 
 * @param {*} digit 
 * @returns 
 */
 export function buffToNum(buff : Uint8Array, digit : number) : number{
    if((buff.byteLength) < digit){
        return 0;
    }
    var ret = 0;
    for(var i = 0; i < digit; i++){
        var maskVal = (0x000000ff << ((digit - 1) - i) * 8) >>> 0;
        ret = ret + (maskVal & buff[i] << ((digit - 1) - i) * 8);
    }
    return ret;
}

/**
 * 引数のUint8ArrayのCRC32を求める
 */
 export function calcCRC32(buff : Uint8Array) : Uint8Array{
    let crcTarget = Array.from(buff, e => String.fromCharCode(e)).join("");
        //var crc = CRC32.bstr(crcTarget) >>> 0;
        var crc = crc32(buff) >>> 0;
        
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
export function outBytewData(url : String, buff : Uint8Array){
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