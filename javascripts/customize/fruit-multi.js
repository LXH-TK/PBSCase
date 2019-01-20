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
    // 遮罩开关
    $("#maskSwitch").on("change", function () {
        if (!this.checked)
            mapbox.removeMask();
        else
            mapbox.addMask();
    });

    // 等待地图加载完毕，加载遮罩与加载数据
    mapbox.map.on("load", function () {
        mapbox.addMask();
        loadFile('data/20170301.csv');
    });
}

// 时间轴对象
var timeline = new TimeLine();
timeline.setDate(new Date(2017, 2, 1), new Date(2017, 2, 31));
timeline.setClickListener(function (date) {
    let file = d3.timeFormat("data/%Y%0m%0e.csv")(date);
    console.log(file);
    // 读取每一天的文件
    loadFile(file, date);
});

var mapbox = new MapBox("mapsvg");
var MS_PER_HOUR = 3600000;

var hoursDistribute = {}; // 一天中每个时间段的分布
var hoursNum = {};

// 加载文件函数，加载文件完毕之后的逻辑写在then里面
var loadFile = function (filename, date) {
    // 'data/20170314.csv'
    reset();

    d3.csv(filename, function (row) {
        // 对每一行数据操作
        let lat = parseFloat(row.lat);
        let lng = parseFloat(row.lng);

        let hour = new Date(Number(row.recitime)).getHours();
        if (!hoursDistribute.hasOwnProperty(hour)) {
            hoursDistribute[hour] = [];
        }
        hoursDistribute[hour].push({
            md5: row.md5,
            content: row.content,
            phone: row.phone,
            conntime: row.conntime,
            recitime: row.recitime,
            lng: lng,
            lat: lat
        });
        if (!hoursNum.hasOwnProperty(hour)) {
            hoursNum[hour] = 0;
        }
        hoursNum[hour] += 1;
    }).then(function () {
        Object.keys(hoursNum).forEach(function(k){
            let label = $("<label>").addClass("badge badge-info").html(k).attr("title", "总数：" + hoursNum[k]).attr("data-toggle", "tooltip").attr("data-placement", "top");
            let div = $("<div>").addClass("col-3").append(label);
            $("#time-container").append(div);
        });
        $("[data-toggle='tooltip']").tooltip();
        // 文件加载完成后的所有操作
        $(".badge").on("click", function () {
            mapbox.reset();
//            console.log("click");
            let _hour = this.innerText;
            let _data = hoursDistribute[_hour];
            if (_data) {
                let points = [];
                _data.forEach(function (d) {
                    points.push({
                        "coord": [d.lng, d.lat],
                        "color": "#F00",
                        "data": d
                    });
                });
                let geoPoints = mapbox.formGeoPointsWithProp(points);
                mapbox.drawPoints(geoPoints, {
                    id: "coords",
                    paint: {
                        "circle-radius": {
                            "base": 1.2,
                            "stops": [
                                [1, 2],
                                [10, 4],
                                [22, 10]
                            ]
                        },
                        "circle-color": "#8f75da"
                    }
                });
            }
        });
    });
}


var popup = new mapboxgl.Popup({
    className: "map-popup",
    closeButton: false,
    closeOnClick: false
});

// 地图鼠标悬停事件
var mapMouseEnterEvent = function (e) {
    // 鼠标模式
    let data = JSON.parse(e.features[0].properties.data);
    mapbox.map.getCanvas().style.cursor = 'pointer';

    var coordinates = e.features[0].geometry.coordinates.slice(); // 事件触发的经纬位置
    var description = "<strong>" + data.phone + // 文本信息
        "</strong><br>" + getFormattedTime(Number(data.recitime)) + "<br>" + data.content;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup.setLngLat(coordinates)
        .setHTML(description)
        .addTo(mapbox.map);
}
mapbox.map.on('mouseenter', 'coords', mapMouseEnterEvent);
mapbox.map.on('mouseenter', 'coords2', mapMouseEnterEvent);

mapbox.map.on('mouseleave', 'coords', function (e) {
    mapbox.map.getCanvas().style.cursor = '';
    popup.remove();
});
mapbox.map.on('mouseleave', 'coords2', function (e) {
    mapbox.map.getCanvas().style.cursor = '';
    popup.remove();
});

// 重置全局变量
var reset = function () {
    hoursDistribute = {}; // 一天中每个时间段的分布
    hoursNum = {};
    mapbox.reset();
    $("#time-container").html("");
}
// 获得随机颜色
var getRandomColor = function () {
    this.r = Math.floor(Math.random() * 255);
    this.g = Math.floor(Math.random() * 255);
    this.b = Math.floor(Math.random() * 255);
    return 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',1.0)';
}

// 构建Match Color
var formMatchColor = function () {
    let match = ['match', ['get', 'color']];
    Object.values(colors).forEach(function (c) {
        match.push(c);
        match.push(c);
    });
    match.push("#F00");
    return match;
}

var getFormattedTime = function (timestamp) {
    let date = new Date(timestamp);
    return timeline.zhTimeFormat.format("%X")(date);
}
