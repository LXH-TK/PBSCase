/**
 * DONE
 * 热力图，一天的时间段内垃圾信息数量，悬停查看具体信息
 * 柱状图，五种垃圾信息随时间的数量变化趋势
 * 均伴随有动画效果和一定的交互
 */
window.onload = function () {
    // 折叠菜单
    $(".collapse-toggler").on("click", function () {
        let icon = $(this).children("i")[1];
        if (icon.classList.contains("rotate-icon")) {
            // 收回
            $(icon).removeClass("rotate-icon");
        } else {
            $(icon).addClass("rotate-icon");
        }
    });

    // “月份”折叠菜单项
    $("#monthNav a").on("click", function () {
        $("#monthNav li").removeClass("active");
        $(this).parent("li").addClass("active");
        let month = this.title;
        //        $("#timeline").html("");
        if (month == "2月") {
            loadFile('data/20170223.csv');
            timeline.setDate(new Date(2017, 1, 23), new Date(2017, 1, 28));
        } else if (month == "3月") {
            loadFile('data/20170301.csv');
            timeline.setDate(new Date(2017, 2, 1), new Date(2017, 2, 31));
        } else {
            loadFile('data/20170401.csv');
            timeline.setDate(new Date(2017, 3, 1), new Date(2017, 3, 26));
        }
    });

    loadFile('data/20170301.csv');
};

// 切换日期即切换数据
var timeline = new TimeLine();
timeline.setDate(new Date(2017, 2, 1), new Date(2017, 2, 31));
timeline.setClickListener(function (date) {
    let file = d3.timeFormat("data/%Y%0m%0e.csv")(date);
    console.log(file);
    // 读取每一天的文件
    loadFile(file);
});

// 关键词（根据jieba得出）
var cheat = ["银行", "积分", "信用卡", "观众", "用户"],
    receipt = ["发票", "代开", "發", "开票", "票据", "报销"],
    blue = ["上门", "学生妹"],
    adver = ["平米", "楼", "【", "房"];
// 保存每个时间段的各种垃圾信息数量
var cheatNum = new Array(16),
    receiptNum = new Array(16),
    blueNum = new Array(16),
    adverNum = new Array(16),
    otherNum = new Array(16);
// 热力图和柱状图的宽度信息
var heatsvgWidth = document.getElementById("heatsvg").clientWidth,
    width = heatsvgWidth;
// 柱状图
var layout,
    heightC = 500, // column的高度
    padding = {
        left: 50,
        top: 30,
        right: 50,
        bottom: 100
    };
// 颜色
var buckets = 9, // 9种颜色级别
    colorSegment,
    colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];

