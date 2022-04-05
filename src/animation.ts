import {PNG, PNGType} from "./png.js";
import {PNGCanvas} from "./pngutil.js";
//import {PNG, PNGType} from "./png";
//import {PNGCanvas} from "./pngutil";

export class Animation{
    imgMap : {[keu : string] : PNG} = {};
    imgIdx = 0;
    pngCanvas!: PNGCanvas;
    ctx! : CanvasRenderingContext2D | null;
    ctx2! : CanvasRenderingContext2D | null;

    /**
     * 共通パレット
     */
    systemPalette : Uint8Array | undefined;
    defPalette : Uint8Array | undefined;
    defTrans : Uint8Array | undefined;

    // アニメーション用のカウンタ
    anicnt = 0;
    basetime : Date = new Date();
    fpscount = 0;
    framerate = 0;
    count = 0;

    private static animeObject : Animation | undefined;
    
    private constructor(){
    }

    public static getInstance() : Animation{
        if(!Animation.animeObject){
            Animation.animeObject = new Animation();
        }
        return Animation.animeObject;
    }

    public initalize(){
        console.log("start");
        console.log("load start");
    
        let canvas = <HTMLCanvasElement>document.getElementById('canvas');
        this.ctx = canvas.getContext('2d');
        let canvas2 = <HTMLCanvasElement>document.getElementById('canvas2');
        this.ctx2 = canvas2.getContext('2d');
        this.ctx2!.imageSmoothingEnabled = false;
        
        // 以下はTypeScriptにはないみたい
        //ctx2!.mozImageSmoothingEnabled = false;
        //ctx2!.webkitImageSmoothingEnabled = false;
        this.pngCanvas = new PNGCanvas(canvas.width, canvas.height);
    
        Promise.all([
            PNG.load("./img/test.png"),
            PNG.load("./img/testbig.png"), 
            //PNG.load("./img/ingresspc.png"),
        ]).then(result =>{
            if(result[0].PNGData.IHDR?.color == 3){
                this.imgMap["test01"] = result[0];
            }
            if(result[1].PNGData.IHDR?.color == 3){
                this.imgMap["test02"] = result[1]; 
            }
            //if(result[2] && result[2].PNGData.IHDR && result[2].PNGData.IHDR.color == 3){
            //    this.imgMap["test02"] = result[2]; 
            //}
            console.log("Finish");
            console.log(result);
            (<HTMLButtonElement>document.getElementById('viewImageButton')).disabled = false;
            this.defPalette = this.imgMap["test01"].PNGData.PLTE;
            this.defTrans = this.imgMap["test01"].PNGData.tRNS;
            this.systemPalette = this.defPalette;
        }).catch(reject =>{
            console.log(reject);
        });
    
        (<HTMLButtonElement>document.getElementById('viewImageButton')).addEventListener('click', (e) => {
            console.log("click");
            let keys = Object.keys(this.imgMap);
            this.imgIdx++;
            if(keys.length <= this.imgIdx ){
                this.imgIdx = 0;
            }
        });
    
        this.fpscount = 0;
        this.basetime = new Date();
        this.framerate = 0;
        this.count = 0;
    
        window.requestAnimationFrame(this.animation);
        //resize();
    };
    
  
    public animation(){
        anime.fpscount++;
        var now : Date = new Date();
        var diff = now.getTime() - anime.basetime.getTime()
        if(diff >= 1000){
            anime.framerate = Math.round((anime.fpscount * 1000) / diff);
            anime.fpscount = 0;
            anime.basetime = new Date();
        }
        (<HTMLInputElement>document.getElementById("fps")).value = anime.framerate.toString();
    
        try{
            let keys = Object.keys(anime.imgMap);
            let pngData = anime.imgMap[keys[anime.imgIdx]];
    
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
    
            if(anime.systemPalette && anime.pngCanvas){
                let idx =  Math.floor(anime.anicnt / 20);
                anime.systemPalette.set(animePlt[idx], 10 * 3);
                anime.anicnt++;
                if(anime.anicnt >= 20 * 4){
                    anime.anicnt = 0;
                }
        
                let canvas = <HTMLCanvasElement>document.getElementById('canvas');
                anime.pngCanvas.palette = anime.systemPalette;
                anime.pngCanvas.defaultPalette = anime.defPalette!;
                anime.pngCanvas.trans = anime.defTrans!;
        
                anime.pngCanvas.fillRect(0, 0, canvas.width, canvas.height, 63);
                anime.pngCanvas.drawPng(<PNGType>pngData.PNGData, 0, 0, 64, 64, 10, 10);
                anime.pngCanvas.drawPng(<PNGType>pngData.PNGData, 10, 10, 32, 32, 84, 80);
                anime.pngCanvas.drawContext(anime.ctx!, 0, 0, 0, 0);
    
                let buff = <HTMLCanvasElement>document.getElementById('canvas');
                anime.ctx2?.drawImage(buff, 0, 0, 720, 480);
        
            }
        }catch(e){
            console.error(e);
        }finally{
            window.requestAnimationFrame(anime.animation);
        }
    }
}

export let anime : Animation = Animation.getInstance();
