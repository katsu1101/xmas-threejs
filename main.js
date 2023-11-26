
// 定数の設定
const TREE_HEIGHT = 6; // ツリーの高さ
const TREE_RADIUS = 2; // ツリーの半径
const ORNAMENTS_COUNT = 25; // オーナメントの総数
const SPIRAL_TURNS = 4; // 螺旋の巻数
const STEPS = 1000; // 数値積分のステップ数
const DEFAULT_TEXTURE = 'default_texture.png';

function getSpiralPointCoordinates(treeHeight, treeRadius, spiralTurns, steps, fraction) {
    // 総螺旋の長さを計算
    // 螺旋の長さを計算するための積分処理
    let totalLength = 0;
    let dTheta = (2 * Math.PI * spiralTurns) / steps;

    for (let i = 0; i < steps; i++) {
        let startTheta = i * dTheta;
        let endTheta = (i + 1) * dTheta;
        // 台形則による数値積分
        totalLength += (spiralLengthDifferential(startTheta) + spiralLengthDifferential(endTheta)) / 2 * dTheta;
    }

    const totalSpiralLength = totalLength;

    // 目的の距離を計算
    const targetDistance = totalSpiralLength * fraction;

    // 現在の距離と角度
    let currentDistance = 0;
    let currentAngle = 0;

    // 螺旋の半径を計算する関数
    function spiralRadius(theta) {
        let z = (treeHeight / (2 * Math.PI * spiralTurns)) * theta;
        return treeRadius * (1 - z / treeHeight);
    }

    // 螺旋の長さの微分を計算する関数
    function spiralLengthDifferential(theta) {
        let dr_dtheta = -treeHeight / (2 * Math.PI * spiralTurns) * treeRadius / treeHeight;
        let dz_dtheta = treeHeight / (2 * Math.PI * spiralTurns);
        let r = spiralRadius(theta);

        // dx/dtheta, dy/dtheta, dz/dtheta の計算
        let dx_dtheta = dr_dtheta * Math.cos(theta) - r * Math.sin(theta);
        let dy_dtheta = dr_dtheta * Math.sin(theta) + r * Math.cos(theta);

        // 曲線の微小区間の長さを計算
        return Math.sqrt(dx_dtheta * dx_dtheta + dy_dtheta * dy_dtheta + dz_dtheta * dz_dtheta);
    }

    // 螺旋をたどる
    for (let i = 0; i < steps; i++) {
        let startTheta = i * dTheta;
        let endTheta = (i + 1) * dTheta;
        let segmentLength = (spiralLengthDifferential(startTheta) + spiralLengthDifferential(endTheta)) / 2 * dTheta;

        // 次のポイントが目的の距離を超える場合、そのセグメント上で目的の点を見つける
        if (currentDistance + segmentLength >= targetDistance) {
            // 目的の点までの残りの距離
            let remainingDistance = targetDistance - currentDistance;
            // 残りの距離から角度の増分を計算
            let deltaTheta = remainingDistance / spiralLengthDifferential(startTheta);
            currentAngle = startTheta + deltaTheta;

            // 螺旋の半径と高さを計算
            let z = (treeHeight / (2 * Math.PI * spiralTurns)) * currentAngle;
            let r = treeRadius * (1 - z / treeHeight);

            // 3D座標を計算
            let x = r * Math.cos(currentAngle);
            let y = r * Math.sin(currentAngle);

            // 目的の3D座標を返す
            return { x: x, y: z, z: y };
        }

        // 現在の距離を更新
        currentDistance += segmentLength;
    }

    // 目的の距離が螺旋の長さを超えている場合、最終的な座標を返す
    let z = treeHeight / 2; // 螺旋の最高点
    let r = 0; // 最高点での半径は0
    let x = r * Math.cos(currentAngle);
    let y = r * Math.sin(currentAngle);
    return { x: x, y: z, z: y };
}

// 星形のジオメトリを作成
function createStarShape() {
    const shape = new THREE.Shape();
    const outerRadius = 0.6; // 星の外側の半径
    const innerRadius = 0.3; // 星の内側の半径
    const numPoints = 5;

    for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI * 2) / (numPoints * 2);
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
            shape.moveTo(x, y);
        } else {
            shape.lineTo(x, y);
        }
    }

    shape.closePath();
    return shape;
}

