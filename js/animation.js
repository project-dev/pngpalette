/*
 * テキストのdeflate/inflate 圧縮は以下のライブラリを使えば対処できるかも？
 * https://github.com/imaya/zlib.js/
 */

var imgMap = {};
var imgIdx = 0;
var canvas;
var pngCanvas;
var ctx;
var ctx2;

/** PLTEチャンク名 */
const PLTE_CHUNKTYPE = new Uint8Array([0x50, 0x4c, 0x54, 0x45]);

/** ビット深度とカラータイプ */
const IMAGE_FORMAT = new Uint8Array([0x08, 0x03]);

/** PLTEチャンク のサイズ */
const PLTE_SIZE = new Uint8Array([0x00, 0x00, 0x03, 0x00]);

/** ビット深度の位置 */
const BIT_DEPTH_POS = 24;

/** パレットデータの長さの位置 */
const PALETTE_DATA_LENGTH_POS = 33;

/**
 * 共通パレット
 */
var systemPalette;

var defPalette;
var defTrans;

document.addEventListener('DOMContentLoaded', function() {
    console.log("start");
    console.log("load start");

    let canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    let canvas2 = document.getElementById('canvas2');
    ctx2 = canvas2.getContext('2d');
    ctx2.imageSmoothingEnabled = false;
    ctx2.mozImageSmoothingEnabled = false;
    ctx2.webkitImageSmoothingEnabled = false;
    pngCanvas = createCanvas(canvas.width, canvas.height);

    Promise.all([
        loadPng("./img/test.png"),
        loadPng("./img/testbig.png"), 
        loadPng("./img/ingresspc.png"),
    ]).then(result =>{
        if(result[0].ihdr.color == 3){
            imgMap["test01"] = result[0];
        }
        if(result[1].ihdr.color == 3){
            imgMap["test02"] = result[1]; 
        }
        if(result[2] && result[2].ihdr && result[2].ihdr.color == 3){
            imgMap["test02"] = result[2]; 
        }
        console.log("Finish");
        console.log(result);
        document.getElementById('viewImageButton').disabled = false;
        defPalette = imgMap["test01"].plte;
        defTrans = imgMap["test01"].trns;
        systemPalette = defPalette;
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
    });

	fpscount = 0;
	basetime = new Date();
	framerate = 0;
	count = 0;

    window.requestAnimationFrame(animation);
    //resize();
});

// アニメーション用のカウンタ
var anicnt = 0;
var basetime;
var fpscount = 0;
var framerate = 0;

function animation(){
	fpscount++;
	var now = new Date();
	if(now - basetime >= 1000){
		framerate = Math.round((fpscount * 1000) / (now - basetime));
		fpscount = 0;
		basetime = new Date();
	}
    document.getElementById("fps").value=framerate;

    try{
        let keys = Object.keys(imgMap);
        let pngData = imgMap[keys[imgIdx]];

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

        if(systemPalette && pngCanvas){
            let idx =  Math.floor(anicnt / 20);
            systemPalette.set(animePlt[idx], 10 * 3);
            anicnt++;
            if(anicnt >= 20 * 4){
                anicnt = 0;
            }
    
            let canvas = document.getElementById('canvas');
            pngCanvas.palette = systemPalette;
            pngCanvas.defaultPalette = defPalette;
            pngCanvas.trans = defTrans;
    
            pngCanvas.fillRect(pngCanvas, 0, 0, canvas.width, canvas.height, 63);
            pngCanvas.drawPng(pngCanvas, pngData, 0, 0, 64, 64, 10, 10);
            pngCanvas.drawPng(pngCanvas, pngData, 10, 10, 32, 32, 84, 80);
            pngCanvas.drawContext(ctx, pngCanvas, 0, 0, 0, 0);

            let buff = document.getElementById('canvas');
            ctx2.drawImage(buff, 0, 0, 720, 480);
    
        }
    }catch(e){
        console.error(e);
    }finally{
        window.requestAnimationFrame(animation);
    }
}
