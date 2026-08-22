import './style.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import OSM from 'ol/source/OSM.js';

import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';

import Draw from 'ol/interaction/Draw.js';

import { fromLonLat } from 'ol/proj.js';

import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';


const source = new VectorSource();


const vectorLayer = new VectorLayer({
  source: source,

  style: function (feature) {

    const type = feature.get('type');

    if (type === 'company') {

      return new Style({
        image: new CircleStyle({
          radius: 8,

          fill: new Fill({
            color: 'red'
          }),

          stroke: new Stroke({
            color: 'white',
            width: 2
          })
        })
      });

    }

    if (type === 'label') {

      return new Style({
        text: new Text({

          text: feature.get('name'),

          font: 'bold 16px sans-serif',

          fill: new Fill({
            color: '#222'
          }),

          stroke: new Stroke({
            color: 'white',
            width: 4
          }),

          offsetY: -5

        })
      });

    }

    return new Style({

      fill: new Fill({
        color: 'rgba(0, 120, 255, 0.2)'
      }),

      stroke: new Stroke({
        color: 'blue',
        width: 3
      })

    });

  }
});


const map = new Map({

  target: 'map',

  layers: [

    new TileLayer({
      source: new OSM()
    }),

    vectorLayer

  ],

  view: new View({

    center: fromLonLat([139.38, 36.29]),

    zoom: 12

  })

});


let draw = null;


function stopDrawing() {

  if (draw !== null) {

    map.removeInteraction(draw);

    draw = null;

  }

}


// 犬田市
document
  .getElementById('city-button')
  .addEventListener('click', function () {

    stopDrawing();

    draw = new Draw({
      source: source,
      type: 'Polygon'
    });

    map.addInteraction(draw);

    draw.on('drawend', function (event) {

      event.feature.set('type', 'city');
      event.feature.set('name', '犬田市');

      stopDrawing();

    });

  });


// 会社
document
  .getElementById('company-button')
  .addEventListener('click', function () {

    stopDrawing();

    draw = new Draw({
      source: source,
      type: 'Point'
    });

    map.addInteraction(draw);

    draw.on('drawend', function (event) {

      const companyName =
        prompt('会社名を入力してください');

      if (companyName) {

        event.feature.set('type', 'company');
        event.feature.set('name', companyName);

      } else {

        source.removeFeature(event.feature);

      }

      stopDrawing();

    });

  });


// 名称
document
  .getElementById('label-button')
  .addEventListener('click', function () {

    stopDrawing();

    draw = new Draw({
      source: source,
      type: 'Point'
    });

    map.addInteraction(draw);

    draw.on('drawend', function (event) {

      const labelName =
        prompt('表示する名称を入力してください');

      if (labelName) {

        event.feature.set('type', 'label');
        event.feature.set('name', labelName);

      } else {

        source.removeFeature(event.feature);

      }

      stopDrawing();

    });

  });


// 操作終了
document
  .getElementById('stop-button')
  .addEventListener('click', function () {

    stopDrawing();

  });


// 会社クリック
map.on('click', function (event) {

  map.forEachFeatureAtPixel(event.pixel, function (feature) {

    if (feature.get('type') === 'company') {

      alert(
        '会社名：' +
        feature.get('name')
      );

    }

  });

});


// 保存
document
  .getElementById('save-button')
  .addEventListener('click', function () {

    const data = source.getFeatures().map(function (feature) {

      const geometry = feature.getGeometry();

      return {
        type: feature.get('type'),
        name: feature.get('name'),
        geometryType: geometry.getType(),
        geometry: geometry.getCoordinates()
      };

    });

    localStorage.setItem(
      'inuta-map-data',
      JSON.stringify(data)
    );

    alert('地図を保存しました！');

  });


// 読み込み
document
  .getElementById('load-button')
  .addEventListener('click', function () {

    const savedData =
      localStorage.getItem('inuta-map-data');

    if (!savedData) {

      alert('保存された地図がありません。');

      return;

    }

    source.clear();

    const data = JSON.parse(savedData);

    data.forEach(function (item) {

      let geometry;

      if (item.geometryType === 'Point') {

        geometry = new Point(item.geometry);

      } else if (item.geometryType === 'Polygon') {

        geometry = new Polygon(item.geometry);

      }

      if (!geometry) {
        return;
      }

      const feature = new Feature({
        geometry: geometry
      });

      feature.set('type', item.type);
      feature.set('name', item.name);

      source.addFeature(feature);

    });

    alert('地図を読み込みました！');

  });