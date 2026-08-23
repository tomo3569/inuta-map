import './style.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';

import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';

import Feature from 'ol/Feature.js';

import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';

import { apply } from 'ol-mapbox-style';

import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';

import { fromLonLat } from 'ol/proj.js';


// ==================================================
// 初期表示設定
// ==================================================

// 会社の座標
// すでにEPSG:3857なので fromLonLat() は使用しない
const INITIAL_CENTER = [
  15514708.703540094,
  4340449.639284931
];

// 初期ズーム倍率
const INITIAL_ZOOM = 18;


// ==================================================
// 地図
// ==================================================

const map = new Map({

  target: 'map',

  // OpenLayers標準の左上UIを非表示
  controls: [],

  view: new View({

    center: INITIAL_CENTER,

    zoom: INITIAL_ZOOM

  })

});


// ==================================================
// 地図データ用ソース
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

          text: feature.get('name') || '',

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

          text: feature.get('name') || '',

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
// 犬田市ラベル
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


// ==================================================
// レイヤー追加
// ==================================================

let overlayLayersAdded = false;


function addOverlayLayers() {

  if (overlayLayersAdded) {

    return;

  }

  overlayLayersAdded = true;

  map.addLayer(
    vectorLayer
  );

  map.addLayer(
    labelLayer
  );

}


// ==================================================
// 背景地図
// ==================================================

apply(

  map,

  './map-style/liberty-no-labels.json'

)
.then(function () {

  console.log(
    'OpenFreeMap loaded'
  );

})
.catch(function (error) {

  console.error(
    'OpenFreeMapの読み込みに失敗しました:',
    error
  );

})
.finally(function () {

  addOverlayLayers();

  // F5時に保存済み地図を自動復元
  restoreSavedMapOnStartup();

});


// ==================================================
// 地図データ読み込み
// ==================================================

function loadMapData(showAlert = false) {

  const saved =
    localStorage.getItem(
      'inuta-map-data'
    );


  // 保存データがない場合
  if (!saved) {

    if (showAlert) {

      alert(
        '保存された地図がありません。'
      );

    }

    return false;

  }


  try {

    const data =
      JSON.parse(saved);


    if (!Array.isArray(data)) {

      throw new Error(
        '保存データの形式が正しくありません。'
      );

    }


    console.log(
      '保存データ:',
      data
    );


    // 現在の地図データを削除
    source.clear();


    // ------------------------------
    // データを復元
    // ------------------------------

    data.forEach(
      function (item) {

        let geometry = null;


        // ------------------------------
        // Point
        // ------------------------------

        if (

          item.geometryType === 'Point' &&

          Array.isArray(
            item.geometry
          )

        ) {

          geometry =
            new Point(
              item.geometry
            );

        }


        // ------------------------------
        // Polygon
        // ------------------------------

        if (

          item.geometryType === 'Polygon' &&

          Array.isArray(
            item.geometry
          )

        ) {

          geometry =
            new Polygon(
              item.geometry
            );

        }


        // ------------------------------
        // 不正なデータ
        // ------------------------------

        if (!geometry) {

          console.warn(
            '読み込めないデータ:',
            item
          );

          return;

        }


        const feature =
          new Feature({

            geometry:
              geometry

          });


        feature.set(
          'type',
          item.type || ''
        );


        feature.set(
          'name',
          item.name || ''
        );


        source.addFeature(
          feature
        );

      }
    );


    console.log(
      '復元したFeature数:',
      source.getFeatures().length
    );


    // ------------------------------
    // 会社が存在する場合
    // ------------------------------

    const company =
      data.find(
        function (item) {

          return item.type === 'company';

        }
      );


    if (

      company &&

      Array.isArray(
        company.geometry
      )

    ) {

      // 保存されている会社の位置へ移動
      map.getView().setCenter(
        company.geometry
      );

      // 初期ズーム倍率を使用
      map.getView().setZoom(
        INITIAL_ZOOM
      );

    }


    // ------------------------------
    // 再描画
    // ------------------------------

    map.updateSize();

    vectorLayer.changed();

    labelLayer.changed();


    // ------------------------------
    // ボタンからの読み込みのみ通知
    // ------------------------------

    if (showAlert) {

      alert(
        '地図を読み込みました！'
      );

    }


    return true;

  }

  catch (error) {

    console.error(
      '地図の読み込みエラー:',
      error
    );


    if (showAlert) {

      alert(
        '地図データの読み込みに失敗しました。'
      );

    }


    return false;

  }

}


// ==================================================
// F5 / ページ読み込み時の自動復元
// ==================================================

function restoreSavedMapOnStartup() {

  const saved =
    localStorage.getItem(
      'inuta-map-data'
    );


  // 保存データがない場合は何もしない
  if (!saved) {

    return;

  }


  requestAnimationFrame(
    function () {

      loadMapData(false);

    }
  );

}


// ==================================================
// 読み込みボタン
// ==================================================

const loadButton =
  document.getElementById(
    'load-button'
  );


if (loadButton) {

  loadButton.addEventListener(

    'click',

    function () {

      loadMapData(true);

    }

  );

}


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