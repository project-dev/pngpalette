/**
 * PNGを描画するための仮想キャンバスを作成します
 * JSONをクラスの替わりに使ってるけど、クラスのようには当然ふるまえないのでちょっと実装がダサいけど気にしない。
 * @param {integer} width 仮想キャンバスの幅
 * @param {integer} height 仮想キャンバスの高さ
 */
function createCanvas(width, height){
    let pngClass =  {
        /** 仮想CanvasのUint8Array */
        "canvas":undefined,

        /** 仮想Canvasの幅 */
        "width":width,

        /** 仮想Canvasの高さ */
        "height":height,

        /** 共通パレット */            
        "palette":undefined,

        /** デフォルトの共通パレット */            
        "defaultPalette":undefined,

        /** 透過色のインデックス */            
        "trans":undefined,

        /**
         * 仮想キャンバスの作成する
         * @param {pngClass} target createCanvas()メソッドで生成したpngClass
         */
        "create":(target)=>{
            // width * height * rgba(4byte)
            target.canvas = new Uint8Array(target.width * target.height);
            target.palette = new Uint8Array(255 * 3);
            target.defaultPalette = new Uint8Array(255 * 3);
        },

        /**
         * PNG(インデックスカラー)を仮想キャンバスに描画する
         * @param {pngClass} target 
         * @param {imgData} pngData 
         * @param {integer} srcX ソースX座標
         * @param {integer} srcY ソースY座標
         * @param {integer} srcW ソース幅
         * @param {integer} srcH ソース高さ
         * @param {integer} dx 描画位置X
         * @param {integer} dy 描画位置Y
         * @returns pngClass
         */
        "drawPng":(target, pngData, srcX, srcY, srcW, srcH, distX, distY)=>{
            if(pngData == null || 'ihdr' in pngData == false){
                // ヘッダ情報がない
                return;
            }
            if(pngData.ihdr.color != 3){
                // パレットカラーのみ対応
                return;
            }

            //let startTime = performance.now();
        
            let pngW = pngData.ihdr.width;
            let pngH = pngData.ihdr.height;
            let endX = srcX + srcW;
            let endY = srcY + srcH;
            let srcXOffset = 0;
            let srcYOffset = 0;
            if(distX < 0){
                // 0未満
                srcXOffset = Math.abs(distX);
            }
            if(distX + srcW > target.width){
                // 描画先の幅以上
                endX = srcX + (srcW - ((distX + srcW) - target.width));
            }
            if(distY < 0){
                // 0未満
                srcYOffset = Math.abs(distY);
            }
            if(distY + srcH > target.height){
                // 描画先の高さ以上
                endY = srcY + (srcH - ((distY + srcH) - target.height));
            }

            // システムパレットが設定されている場合はシステムパレットを利用する
            // システムパレットがない場合はPNGのパレットを使用する
            let palette = target.palette ? target.palette : pngData.plte;
            let buff = pngData.idat;
            let trans = pngData.trns;

            for(let y = (srcY + srcYOffset); y < endY; y++ ){
                // 0バイト目が必ず0になるので、ここで調節する
                let row = buff.slice(y * (pngW + 1), y * (pngW + 1) + (pngW + 1));
        
                for(let x = (srcX + srcXOffset); x < endX; x++ ){
                    let isTrans = false;
                    // ToDo:なぜか先頭が0っぽいのでさらに1ずらす。原因究明は後回し
                    let pxColorIdx = row[x + 1];
                    trans.forEach(element => {
                        if(element == pxColorIdx){
                            isTrans = true;
                        }
                    });
                    if(!isTrans){
                        // 透明色は描画しない
                        //let pxidx = ((y + srcY) * pngW + (x + srcX)) * 4;
                        let drawX = x - srcX + distX;
                        let drawY = y - srcY + distY;
                        let pxidx = (drawY * target.width + drawX);
                        target.canvas[pxidx] = pxColorIdx;
                    }
                }
            }

            //console.log("drawPng time " + (performance.now() - startTime));

            return target;
        },

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
        "fillRect":(target, sx, sy, w, h, colorindex)=>{
            for(let y = sy; y < target.height; y++){
                for(let x = sx; x < target.width; x++){
                    let pxidx = (y * target.width + x);
                    target.canvas[pxidx] = colorindex;
                }
            }
            return target;
        },

        /**
         * 仮想キャンバスの内容をCanvasタグのコンテキストに描画する
         * @param {*} ctx 
         * @param {pngClass} target 
         * @param {integer} sx 
         * @param {integer} sy 
         * @param {integer} dx 
         * @param {integer} dy 
         */
        "drawContext":(ctx, target, sx,sy, dx, dy)=>{

            if(!target || !target.palette){
                return;
            }

            // インデックスから実際のパレットへの変換は、ここでやらないだめ。

            let palette = target.palette;
            let w = target.width;
            let h = target.height;
            let trans = target.trans;

            let imgData = ctx.createImageData(target.width, target.height);

            //  let startTime = performance.now();
            // TODO:このループが時間かかる。まぁ、当たり前なんだけど。
/*
            for(let y = 0; y < h; y++ ){
                for(let x = 0; x < w; x++ ){
                    // 0番目は必ず0のようなので+1して参照する
                    let idx = y * w + x;
                    let pxColorIdx = target.canvas[idx];
                    let r = palette[pxColorIdx * 3    ];
                    let g = palette[pxColorIdx * 3 + 1];
                    let b = palette[pxColorIdx * 3 + 2];
        
                  let isTrans = false;
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
            if(palette && palette.length > 0){
                for(let idx = 0; idx < h * w; idx++){
                    let pxColorIdx = target.canvas[idx];
                    let r = palette[pxColorIdx * 3    ];
                    let g = palette[pxColorIdx * 3 + 1];
                    let b = palette[pxColorIdx * 3 + 2];

                    let isTrans = false;
                    if(trans){
                        trans.forEach(element => {
                            if(element == pxColorIdx){
                                isTrans = true;
                            }
                        });
                    }

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
        }
    };
    pngClass.create(pngClass);
    return pngClass;
}

