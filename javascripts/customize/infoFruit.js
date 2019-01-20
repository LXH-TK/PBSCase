/**
 * DONE
 * 每一天各种垃圾信息的比例，两种方式呈现，有一定的交互
 * 实时输出最高比率的关键词，即能够查看由python分词出的效果（通过先跑一遍python实现）
 * TODO 用户自己编辑关键词进行交互（从而改变词云和饼图）
 */
// tags关键词

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
    let jsonFile = d3.timeFormat("keyword/%Y%0m%0e.json")(date);
    // 读取每一天的文件
    
    tags = [];
    d3.json(jsonFile).then(function (d, i) {
        tags.push(d);
        tags = tags[0];
        loadFile(file);
    });
});

var layout;
var tags = [];
var loadFile = function (filename) {
    // 数据重置
    // 分五类：票据、诈骗、色情、广告、其他
    var cheatNum = 0,
        receiptNum = 0,
        blueNum = 0,
        adverNum = 0,
        otherNum = 0,
        totalNum = 0;
    var cheat = ["银行", "积分", "信用卡", "观众", "用户"];
    var receipt = ["发票", "代开", "發", "开票", "票据", "报销"];
    var blue = ["上门", "学生妹"];
    var adver = ["平米", "楼", "【", "房"];
    var colors = ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"];
    $("#piesvg").html("");
    $("#cloudsvg").html("");

    d3.csv(filename, function (row) {
        return {
            content: row.content,
        };
    }).then(function (data) {
        data.forEach(function (d, i) {

            // 词频统计
            if (d.content.indexOf(blue[0]) !== -1 ||
                d.content.indexOf(blue[1]) !== -1)
                blueNum++;
            else if (d.content.indexOf(cheat[0]) !== -1 ||
                d.content.indexOf(cheat[1]) !== -1 ||
                d.content.indexOf(cheat[2]) !== -1 ||
                d.content.indexOf(cheat[3]) !== -1 ||
                d.content.indexOf(cheat[4]) !== -1)
                cheatNum++;
            else if (d.content.indexOf(receipt[0]) !== -1 ||
                d.content.indexOf(receipt[1]) !== -1 ||
                d.content.indexOf(receipt[2]) !== -1 ||
                d.content.indexOf(receipt[3]) !== -1 ||
                d.content.indexOf(receipt[4]) !== -1 ||
                d.content.indexOf(receipt[5]) !== -1)
                receiptNum++;
            else if (d.content.indexOf(adver[0]) !== -1 ||
                d.content.indexOf(adver[1]) !== -1 ||
                d.content.indexOf(adver[2]) !== -1 ||
                d.content.indexOf(adver[3]) !== -1)
                adverNum++;
            else {
                otherNum++;
            }

            totalNum++;
        });

        // 饼图长宽内外半径
        var w = 400,
            h = 400,
            outer = 180,
            inner = 70;
        var pieData = [
            {
                "key": "色情服务",
                "value": blueNum
            },
            {
                "key": "票据服务",
                "value": receiptNum
            },
            {
                "key": "诈骗",
                "value": cheatNum
            },
            {
                "key": "广告",
                "value": adverNum
            },
            {
                "key": "其他",
                "value": otherNum
            }];
        // 总数据条数
        var total = totalNum;

        // 饼图
        var TK = d3.select("#piesvg")
            .append("svg:svg")
            .data([pieData])
            .attr("width", w)
            .attr("height", h)
            .append("svg:g")
            .attr("transform", "translate(" + outer * 1.1 + "," + outer * 1.1 + ")")

        // 弧生成器
        var textTop = TK.append("text")
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .attr("class", "textTop")
            .text("共计")
            .attr("y", -10),
            textBottom = TK.append("text")
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .attr("class", "textBottom")
            .text(total + "条")
            .attr("y", 10);
        var arc = d3.arc() // 设置内外半径
            .innerRadius(inner)
            .outerRadius(outer);
        var pieHover = d3.arc() // 鼠标悬停内外半径
            .innerRadius(inner + 7)
            .outerRadius(outer + 7);

        // 绘制饼图及饼图交互事件
        var pie = d3.layout.pie()
            .value(function (d) {
                return d.value;
            });
        var sector = TK.selectAll("g")
            .data(pie)
            .enter().append("svg:g")
            .on("mouseover", function (d) {
                d3.select(this).select("path").transition()
                    .duration(300)
                    .attr("d", pieHover);
                textTop.text(d3.select(this).datum().data.key) // 获取或设置元素的数据（不绑定）
                    .attr("y", -10); // 否则会数据无法显示
                textBottom.text(d3.select(this).datum().data.value)
                    .attr("y", 10);
            })
            .on("mouseout", function (d) {
                d3.select(this).select("path").transition()
                    .duration(100)
                    .attr("d", arc);
                textTop.text("共计")
                    .attr("y", -10);
                textBottom.text(total + "条");
            });
        sector.append("svg:path")
            .attr("fill", function (d, i) {
                return colors[i];
            })
            .attr("d", arc);

        // 饼图图例
        var legend = d3.select("#piesvg")
            .append("svg")
            .attr("width", w)
            .attr("height", 100)
            .selectAll("g")
            .data(pieData)
            .enter().append("g") // 获得enter选择器（数据无元素）
            .attr("transform", function (d, i) {
                // 计算布局
                return "translate(" + (i > 1 ? (i - 2) * 116 + 53 : i * 165 + 70) + ", " + (i > 1 ? 70 : 20) + ")";
            });
        // 添加颜色框
        legend.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", function (d, i) {
                return colors[i];
            });
        // 添加文本说明
        legend.append("text")
            .attr("x", 30) // 与颜色框横间隔
            .attr("y", 10) // 与颜色框纵间隔
            .attr("dy", ".35em")
            .text(function (d) {
                return d.key;
            });


        // 词云图
        layout = d3.layout.cloud()
            .size([650, 500]) // SVG大小
            .words(tags); // 包含key和value，即词与词频，选前20个

        layout
            .padding(5)
            .rotate(function () {
                return ~~(Math.random() * 2) * 90;
            })
            .font("Impact")
            .fontSize(function (d) {
                return d.value * 100;
            })
            .on("end", draw);

        layout.start();
    })
};

function draw(words) {
    d3.select("#cloudsvg")
        .append("svg")
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
        .selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", function (d) {
            return d.value * 100 + "px";
        })
        .style("font-family", "Impact")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function (d) {
            return d.key;
        });
}
