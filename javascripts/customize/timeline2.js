/* [ d3-time-format ]: ( https://github.com/d3/d3-time-format#localeFormat ) */
/* 参考用法：( https://bl.ocks.org/mbostock/805115ebaa574e771db1875a6d828949 ) */
/* 常用时间格式指示符：
%Y  年份
%b  月份缩写    %B  月份全称    %m  十进制月份[01, 12]
%d  补零日期[01, 31]    %e  补空格日期[ 1, 31]
%a  星期缩写    %A  星期全称
%H  24小时制   %I  12小时制
%M  分钟数[00, 59]
%S  秒数[00, 61]
以下对应d3.timeFormatLocale中的几个键
%p  periods  %c dateTime    %x  date    %X  time
填充符（用法，如"%-m"表示月份不补东西）：
0   补0
_   补空格
-    不补
*/

/*
绘制时间线的函数
- 时间轴的SVG的ID为"timeline"
*/
var TimeLine = function () {
    this.MS_IN_DAY = 86400000; // 一天的毫秒数
    /* 将日期推后一天 */
    this._addOneDay = function (date) {
        return new Date(date.getTime() + this.MS_IN_DAY);
    }
    //简体中文本地化：[ zhTimeFormat ]是locale对象
    // zhTimeFormat.format("xxxx")返回一个formatter函数
    this.zhTimeFormat = d3.timeFormatLocale({
        dateTime: "%Y-%b-%e %X %a",
        date: "%Y/%-m/%e",
        time: "%H:%M:%S",
        periods: ["上午", "下午"],
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        shortDays: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        shortMonths: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
    });
    // 绘制选项
    this.options = {
        axisTransform: "translate(16, 16)",
        circleCy: 16,
        circleCxTranslate: 16.4,
        circleRadiusNormal: 4,
        circleRadiusScale: 6,
        circleFillNormal: "#727cf5cd",
        circleFillActive: "#8f75da"
    }
    // 时间轴SVG
    let svg = d3.select("#timeline");
    // 添加时间轴Group
    this.timeAxisG = svg.append("g")
        .attr("class", "time-axis")
        .attr("transform", this.options.axisTransform);
    //添加时间轴点Group
    this.timePointsG = svg.append("g");
}

// 添加点击时间轴点的点击事件
TimeLine.prototype.setClickListener = function (listener) {
    this.onClick = listener;
}

// 设置起止日期
TimeLine.prototype.setDate = function (startDate, endDate) {
    let that = this; // 时间轴对象

    let _startDate = d3.timeDay(startDate); // 精确到天
    let _endDate = d3.timeDay(endDate);

    // 时间比例尺，函数
    // timeScale(date)得到某一时间在坐标轴上的映射关系
    let timeScale = d3.scaleTime()
        .domain([_startDate, _endDate])
        .range([0, 960]);
    // 时间坐标轴（函数）
    let timeAxis = d3.axisBottom()
        .scale(timeScale)
        .tickFormat(this.zhTimeFormat.format("%-m.%e"))
        .ticks(d3.timeDay.every(1));
    // 绘制选项
    let options = this.options;
    // 时间轴SVG
    /*-------- 添加时间轴 --------*/
    this.timeAxisG.transition().duration(400).delay(300).call(timeAxis); // 坐标轴变换动画
    /*-------- 添加时间轴点 --------*/
    // 初始化时间轴点上的时间
    let timePoints = [];
    for (let s = _startDate; s <= _endDate; s = this._addOneDay(s)) {
        timePoints.push(s);
    }
    let tp = this.timePointsG
        .selectAll("circle")
        .data(timePoints); // selection对象

    tp.exit().transition().duration(300).attr('r', 0).remove(); // 移去无用的
    tp.enter()
        .append("circle")
        .merge(tp) // merge一下
        .transition()
        .duration(400)
        .attr("cx", function (d) {
            return timeScale(d) + options.circleCxTranslate;
        })
        .attr("cy", options.circleCy)
        .attr("r", function (d, i) {
            if (i == 0) {
                return options.circleRadiusScale;
            } else {
                return options.circleRadiusNormal;
            }
        })
        .attr("fill", function (d, i) {
            if (i == 0) {
                return options.circleFillActive;
            } else {
                return options.circleFillNormal;
            }
        })
        .attr("cursor", "pointer")
        .attr("class", function (d, i) {
            if (i == 0) {
                return "time-point active";
            } else {
                return "time-point";
            }
        })
        .style("transition", "all 0.4s"); // 平滑过渡

    // 监听事件
    this.timePointsG
        .selectAll("circle")
        .on("mouseover", function () { // 鼠标悬停
            d3.select(this).attr("r", options.circleRadiusScale)
                .attr("fill", options.circleFillActive);
        }).on("mouseout", function () { // 鼠标移开
            if (!this.classList.contains("active")) {
                d3.select(this).attr("r", options.circleRadiusNormal)
                    .attr("fill", options.circleFillNormal);
            }
        }).on("click", function (date) { // 鼠标点击
            d3.selectAll(".time-point").attr("class", "time-point")
                .attr("r", options.circleRadiusNormal)
                .attr("fill", options.circleFillNormal);
            d3.select(this).attr("class", "time-point active").attr("r", options.circleRadiusScale)
                .attr("fill", options.circleFillActive);
            if (that.onClick)
                that.onClick(date);
        });
}
