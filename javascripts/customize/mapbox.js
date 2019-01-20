// 地图相关操作对象
var MapBox = function (container) {
    // 公共token
    mapboxgl.accessToken = 'pk.eyJ1IjoiZ2l6IiwiYSI6ImNqcXp4NTlsZTA0NzIzem85c2xyODg4czEifQ.0-ohyE_V9a2ElFMSJV_3Bw';
    this.map = new mapboxgl.Map({
        container: container,
        style: 'mapbox://styles/mapbox/streets-v11', // streets是样式名称，还有dark,light(v9才行)等等
        center: [116.461930, 40.249352],
        zoom: 7.5,
        minZoom: 7.5
    });

    // this.map.on("load", this.addMask);

    this.customLayers = [];
    this.markers = [];
    this._arrowLayerId = "arrow-layer";
}
MapBox.prototype = {
    // 添加北京市地图遮罩
    _initMask: function () {
        let map = this;
        map.addSource("bj-geojson", {
            type: "geojson",
            data: beijing_geojson
        });

        map.addLayer({ // 添加图层
            "id": "bj-mask",
            "type": "fill",
            "source": "bj-geojson", // Geojson地图资源ID
            "paint": {
                "fill-color": "#888888",
                "fill-opacity": 0.4,
                "fill-outline-color": "#727cf5"
            },
            "filter": ["==", "$type", "Polygon"]
        });
    },
    addMask: function () {
        this.map.addLayer({
            type: "fill",
            id: "bj-mask",
            source: {
                type: "geojson",
                data: beijing_geojson
            },
            paint: {
                "fill-color": "#888",
                "fill-opacity": 0.4,
                "fill-outline-color": "#727cf5"
            },
            "filter": ["==", "$type", "Polygon"]
        });
    },
    // 移除遮罩
    removeMask: function () {
        this.map.removeLayer("bj-mask");
        this.map.removeSource("bj-mask");
    },
    // 创建一个geojson格式的点
    // coord：点坐标
    // prop：属性（可选）
    _formGeoPoint: function (coord, prop = {}) {
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": coord
            },
            "properties": prop
        };
    },
    // 传入一组点的经纬度坐标，转换成geojson格式
    // pointsArray: [[lng, lat], [lng, lat], ...]
    formGeoPoints: function (pointsArray) {
        let that = this;
        let geojson = {
            "type": "FeatureCollection",
            "features": []
        };
        pointsArray.forEach(function (p) {
            geojson.features.push(that._formGeoPoint(p));
        });
        return geojson;
    },
    // 传入一组点的属性，转换成geojson格式
    /* points: [{
        coord: [lng, lat],
        title: "title",
        content: "content",
        color: "#F00"
    }, {}, ...]
    */
    formGeoPointsWithProp: function (points) {
        let that = this;
        let geojson = {
            "type": "FeatureCollection",
            "features": []
        };
        points.forEach(function (p) {
            geojson.features.push(that._formGeoPoint(p.coord, {
                "data": p.data,
                "color": p.color ? p.color : "#F00"
            }));
        });

        return geojson;
    },
    // 传入一组点的经纬度坐标，转换成geojson格式的线段
    // pointsArray: [[lng, lat], [lng, lat], ...]
    formLineString: function (points) {
        let geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": points
                },
                "properties": {}
            }]
        };
        return geojson;
    },
    // 在地图上画点
    // points：geojson格式的点组信息
    /* options: {
        "id": 图层ID,
        "paint": 绘制属性
    }*/
    drawPoints: function (points, options) {
        this.map.addLayer({
            "id": options.id,
            "type": "circle",
            "source": {
                "type": "geojson",
                "data": points
            },
            "paint": options.paint,
            "filter": ["==", "$type", "Point"]
        });
        this.customLayers.push(options.id);
    },
    // 在地图上画线段
    // line：geojson格式的线段信息
    /* options: {
        "id": 图层ID,
        "paint": 绘制属性
    }*/
    drawLine: function (line, options) {
        this.map.addLayer({
            "id": options.id,
            "type": "line",
            "source": {
                "type": "geojson",
                "data": line
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": options.paint
        });
        
        this.customLayers.push(options.id);
    },
    drawArrowLayer: function (lineData) {
        let mapbox = this;
        if (mapbox.map.hasImage("arrow")) {
            mapbox._drawArrow(lineData, mapbox._arrowLayerId);
        } else {
            mapbox.map.loadImage("assets/arrow.png", function (err, image) {
                if (err) {
                    console.error('err image', err);
                    return;
                }
                mapbox.map.addImage('arrow', image);
                mapbox._drawArrow(lineData, mapbox._arrowLayerId);
            });
        }
    },
    // 在指定地标位置绘制一个图标（地标）
    // coord: 经纬度坐标
    drawSymbol: function(coord){
        let mapbox = this;
        let el = $("<div>").addClass("marker").css("backgroundImage", "url(assets/arrow.png")
                        .css("width", "64px").css("height", "64px");
        // console.log(el);
        let marker = new mapboxgl.Marker()
                    .setLngLat(coord)
                    .addTo(mapbox.map);
        this.markers.push(marker);
    },
    // 绘制提示框
    // coord: 经纬度坐标
    // text: 信息
    drawPopup: function(coord, text){
        let that = this;
        new mapboxgl.Popup({closeOnClick: false})
                    .setLngLat(coord)
                    .setHTML(text)
                    .addTo(that.map);
    },
    // 删除一个图层
    removeLayer: function (layerID) {
        if (this.customLayers.includes(layerID)) {
            this.map.removeLayer(layerID);
            this.map.removeSource(layerID);
            let idx = this.customLayers.indexOf(layerID);
            this.customLayers.splice(idx, 1);
        }
    },
    removeArrowLayer: function(){
        if(this.map.getLayer(this._arrowLayerId))
            this.map.removeLayer(this._arrowLayerId);
    },
    // 重置
    reset: function () {
        let that = this;
        this.customLayers.forEach(function (layer) {
            that.map.removeLayer(layer);
            that.map.removeSource(layer);
        });
        this.customLayers = [];
        
        if(this.map.getLayer(this._arrowLayerId)){
            this.map.removeLayer(this._arrowLayerId);
            this.map.removeSource(this._arrowLayerId);
        }
        this.markers.forEach(function(m){
            m.remove();
        });
    },
    _drawArrow: function (lineData, id) {
        this.map.addLayer({
            'id': this._arrowLayerId,
            'type': 'symbol',
            'source': {
                "type": "geojson",
                "data": lineData
            },
            'layout': {
                'symbol-placement': 'line',
                'symbol-spacing': 1,
                'icon-allow-overlap': true,
                // 'icon-ignore-placement': true,
                'icon-image': 'arrow',
                'icon-size': 0.044,
                'visibility': 'visible'
            }
        });
    }
}
/*-------- paint相关 --------
1.实心圆
"paint": {
            "circle-radius": 10,            半径
            "circle-color": "#007cbf",      填充颜色
            "circle-opacity": 0.5,          实心透明度
            "circle-stroke-width": 0,       轮廓宽度
        }
2.空心圆
"paint": {
            "circle-radius": 20,                半径
            "circle-opacity": 0,                实心透明度为0
            "circle-stroke-width": 1,           轮廓宽度
            "circle-stroke-color": "#00bf7c",   轮廓颜色
            "circle-stroke-opacity": 1,         轮廓透明度
        }
3.线段
"paint: {
            "line-color": "#888",               线段颜色
            "line-width": 8                     线段宽度
        }
"layout": {
             "line-join":
             "line-cap":
          }
4.填充
"paint": {
            "fill-color": "#FFF",               填充颜色
            "fill-opacity": 0.4                 透明度
         }
--------   分割符  --------*/
