/**
 * Created by liyongleihf2006 on 2018/1/17.
 * 模仿钉钉的日程安排插件
 * option:{
 *     colors:["rgb(249,205,173)","lightblue"],//各个日程安排条的背景色,循环顺序使用
 *     timeScale:{//时间刻度配置
 *          startTime:6*60*60*1000,//传入的日程安排刻度的起始时间(需要注意的是当该传入的时间不是整点的时候实际使用的时间是比其早的整点),单位是毫秒
 *          endTime:24*60*60*1000,//传入的日程安排刻度的结束时间(需要注意的是当该传入的时间不是整点的时候实际使用的时间是比其晚的整点),单位是毫秒
 *          timeInterval:60*60*1000,//时间刻度之间的间隔,单位是毫秒
 *          formatter:function(time){//时间刻度的格式化,time是刻度的毫秒
 *              var hour = Math.floor(time/(60*60*1000));
 *              var minute = Math.floor(time%(60*60*1000)/(60*1000));
 *              hour = (100+hour+"").slice(1);
 *              minute = (100+minute+"").slice(1);
 *              return hour+":"+minute;
 *          },
 *          click:function(currentData,data,idx){}//各个日程安排条的点击事件
 *      },
 *      data:[{//日程安排条的数据
 *          startTime://日程的起始时间,单位是毫秒
 *          endTime://日程的结束时间,单位是毫秒
 *          text://需要展示的内容
 *      },...],
 *      formatter:function(item){//格式化日程安排条,item是当前日程数据
 *          return item.text;
 *      },
 *      showMask:"normal",//是否显示时间遮罩,normal:遮罩会把当前时间之前的范围盖住,cover:遮罩会把整个范围盖住,hide:遮罩不显示
 * }
 *method:
 *      setData(data)//传入日程安排数据  
 *
 */
