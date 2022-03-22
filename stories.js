const html = `
<style>
  body {
    margin: 0;
    color: white;
    font-size: small;
  }
  .extendedh {
    width: 100%;
  }
  .extendedv {
    height: 100%;
  }
  #wrapper {
    padding: 8px;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.6);
    box-sizing: border-box;
    width: 300px;
  }
  .extendedh body,
  .extendedh #wrapper {
    width: 100%;
  }
  .extendedv body,
  .extendedv #wrapper {
    height: 100%;
  }
  .layer {
    background-color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    color: black;
    padding: 6px 0;
  }
  #title_list.is-hidden {
    display: none;
  }
  #story_wrapper {
    
  }
  #story_wrapper.is-hidden {
    display: none;
  }
</style>
<div id="wrapper">
  <div id="title_list"></div>
  <div id="story_wrapper" class="is-hidden">
    <h2 id="story_title"></h2>
    <h3 id="marker_title"></h3>
    <p>
      <button id="prev">Prev</button>
      <button id="next">Next</button>
    </p>
  </div>
</div>
<script>
  let reearth;
  let index = 0;
  let selectedMenuIndex = -1;
  let layers = [];
  
  const $titleList = document.getElementById('title_list')
  const $storyWrap = document.getElementById('story_wrapper')
  const $storyTitle = document.getElementById('story_title')

  const cb = (e) => {
    reearth = e.source.reearth;
    property = e.data.property;

    // これは実際には不要
    // if (property && property.default) {
    //   document.getElementById('story_title').textContent = property.default.title;
    // }

    // この部分の必要性は今ひとつよく分からない
    if (property && property.extended) {
      if (property.extended.horizontally) { document.documentElement.classList.add('extendedh');
      } else {  document.documentElement.classList.remove('extendedh');
      } if (property.extended.vertically) { document.documentElement.classList.add('extendedv');
      } else { document.documentElement.classList.remove('extendedv'); }
    }

    // document.getElementById('story_title').textContent = e.data.title;
    // markers = e.data.markers;
    // 最初のマーカーを自動的に選択する
    // prev();
    layers = e.data.layers;
    layers.map((layer, index) => {
      const $layer = document.createElement('div')
      $layer.classList.add('layer')
      $layer.innerText = layer.title
      $layer.dataset.id = index
      $layer.addEventListener('click', selectMenu)
      $titleList.appendChild($layer)
    })
    console.log('layers', e.data.layers)
    // console.log('markers', markers)
  };
  
  const selectMenu = (e) => {
    console.log(e)
    selectedMenuIndex = e.target.dataset.id
    showLayer()
  }

  addEventListener('message', (e) => {
    if (e.source !== parent) return;
    cb(e);
  });
  
  const showLayer = () => {
    $titleList.classList.add('is-hidden')
    $storyWrap.classList.remove('is-hidden')
    $storyTitle.textContent = layers[selectedMenuIndex].title
    select(layers[selectedMenuIndex].markers[0]);
  }
  
  const hideLayer = () => {
    $titleList.classList.remove('is-hidden')
    $storyWrap.classList.add('is-hidden')
    selectedMenuIndex = -1
  }

  const prev = () => {
    index = Math.max(0, index - 1);
    select(layers[selectedMenuIndex].markers[index]);
  };

  const next = () => {
    index = Math.min(layers[selectedMenuIndex].markers.length - 1, index + 1);
    select(layers[selectedMenuIndex].markers[index]);
  };

  const select = (targetMarker) => {
    reearth.visualizer.camera.flyTo(
      {
        lat: targetMarker.lat,
        lng: targetMarker.lng,
        height: targetMarker.height,
      },
      { duration: 2 }
    );
    reearth.layers.select(targetMarker.id);
    document.getElementById('marker_title').textContent = targetMarker.title + ' (' + (index + 1) + ' / ' + markers.length + ')';
  };

  document.getElementById('prev').addEventListener('click', prev);
  document.getElementById('next').addEventListener('click', next);
</script>
`;

reearth.ui.show(html);
reearth.on('update', update);
update();

function update() {
  // tourタグの付いたレイヤーから決め打ちで最初のものだけを取り出す
  let _layers = reearth.layers.findByTagLabels('tour');
  let layers = []

  // このエラーチェックはもっとちゃんとやる必要あり
  if (typeof _layers === undefined) {
    return;
  }

  // GUIでは下から上に連番となるため、ここでは逆順で登録する
  _layers.reverse().map((layer, index) => {
    let markers = [];
    if (layer.children.length > 0) {
      for (let i = layer.children.length - 1; i >= 0; i--) {
        markers.push({
          lat: layer.children[i].property?.default.location.lat,
          lng: layer.children[i].property?.default.location.lng,
          height: layer.children[i].property?.default.height || 10000,
          id: layer.children[i].id,
          title: layer.children[i].title
        });
      }
    }
    layers.push({
      title: layer.title,
      markers
    })
  })
  console.log('layers', layers)

  reearth.ui.postMessage({
    property: reearth.widget.property,
    layers,
  });
}