// テクスチャとシーンを更新する関数
function updateSceneWithNewTexture(texture) {
    // シーンからすべてのオブジェクトを削除
    while(scene.children.length > 0){
        scene.remove(scene.children[0]);
    }

    // クリスマスツリーと星を再度追加
    let treeGeometry = new THREE.ConeGeometry(TREE_RADIUS, TREE_HEIGHT, 32);
    let treeMaterial = new THREE.MeshBasicMaterial({ color: 0x008000 });
    let tree = new THREE.Mesh(treeGeometry, treeMaterial);
    scene.add(tree);

    // 星形のメッシュを作成
    const starShape = createStarShape();
    const extrudeSettings = {
        steps: 1,
        depth: 0.1,
        bevelEnabled: false
    };
    const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const star = new THREE.Mesh(starGeometry, starMaterial);

    // 星を円錐の頂上に配置
    star.position.y = TREE_HEIGHT / 2 + 0.6; // 星を円錐の少し上に配置
    star.rotation.z = Math.PI / 2; // 星をX軸周りに90度回転
    scene.add(star);


    // 新しいテクスチャでオーナメントを作成し、シーンに追加
    // ...（オーナメントを作成し、シーンに追加するコード）...
    // クリスマスツリーの作成
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // 画像を5x5に分割して飾りとして使用
    let segmentWidth = 1 / 5;
    let segmentHeight = 1 / 5;

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            // 各飾りに対してテクスチャのクローンを作成
            let ornamentTexture = texture.clone();
            ornamentTexture.needsUpdate = true;
            ornamentTexture.repeat.set(segmentWidth, segmentHeight);
            ornamentTexture.offset.set(((i + 3) % 5) * segmentWidth, ((j+3) % 5) * segmentHeight);

            // 飾りの作成
            let ornamentGeometry = new THREE.PlaneGeometry(0.8, 0.8);
            let ornamentMaterial = new THREE.MeshBasicMaterial({
                map: ornamentTexture,
                side: THREE.DoubleSide,
                alphaTest: 0.5, // 透明度の閾値を設定（0.0から1.0までの値）
                transparent: true // 透明度を有効にする
            });
            let ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial);

            let a = getSpiralPointCoordinates(TREE_HEIGHT, TREE_RADIUS, SPIRAL_TURNS, STEPS, (i*5+j) / ORNAMENTS_COUNT)

            // オーナメントの位置を設定
            ornament.position.set(a.x, a.y+segmentHeight * 2 - TREE_HEIGHT / 2, a.z);

            // オーナメントをツリーの中心から外側に向ける
            ornament.lookAt(new THREE.Vector3(ornament.position.x*2, ornament.position.y, ornament.position.z*2));

            scene.add(ornament);
        }
    }
}

// カメラの作成
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 7;

// レンダラーの作成
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 背景を透明に設定
renderer.setClearColor(0x000000, 0); // 背景色を黒（0x000000）で透明度0に
document.body.appendChild(renderer.domElement);

// OrbitControlsの作成
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // インタラクティブな動きに抵抗（ダンピング）を追加
controls.dampingFactor = 0.25; // ダンピングの量
controls.enableZoom = true; // ズームを有効にする
controls.autoRotate = true; // カメラの自動回転を有効にする
controls.autoRotateSpeed = 0.5; // 自動回転の速度

// シーンの作成
let scene = new THREE.Scene();

// 画像を読み込む
function loadInitialTexture(imagePath) {
    let textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, function(texture) {
        // テクスチャが正しく読み込まれた後にシーンを更新
        updateSceneWithNewTexture(texture);
    });
}
loadInitialTexture(DEFAULT_TEXTURE)


document.addEventListener('dragover', function(event) {
    event.preventDefault();
}, false);

document.addEventListener('drop', function(event) {
    event.preventDefault();
    let file = event.dataTransfer.files[0];
    handleFile(file);
}, false);

document.getElementById('fileInput').addEventListener('change', function(event) {
    let file = event.target.files[0];
    handleFile(file);
});
function handleFile(file) {
    let reader = new FileReader();
    reader.onload = function(event) {
        let dataUri = event.target.result;
        let textureLoader = new THREE.TextureLoader();
        textureLoader.load(dataUri, function(texture) {
            // テクスチャが正しく読み込まれた後にシーンを更新
            updateSceneWithNewTexture(texture);
        });
    };
    reader.readAsDataURL(file);
}

// レンダリングループ
function animate() {
    requestAnimationFrame(animate);

    // OrbitControlsの更新
    controls.update(); // カメラの回転（円軌道を描く）はもはや必要ありません。

    // シーンのレンダリング
    renderer.render(scene, camera);
}
animate();

// キャッシュ
const CACHE_NAME = 'cache-v1';
const urlsToCache = [
    '/default_texture.png',
];

// サービスワーカーのインストール時にキャッシュをセットアップ
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// 古いキャッシュをクリア
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// ネットワークリクエストに対するキャッシュの使用
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // キャッシュがあればキャッシュから、なければネットワークからフェッチ
                return response || fetch(event.request);
            })
    );
});