var loadFile = function (filename) {

    $("#heatsvg").html("");
    $("#columnsvg").html("");

    for (var j = 0; j < 16; j++) {
        cheatNum[j] = 0;
        receiptNum[j] = 0;
        blueNum[j] = 0;
        adverNum[j] = 0;
        otherNum[j] = 0;
    }
    // 初始化时间数组即横轴
    var time = [];
    // 初始化计数器
    var count = [];
    for (var i = 0; i < 16; i++) {
        time.push([(i + 5).toString(), 0]);
    }

    // 一句话定义了众多变量， 定义了块儿的位置、宽高、小格子的边长等等与布局有关的变量
    var margin = {
            top: 50,
            bottom: 100
        },
        heightH = 100, // heatmap的高度
        blockSize = Math.floor(width / 24), // 求地板，即去掉小数部分，width分成24份
        legendWidth = blockSize * 1.5; // 图例长度

    d3.csv(filename, function (row) {
        return {
            content: row.content,
            recitime: row.recitime
        };
    }).then(function (data) {
        data.forEach(function (d, i) {
            // 格式转化，共计14个时间段
            var hour = new Date(parseInt(d.recitime)).getHours();
            // 统计数目
            if (hour <= 5) {
                time[0][1]++;
                judgeType(d, 0);
            } else if (hour >= 20) {
                time[15][1]++;
                judgeType(d, 15);
            } else {
                time[hour - 5][1]++;
                judgeType(d, hour - 5);
            }
        });

        count = getCol(time, 1);

        // 值域
        colorSegment = d3.scale.quantile() // 按分位数取值，可使每个区域内元素个数相等
            .domain([1000, buckets - 1, d3.max(count, function (d, i) {
                return count[i];
            })]) // 定义域
            .range(colors);

        // 绘制Heatmap，通过计算位于中间
        var TK = d3.select("#heatsvg")
            .append("svg")
            .attr("width", width)
            .attr("height", heightH + margin.top + margin.bottom)
            .append("g") // 加入一个group组，并设置g的显示位置
            .attr("transform", "translate(" + (width - 16 * blockSize) / 2 + "," + margin.top + ")");
        var textTop = TK.append("text")
            .style("text-anchor", "middle")
            .attr("x", -100)
            .attr("y", -20)
            .text("共计" + d3.sum(count) + "条垃圾短信");
        var textBottom1 = TK.append("text")
            .style("text-anchor", "middle")
            .attr("x", -100)
            .attr("y", 20);
        var textBottom2 = TK.append("text")
            .style("text-anchor", "middle")
            .attr("x", -100)
            .attr("y", 45);
        var textBottom3 = TK.append("text")
            .style("text-anchor", "middle")
            .attr("x", -100)
            .attr("y", 70);
        var textBottom4 = TK.append("text")
            .style("text-anchor", "middle")
            .attr("x", -100)
            .attr("y", 95);
        var textBottom5 = TK.append("text")
            .style("text-anchor", "middle")
            .attr("x", -100)
            .attr("y", 120);
        // 横坐标
        var timeSegment = TK.selectAll(".timeSegment")
            .data(getCol(time, 0))
            .enter().append("text")
            .text(function (d) {
                return d;
            })
            .attr("x", function (d, i) {
                return i * blockSize;
            })
            .attr("y", 0)
            .style("text-anchor", "middle") // 字居中、位置设置
            .attr("transform", "translate(" + blockSize / 2 + ", -6)")
            .attr("class", "timeSegment");
        // 格子上色及交互事件
        var heatMap = TK.selectAll(".score")
            .data(count)
            .enter().append("rect")
            .attr("x", function (d, i) {
                return (i % 16) * blockSize;
            })
            .attr("rx", 10) // 弧度
            .attr("ry", 20)
            .attr("width", blockSize)
            .attr("height", blockSize)
            .style("fill", "#FFFFFF")
            .on("mouseover", function (d, i) {
                d3.select(this).transition()
                    .duration(200)
                    .attr("y", -5);
                textTop.text("共计" + d + "条消息");
                textBottom1.text("诈骗类  " + cheatNum[i] + "条");
                textBottom2.text("色情类  " + blueNum[i] + "条");
                textBottom3.text("广告类  " + adverNum[i] + "条");
                textBottom4.text("票据类  " + receiptNum[i] + "条");
                textBottom5.text("其他类  " + otherNum[i] + "条");
            })
            .on("mouseout", function (d) {
                d3.select(this).transition()
                    .duration(100)
                    .attr("y", 0);
                textTop.text("共计" + d3.sum(count) + "条消息");
                textBottom1.text("");
                textBottom2.text("");
                textBottom3.text("");
                textBottom4.text("");
                textBottom5.text("");
            });
        heatMap.transition().duration(3000) // 渐变效果
            .style("fill", function (d) {
                return colorSegment(d);
            });

        // 图例绘制
        var legend = TK.selectAll("#heatsvg")
            .data([0].concat(colorSegment.quantiles()), function (d) {
                return d;
            })
            .enter().append("g");
        legend.append("rect") // 字居中、位置设置
            .attr("x", function (d, i) {
                return (legendWidth * i) + (16 * blockSize - 9 * legendWidth) / 2;
            })
            .attr("y", heightH)
            .attr("width", legendWidth)
            .attr("height", blockSize / 2)
            .style("fill", function (d, i) {
                return colors[i];
            });
        legend.append("text")
            .text(function (d) {
                // console.log(Math.round(d));
                return ">=" + Math.round(d);
            })
            .style("text-anchor", "middle") // 字居中、位置设置
            .attr("x", function (d, i) {
                return (legendWidth * i) + (16 * blockSize - 9 * legendWidth) / 2 + (legendWidth / 2);
            })
            .attr("y", heightH + blockSize);

        // 默认进入cheat模式
        updateLayout("cheat");

        // 监听切换类型显示按钮
        d3.selectAll(".btn")
            .on("click", function () {
                updateLayout(this.id);
            });
    })
};

