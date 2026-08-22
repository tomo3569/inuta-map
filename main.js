import './style.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';

import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';

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

import { apply } from 'ol-mapbox-style';


// ==================================================
// 地図
// ==================================================

const map = new Map({

  target: 'map',

  view: new View({

    center: fromLonLat([
      139.38,
      36.29
    ]),

    zoom: 12

  })

});


// ==================================================
// 犬田市用データ
// ==================================================

const source = new VectorSource();


// ==================================================
// 犬田市・会社・名称レイヤー
// ==================================================

const vectorLayer = new VectorLayer({

  source: source,

  style: function (feature) {

    const type = feature.get('type');


    // ------------------------------
    // 会社
    // ------------------------------

    if (type === 'company') {

      return new Style({

        image: new CircleStyle({

          radius: 8,

          fill: new Fill({

            color: '#ff0000'

          }),

          stroke: new Stroke({

            color: '#ffffff',

            width: 2

          })

        }),

        text: new Text({

          text: feature.get('name'),

          font: 'bold 15px sans-serif',

          offsetY: -20,

          fill: new Fill({

            color: '#111111'

          }),

          stroke: new Stroke({

            color: '#ffffff',

            width: 4

          })

        })

      });

    }


    // ------------------------------
    // 名称
    // ------------------------------

    if (type === 'label') {

      return new Style({

        text: new Text({

          text: feature.get('name'),

          font: 'bold 18px sans-serif',

          fill: new Fill({

            color: '#111111'

          }),

          stroke: new Stroke({

            color: '#ffffff',

            width: 5

          })

        })

      });

    }


    // ------------------------------
    // 犬田市
    // ------------------------------

    if (type === 'city') {

      return new Style({

        fill: new Fill({

          color: 'rgba(0, 120, 255, 0.15)'

        }),

        stroke: new Stroke({

          color: '#0066ff',

          width: 3

        })

      });

    }


    return null;

  }

});


// ==================================================
// OpenFreeMapを読み込む
// ==================================================

apply(

  map,

  './map-style/liberty-no-labels.json'

).then(function () {


  console.log(
    'OpenFreeMap loaded'
  );


  // ==================================================
  // OpenFreeMapの後に犬田市レイヤーを追加
  // ==================================================

  map.addLayer(
    vectorLayer
  );


  // ==================================================
  // 犬田市ラベル専用レイヤー
  // ==================================================

  const labelSource =
    new VectorSource();


  const labelLayer =
    new VectorLayer({

      source: labelSource,

      style: new Style({

        text: new Text({

          text: '犬田市',

          font: 'bold 32px sans-serif',

          fill: new Fill({

            color: '#ff0000'

          }),

          stroke: new Stroke({

            color: '#ffffff',

            width: 8

          })

        })

      })

    });


  map.addLayer(
    labelLayer
  );


  const cityLabel =
    new Feature({

      geometry:
        new Point(

          fromLonLat([

            139.38,
            36.29

          ])

        )

    });


  labelSource.addFeature(
    cityLabel
  );


});


// ==================================================
// 描画
// ==================================================

let draw = null;


function stopDrawing() {

  if (draw !== null) {

    map.removeInteraction(
      draw
    );

    draw = null;

  }

}


// ==================================================
// 犬田市の範囲
// ==================================================

document
  .getElementById('city-button')
  .addEventListener(
    'click',
    function () {


      stopDrawing();


      draw = new Draw({

        source: source,

        type: 'Polygon'

      });


      map.addInteraction(
        draw
      );


      draw.on(
        'drawend',
        function (event) {


          event.feature.set(
            'type',
            'city'
          );


          event.feature.set(
            'name',
            '犬田市'
          );


          stopDrawing();

        }
      );

    }
  );


// ==================================================
// 会社
// ==================================================

