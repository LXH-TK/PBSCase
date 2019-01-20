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
    loadFile(file);
});

var mapbox = new MapBox("mapsvg");

var tooltip = $("#tooltip"); // 搜索框jquery对象

var data = {}; // 以电话号码为键的数据集
var attrs = []; // 性质
var hoursDistribute = {}; // 一天中每个时间段的分布
var coordsArray = []; // 所有点的坐标
var pointsWithProp = []; // 带属性的坐标
var colors = {}; // 颜色集
var link = {}; // 地图上的点与侧面电话号码的联系（存储的是jquery对象） {"phone": node, ...}

// 加载文件函数，加载文件完毕之后的逻辑写在then里面
var loadFile = function (filename) {
    // 'data/20170314.csv'
    reset();

    d3.csv(filename, function (row) {
        // 对每一行数据操作
        let lat = parseFloat(row.lat);
        let lng = parseFloat(row.lng);
        if (!data[row.phone]) {
            data[row.phone] = {
                "data": [],
                "minlat": lat,
                "maxlat": lat,
                "minlng": lng,
                "maxlng": lng
            };
        }
        coordsArray.push([Number(row.lng), Number(row.lat)]);
        if (!colors.hasOwnProperty(row.phone)) {
            colors[row.phone] = getRandomColor();
        }
        pointsWithProp.push({
            coord: [Number(row.lng), Number(row.lat)],
            color: colors[row.phone],
            data: row
        });
        data[row.phone]["data"].push({
            md5: row.md5,
            content: row.content,
            phone: row.phone,
            conntime: row.conntime,
            recitime: row.recitime,
            lng: lng,
            lat: lat
        });
        if (lat < data[row.phone]["minlat"])
            data[row.phone]["minlat"] = lat;
        else if (lat > data[row.phone]["maxlat"])
            data[row.phone]["maxlat"] = lat;
        if (lng < data[row.phone]["minlng"])
            data[row.phone]["minlng"] = lng;
        else if (lng > data[row.phone]["maxlng"])
            data[row.phone]["maxlng"] = lng;

        let hour = new Date(Number(row.recitime)).getHours();
        if (!hoursDistribute.hasOwnProperty(hour)) {
            hoursDistribute[hour] = 0;
        } else {
            hoursDistribute[hour] += 1;
        }
    }).then(function () {
        // 文件加载完成后的所有操作
        for (let key in data) {
            attrs.push({
                "phone": key,
                "content": data[key].data[0].content,
                "minlat": data[key]["minlat"],
                "maxlat": data[key]["maxlat"],
                "minlng": data[key]["minlng"],
                "maxlng": data[key]["maxlng"]
            });
        }

        let points = mapbox.formGeoPointsWithProp(pointsWithProp);
        let match = formMatchColor();
        mapbox.drawPoints(points, {
            id: "coords",
            paint: {
                "circle-radius": {
                    "stops": [
                        [1, 2],
                        [10, 4],
                        [22, 10]
                    ]
                },
                "circle-color": match
            }
        });

        // 电话点阵列表
        let oddDotsList = $(".dot-list").eq(0);
        let evenDotsList = $(".dot-list").eq(1);
        Object.keys(data).forEach(function (phone, idx) {
            let newI = $("<i>").addClass("fas fa-circle").css("color", colors[phone]);
            let node = $("<li>").addClass("pl-2").append(newI);
            node.html(node.html() + phone);
            node.attr("data-toggle", "tooltip").attr("data-placement", "top").attr("title", "数目：" + data[phone].data.length);

            if (idx % 2 != 0) { // 奇数
                oddDotsList.append(node);
            } else {
                evenDotsList.append(node);
            }
            link[phone] = node;
        });

        $('[data-toggle="tooltip"]').tooltip(); // 初始化tooltip
        let _pc = $("#phone-card")[0];
        let h = _pc.offsetHeight / _pc.scrollHeight * _pc.offsetHeight;
        $("#slimScrollBar").css("height", h + "px"); // 计算滚动条高度
        //        $(".dot-list li").on("mousemove", function (e) {
        //            tooltip.css("left", e.clientX + 16 + "px").css("top", e.clientY + 16 + "px")
        //                .css("display", "block").html(data[this.innerText].data.length);
        //
        //        });
        //        $(".dot-list li").on("mouseout", function (e) {
        //            tooltip.css("display", "none");
        //        });
        $(".dot-list li").on("click", function () {
            // 点击电话进入具体基站的空间信息
            //            if (mapbox.map.getLayer("coords"))
            //                mapbox.map.removeLayer("coords");
            mapbox.reset();

            let _color = $(this).children().css("color");
            let newPoints = [];
            let pointsForLine = []; // 用来画线的点组
            let recitimes = []; // 接收时间列表，用于对点进行排序
            data[this.innerText].data.forEach(function (d) {
                newPoints.push({
                    coord: [d.lng, d.lat],
                    color: _color,
                    data: d
                });
                let _rt = Number(d.recitime);
                recitimes.push(Number(d.recitime));
                recitimes.sort(function (a, b) { // 从小到大排序
                    return a - b;
                });
                let idx = recitimes.lastIndexOf(_rt);
                pointsForLine.splice(idx, 0, [d.lng, d.lat]); // 在这里插入点，保持顺序对应
            });
            let _p = mapbox.formGeoPointsWithProp(newPoints);
            // 点
            mapbox.drawPoints(_p, {
                "id": "coords2",
                "paint": {
                    "circle-radius": {
                        'base': 1.2,
                        'stops': [
                            [1, 1],
                            [6, 3],
                            [10, 7],
                            [22, 12]
                        ]
                    },
                    "circle-color": _color
                }
            });
            // 线
            //            console.log(recitimes, pointsForLine);
            let _line = mapbox.formLineString(pointsForLine);
            mapbox.drawLine(_line, {
                "id": "lines",
                "paint": {
                    "line-color": "#8f75da",
                    "line-opacity": 0.8,
                    "line-width": {
                        'base': 1,
                        'stops': [
                            [1, 0.5],
                            [8, 2],
                            [15, 4],
                            [22, 6]
                        ]
                    }
                }
            });
            mapbox.drawArrowLayer(_line);
            // 开始点和终止点
            mapbox.drawSymbol(pointsForLine[0]);
            mapbox.drawSymbol(pointsForLine[pointsForLine.length - 1]);

            $("#dot-list-con").addClass("hide");
            $("#detail-con").removeClass("hide");
            $("#detail-phone").html(this.innerText);
            $("#anim-btn").on("click", function(){
                animateLine(pointsForLine);
            });
            $("#back-btn").on("click", function(){
                $("#dot-list-con").removeClass("hide");
                $("#detail-con").addClass("hide");
            });
            $("#hideline-btn").on("click", function(){
                if(this.innerText == "隐藏直线"){
                    mapbox.map.setLayoutProperty("lines", "visibility", "none");
                    mapbox.map.setLayoutProperty(mapbox._arrowLayerId, "visibility", "none");
                    this.innerText = "显示直线";
                }
                else{
                    mapbox.map.setLayoutProperty(mapbox._arrowLayerId, "visibility", "visible");
                    mapbox.map.setLayoutProperty("lines", "visibility", "none");
                    this.innerText = "隐藏直线";
                }
            });
            // 热力图
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

    let node = link[data.phone];
    node[0].scrollIntoView({
        behavior: "smooth",
        block: "center", // 垂直方向
        inline: "nearest" // 水平方向
    })
    node.css("background", "#EEE").css("border-radius", "4px");
}
mapbox.map.on('mouseenter', 'coords', mapMouseEnterEvent);
mapbox.map.on('mouseenter', 'coords2', mapMouseEnterEvent);

mapbox.map.on('mouseleave', 'coords', function (e) {
    mapbox.map.getCanvas().style.cursor = '';
    popup.remove();

    $(".dot-list li").css("background", "").css("border-radius", "");
});
mapbox.map.on('mouseleave', 'coords2', function (e) {
    mapbox.map.getCanvas().style.cursor = '';
    popup.remove();

    $(".dot-list li").css("background", "").css("border-radius", "");
});

// 重置全局变量
var reset = function () {
    data = {};
    attrs = [];
    hoursDistribute = {};
    coordsArray = [];
    pointsWithProp = [];
    colors = {};
    link = {};
    mapbox.reset();
    $(".dot-list").html("");
    cancelAnimationFrame(animation); // 取消动画
    animation = null;
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

var animation;
var animateLine = function (points) {
    let _interPoints = [];
//    console.log(points);
    points.forEach(function (p, i) {
        if (i != points.length - 1) {
            let t_x = points[i + 1][0] - p[0];
            let t_y = points[i + 1][1] - p[1];
            if (t_x < 1e-8 && t_y < 1e-8) {
                _interPoints.push(p);
                return;
            }
            let _xb = Math.sqrt(t_x * t_x + t_y * t_y);
            let _level = Math.ceil(_xb / 0.001);
            let _delta = 1 / _level;
            for (let idx = 0; idx < _level; idx++) {
                t_x = (1 - idx * _delta) * p[0] + idx * _delta * points[i + 1][0];
                t_y = (1 - idx * _delta) * p[1] + idx * _delta * points[i + 1][1];
                _interPoints.push([t_x, t_y]);
            }
        }
    });
    _interPoints.push(points[points.length - 1]);

//    console.log(_interPoints);
    let geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    points[0]
                ]
            }
        }]
    };

    let idx = 0;

    // 添加直线图层
    mapbox.removeLayer("line-animation");
    mapbox.map.addLayer({
        'id': 'line-animation',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'data': geojson
        },
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#ed6498',
            'line-width': 5,
            'line-opacity': .8
        }
    });
    mapbox.customLayers.push('line-animation');

    animateLine();

    //    pauseButton.addEventListener('click', function () {
    //        pauseButton.classList.toggle('pause');
    //        if (pauseButton.classList.contains('pause')) {
    //            cancelAnimationFrame(animation);
    //        } else {
    //            resetTime = true;
    //            animateLine();
    //        }
    //    });    
    function animateLine(timestamp) {
        // 重新开始
        if (idx >= _interPoints.length) {
            idx = 0;
            return;
            geojson.features[0].geometry.coordinates = [];
        } else {
            // 添加新的点
            geojson.features[0].geometry.coordinates.push(_interPoints[idx]);
            idx += 1;
            // 更新地图
            mapbox.map.getSource('line-animation').setData(geojson);
        }
        // 绘制下一帧
        animation = requestAnimationFrame(animateLine);
    }
}