// 绘制或更新柱状图的信息
function updateLayout(id) {
    console.log(id);
    $("#columnsvg").html("");

    var scaleX = d3.scaleBand()
        .domain([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]).rangeRound([0, width - padding.right - padding.left])
        .padding(0.3),
        scaleY;
    var chart;

    // 柱形图绘制
    layout = d3.select('#columnsvg')
        .append('svg')
        .attr('width', width + padding.left)
        .attr('height', heightC + padding.bottom);
    var g = layout.append('g')
        .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')');

    // 条件判断
    if (id === "cheat") {
        scaleY = d3.scaleLinear()
            .domain([0, d3.max(cheatNum)]).rangeRound([heightC, 0]);
        chart = g.selectAll('.bar')
            .data(cheatNum).enter()
            .append('g');
    } else if (id === "blue") {
        scaleY = d3.scaleLinear()
            .domain([0, d3.max(blueNum)]).rangeRound([heightC, 0]);
        chart = g.selectAll('.bar')
            .data(blueNum).enter()
            .append('g');
    } else if (id === "ad") {
        scaleY = d3.scaleLinear()
            .domain([0, d3.max(adverNum)]).rangeRound([heightC, 0]);
        chart = g.selectAll('.bar')
            .data(adverNum).enter()
            .append('g');
    } else if (id === "receipt") {
        scaleY = d3.scaleLinear()
            .domain([0, d3.max(receiptNum)]).rangeRound([heightC, 0]);
        chart = g.selectAll('.bar')
            .data(receiptNum).enter()
            .append('g');
    } else {
        scaleY = d3.scaleLinear()
            .domain([0, d3.max(otherNum)]).rangeRound([heightC, 0]);
        chart = g.selectAll('.bar')
            .data(otherNum).enter()
            .append('g');
    }

    // x轴和y轴
    g.append('g')
        .attr('transform', 'translate(0,' + heightC + ')')
        .call(d3.axisBottom(scaleX));
    g.append('g')
        .call(d3.axisLeft(scaleY).ticks(10));

    // 矩形
    chart.append('rect')
        .attr('x', function (d, i) {
            return scaleX(i + 5);
        })
        .attr('y', function (d) {
            return scaleY(scaleY.domain()[0]) - 5;
        })
        .attr('fill', function (d) {
            return colorSegment(d);
        })
        .attr('stroke', '#FFF').attr('stroke-width', '3px')
        .transition() // 动画部分
        .delay(function (d, i) {
            return (i + 1) * 50
        })
        .duration(2000).ease(d3.easeBounceIn)
        .attr('y', function (d) {
            return scaleY(d) - 5;
        })
        .attr('width', scaleX.bandwidth())
        .attr('height', function (d) {
            return heightC - scaleY(d);
        });
    // 文字
    chart.append('text').attr('fill', '#000')
        .attr('x', function (d, i) {
            return scaleX(i + 5) + 5;
        })
        .attr('y', function (d) {
            return scaleY(scaleY.domain()[0]) - 30;
        })
        .transition()
        .delay(function (d, i) {
            return (i + 1) * 70
        }) // 追随矩形运动
        .duration(2000).ease(d3.easeBounceIn) // 逆弹跳缓动，多种参数可选择
        .attr('y', function (d) {
            return scaleY(d) - 30;
        })
        .attr('dx', function (d) {
            return (scaleX.bandwidth() - padding.left) / 2;
        })
        .attr('dy', 20)
        .text(function (d) {
            return d
        });
}


// 获取二维数组一列
function getCol(matrix, col) {
    var column = [];
    for (var i = 0; i < matrix.length; i++) {
        column.push(matrix[i][col]);
    }
    return column;
}

// 判断垃圾信息类型
function judgeType(d, hour) {
    if (d.content.indexOf(blue[0]) !== -1 ||
        d.content.indexOf(blue[1]) !== -1)
        blueNum[hour] = (blueNum[hour] || 0) + 1;
    else if (d.content.indexOf(cheat[0]) !== -1 ||
        d.content.indexOf(cheat[1]) !== -1 ||
        d.content.indexOf(cheat[2]) !== -1 ||
        d.content.indexOf(cheat[3]) !== -1 ||
        d.content.indexOf(cheat[4]) !== -1)
        cheatNum[hour] = (cheatNum[hour] || 0) + 1;
    else if (d.content.indexOf(receipt[0]) !== -1 ||
        d.content.indexOf(receipt[1]) !== -1 ||
        d.content.indexOf(receipt[2]) !== -1 ||
        d.content.indexOf(receipt[3]) !== -1 ||
        d.content.indexOf(receipt[4]) !== -1 ||
        d.content.indexOf(receipt[5]) !== -1)
        receiptNum[hour] = (receiptNum[hour] || 0) + 1;
    else if (d.content.indexOf(adver[0]) !== -1 ||
        d.content.indexOf(adver[1]) !== -1 ||
        d.content.indexOf(adver[2]) !== -1 ||
        d.content.indexOf(adver[3]) !== -1)
        adverNum[hour] = (adverNum[hour] || 0) + 1;
    else {
        otherNum[hour] = (otherNum[hour] || 0) + 1;
    }
}