document
  .getElementById('company-button')
  .addEventListener(
    'click',
    function () {


      stopDrawing();


      draw = new Draw({

        source: source,

        type: 'Point'

      });


      map.addInteraction(
        draw
      );


      draw.on(
        'drawend',
        function (event) {


          const name =
            prompt(
              '会社名を入力してください'
            );


          if (!name) {

            source.removeFeature(
              event.feature
            );

            stopDrawing();

            return;

          }


          event.feature.set(
            'type',
            'company'
          );


          event.feature.set(
            'name',
            name
          );


          stopDrawing();

        }
      );

    }
  );


// ==================================================
// 名称
// ==================================================

document
  .getElementById('label-button')
  .addEventListener(
    'click',
    function () {


      stopDrawing();


      draw = new Draw({

        source: source,

        type: 'Point'

      });


      map.addInteraction(
        draw
      );


      draw.on(
        'drawend',
        function (event) {


          const name =
            prompt(
              '表示する名称を入力してください'
            );


          if (!name) {

            source.removeFeature(
              event.feature
            );

            stopDrawing();

            return;

          }


          event.feature.set(
            'type',
            'label'
          );


          event.feature.set(
            'name',
            name
          );


          stopDrawing();

        }
      );

    }
  );


// ==================================================
// 操作終了
// ==================================================

document
  .getElementById('stop-button')
  .addEventListener(
    'click',
    function () {

      stopDrawing();

    }
  );


// ==================================================
// 会社クリック
// ==================================================

map.on(
  'click',
  function (event) {


    map.forEachFeatureAtPixel(

      event.pixel,

      function (feature) {


        if (
          feature.get('type') ===
          'company'
        ) {


          alert(

            '会社名：' +
            feature.get('name')

          );

        }

      }

    );

  }
);


// ==================================================
// 保存
// ==================================================

document
  .getElementById('save-button')
  .addEventListener(
    'click',
    function () {


      const data =
        source
          .getFeatures()
          .map(
            function (feature) {


              const geometry =
                feature.getGeometry();


              return {

                type:
                  feature.get('type'),

                name:
                  feature.get('name'),

                geometryType:
                  geometry.getType(),

                geometry:
                  geometry.getCoordinates()

              };

            }
          );


      localStorage.setItem(

        'inuta-map-data',

        JSON.stringify(data)

      );


      alert(
        '地図を保存しました！'
      );

    }
  );


// ==================================================
// 読み込み
// ==================================================

document
  .getElementById('load-button')
  .addEventListener(
    'click',
    function () {


      const saved =
        localStorage.getItem(
          'inuta-map-data'
        );


      if (!saved) {

        alert(
          '保存された地図がありません。'
        );

        return;

      }


      source.clear();


      const data =
        JSON.parse(saved);


      data.forEach(
        function (item) {


          let geometry;


          if (
            item.geometryType ===
            'Point'
          ) {


            geometry =
              new Point(
                item.geometry
              );


          } else if (
            item.geometryType ===
            'Polygon'
          ) {


            geometry =
              new Polygon(
                item.geometry
              );

          }


          if (!geometry) {

            return;

          }


          const feature =
            new Feature({

              geometry:
                geometry

            });


          feature.set(
            'type',
            item.type
          );


          feature.set(
            'name',
            item.name
          );


          source.addFeature(
            feature
          );

        }
      );


      alert(
        '地図を読み込みました！'
      );

    }
  );
  // ==================================================
// 全部消す
// ==================================================

document
  .getElementById('clear-button')
  .addEventListener(
    'click',
    function () {

      const confirmed =
        confirm(
          '犬田市の範囲、会社、名称などを全部削除しますか？\n\nこの操作は元に戻せません。'
        );


      if (!confirmed) {

        return;

      }


      // 地図上の作成データを削除
      source.clear();


      // 保存データを削除
      localStorage.removeItem(
        'inuta-map-data'
      );


      alert(
        '地図データを全部削除しました。'
      );

    }
  );