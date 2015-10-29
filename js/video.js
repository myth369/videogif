// 原生的JavaScript事件绑定函数
function bindEvent(ele, eventName, func){
    if(window.addEventListener){
        ele.addEventListener(eventName, func);
    }
    else{
        ele.attachEvent('on' + eventName, func);
    }
}

/**
 * VidwoImage
 * var vi = new VidewImage({videoEl:videoEL, delay:100})
 * vi.render(startTime, endTime);
 */
function VideoImage(opt) {
    opt = opt || {};
    this.opt = opt;

    this.videoEl = opt.videoEl;
    this.init();
    this.bindEvent();
}

VideoImage.prototype = {
    init : function() {
        var me = this;

        me.vWidth    = me.videoEl.offsetWidth;
        me.vHeight   = me.videoEl.offsetHeight;
        me.ImageData = [];

        me.gif = new GIF({
            workers: 2,
            quality: 10
        });

        me.initCanvas();
    },
    bindEvent: function() {
        var me = this;

        me.timer = null;
        me.timer1 = null;

        /**
         * ImageData数组中图片添加到gif里
         */
        function endFrames(){
            me.clearTimer();
            me.videoEl.pause();

            var imgEl = document.createElement('img');
            for(var i=0,len = me.ImageData.length; i<len; i++){
                imgEl.src = me.ImageData[i];
                me.gif.addFrame(imgEl, {
                    copy: true,
                    delay: me.opt.delay
                });
            }
            me.gif.render();
        }
        
        function makeImageData(){
            console.log(new Date())
            me.clearTimer();
            // Canvas draw Images
            me.timer = setInterval(function() {
                if(me.videoEl.currentTime >= me.endTime) endFrames();
                me.ctx.drawImage(me.videoEl, 0, 0, me.vWidth, me.vHeight);
            },20);

            /**
             * ImageData base64
             * 每delay秒里从Canvas抽一帧
             */
            me.timer1 = setInterval(function() {
                me.ImageData.push(me.canvas.toDataURL());
            },me.opt.delay);
        }

        bindEvent(me.videoEl, 'play', makeImageData);
        bindEvent(me.videoEl, 'pause', me.clearTimer);
        bindEvent(me.videoEl, 'ended', me.clearTimer);
        // bindEvent(me.videoEl, 'loadeddata', function() {
        //     me.videoEl.play();
        // });

        me.gif.on('start', function() {
            // TODO return startTime = now();
        });

        var progressBox = document.getElementById('progress');
        me.gif.on('progress', function(p) {
            // console.log(p)
            progressBox.innerHTML = ("rendering: " + (Math.round(p * 100)) + "%");
            // return info.set('text', "rendering: " + (Math.round(p * 100)) + "%");
        });

        me.gif.on('finished', function(blob) {
            me.gifSrc = URL.createObjectURL(blob);
            me.preview();
            // var delta, img;
            // img = document.id('result');
            // img.src = URL.createObjectURL(blob);
            // delta = now() - startTime;
            // return info.set('text', "done in\n" + ((delta / 1000).toFixed(2)) + "sec,\nsize " + ((blob.size / 1000).toFixed(2)) + "kb");
        });

        var imgsBox = document.getElementById('previewImages');
        var imgEl = document.getElementById('previewImg');
        bindEvent(imgsBox, 'click', function(event){
            if(event.target.tagName == 'IMG'){
                imgEl.src = event.target.src;
            }
        });
        bindEvent(imgEl, 'click', function(){
            this.src = me.gifSrc;
        });
    },
    initCanvas: function() {
        var me = this;
        var canvas = document.createElement('canvas');
        canvas.width = me.vWidth;
        canvas.height = me.vHeight;
        canvas.style.position = 'absolute';
        canvas.style.left = '-100%';
        canvas.style.top = '-100%';
        document.body.appendChild(canvas);
        me.canvas =  canvas;
        me.ctx = me.canvas.getContext("2d");
    },
    render: function(startTime, endTime){
        var me = this;
        me.clearTimer();

        me.startTime = startTime;
        me.endTime = (endTime > me.videoEl.duration ? me.videoEl.duration : endTime);
        me.ImageData = [];

        me.gif.abort();
        me.gif.frames = [];

        me.videoEl.pause();
        me.videoEl.currentTime = me.startTime;
        me.videoEl.play();
    },
    clearTimer: function (){
        var me = this;
        clearInterval(me.timer);
        clearInterval(me.timer1);
    },
    preview: function(){
        var me = this;
        var imgEl = document.getElementById('previewImg');
        imgEl.src = me.gifSrc;

        var imgNew = null;
        var imgsBox = document.getElementById('scroller');
        var oFragment = document.createDocumentFragment();
        for(var i=0,len = me.ImageData.length; i<len; i++){
            imgNew = document.createElement('img');
            imgNew.src = me.ImageData[i];
            oFragment.appendChild(imgNew);
        }
        imgsBox.appendChild(oFragment);
        imgsBox.style.width = 30 / me.vHeight * me.vWidth * me.ImageData.length + 'px';
        myScroll = new IScroll('#previewImages', { scrollX: true, scrollY: false, mouseWheel: true });
    }
}