(function($){
    if($.fn.schedule){
        return;
    }
    var setMethods={
        setData:setData
    };
    var getMethods={};
    $.fn.schedule=function( ){
        var args=arguments,params,method;
        if(!args.length|| typeof args[0] == 'object'){
            return this.each(function(idx){
                var $self=$(this);
                $self.data('schedule',$.extend(true,{},$.fn.schedule.default,args[0]));
                params=$self.data('schedule');
                _init.call( $self,params);
                _render.call($self);
            });
        }else{
            if(!$(this).data('schedule')){
                throw new Error('You has not init schedule!');
            }
            params=Array.prototype.slice.call(args,1);
            if (setMethods.hasOwnProperty(args[0])){
                method=setMethods[args[0]];
                return this.each(function(idx){
                    var $self=$(this);
                    method.apply($self,params);
                    _render.call($self);
                });
            }else if(getMethods.hasOwnProperty(args[0])){
                method=getMethods[args[0]];
                return method.apply(this,params);
            }else{
                throw new Error('There is no such method');
            }
        }
    }
    $.fn.schedule.default={
        colors:["rgba(249,205,173,.5)","rgba(200,200,255,.5)"],
        timeScale:{
            startTime:6*60*60*1000,
            endTime:24*60*60*1000,
            timeInterval:60*60*1000,
            formatter:function(time){
                var hour = Math.floor(time/(60*60*1000));
                var minute = Math.floor(time%(60*60*1000)/(60*1000));
                hour = (100+hour+"").slice(1);
                minute = (100+minute+"").slice(1);
                return hour+":"+minute;
            },
            click:function(currentData,data,idx){}
        },
        data:[],
        formatter:function(item){
            return item.text;
        },
        showMask:"normal"
    }
    function _init(params){
        return this;
    }
    function setData(data){
        var $self=this,
            params=$self.data("schedule");
            params.data=data;
    }
    function _render(){
        var $self=this,params=$self.data("schedule");
        $self.addClass("schedule").html([
            _renderTimeScale.call($self),
            $("<div/>",{
                "class":"schedule-content"
            }).append(
                _renderItem.call($self)
            )
        ])
    }
    function _renderTimeScale(){
        var $self=this,
            params=$self.data("schedule"),
            timeScale=params.timeScale,
            timeInterval=timeScale.timeInterval,
            startTime=timeScale.startTime,
            endTime=timeScale.endTime,
            formatter=timeScale.formatter,
            _beginTime=startTime%(60*60*1000)?(Math.floor(startTime/(60*60*1000)))*(60*60*1000):startTime,
            _finishTime=endTime%(60*60*1000)?(Math.floor(endTime/(60*60*1000))+1)*(60*60*1000):endTime,
            scales=[];
            params._beginTime=_beginTime;
            params._finishTime=_finishTime;
            params.scales=scales;
        for(var i = _beginTime;i<=_finishTime;i+=timeInterval){
            scales.push(i);
        }
        /* 单位高度 */
        var unitPos = 1/(scales.length-1);
        return $("<div/>",{
            "class":"schedule-scale-container"
        }).append(
            scales.map(function(scale,idx){
                return $("<span/>",{
                    "class":"schedule-scale-cell",
                    "text":formatter(scale),
                    "style":function(){
                        return "top:"+unitPos*idx*100+"%";
                    }
                }) 
            }),
            function(){
                return params.showMask==="normal"&&_renderCurrentLabel.call($self)
            }()
        )
    }
    function _renderCurrentLabel(){
        var $self=this,
        params=$self.data("schedule"),
        _beginTime=params._beginTime,
        _finishTime=params._finishTime,
        formatter=params.timeScale.formatter,
        now=new Date(),
        hour=now.getHours()*60*60*1000,
        minute=now.getMinutes()*60*1000,
        top=(hour+minute-_beginTime)/(_finishTime-_beginTime)*100+"%";
        return $("<div/>",{
            "class":"schedule-current-top",
            "style":function(){
                return "top:"+top;
            },
            "html":formatter(hour+minute)
        });
    }
    function _renderAuxiliaryLine(){
        var $self=this,
            params=$self.data("schedule"),
            scales=params.scales;
        /* 单位高度 */
        var unitPos = 1/(scales.length-1);
        return $("<div/>",{
            "class":"schedule-auxiliaryLine-container"
        }).html(
            function(){
                var arr = [];
                for(var idx=0;idx<=scales.length-1;idx++){
                    arr.push(
                        $("<hr/>",{
                            "class":"schedule-auxiliaryLine",
                            "style":function(){
                                return "top:"+unitPos*idx*100+"%";
                            }
                        })
                    )
                }
                return arr;
            }()
        )
    }
    function _renderCurrentMask(){
        var $self=this,
        params=$self.data("schedule"),
        _beginTime=params._beginTime,
        _finishTime=params._finishTime,
        now=new Date(),
        hour=now.getHours()*60*60*1000,
        minute=now.getMinutes()*60*1000,
        height;
        switch(params.showMask){
            case "normal":height=(hour+minute-_beginTime)/(_finishTime-_beginTime)*100+"%";break;
            case "cover":height="100%";break;
            case "hide":height="0%";break;
            default:throw new Error("the showMask's value must be \"normal\" or \"cover\" or  \"hide\"");break;
        }
        return $("<div/>",{
            "class":"schedule-current-mask",
            "style":function(){
                return "height:"+height;
            }
        });
    }
    function _renderItem(){
        var $self=this,
        params=$self.data("schedule"),
        scales=params.scales,
        _beginTime=params._beginTime;
        _finishTime=params._finishTime;
        data=params.data,
        formatter=params.formatter,
        colors=params.colors,
        click=params.click;
        return $("<div/>",{
            "class":"schedule-item-container"
        }).append(
            _renderCurrentMask.call($self),
            _renderAuxiliaryLine.call($self),
            data.map(function(item,idx){
                return $("<div/>",{
                    "class":"schedule-item",
                    "style":function(){
                        var top = (item.startTime - _beginTime)/(_finishTime - _beginTime)*100+"%";
                        var height = (item.endTime - item.startTime)/(_finishTime - _beginTime)*100+"%";
                        var backgroundColor = colors[idx%colors.length];
                        return "top:"+top+";height:"+height+";background-color:"+backgroundColor;
                    },
                    html:formatter(item),
                    "click":click.bind($self,item,data,idx)
                })
            }),
        )
    }
})(jQuery);