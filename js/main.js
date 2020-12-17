// Spotify APIのトークンを設定
// １時間でトークンの期限が切れるためここから再取得する必要あり→ https://developer.spotify.com/console/get-search-item/?q=&type=&market=&limit=&offset=&include_external=
let token = 'BQCPBaHL1sdATxFoSn_7t7-mzBrkblGKq6oda8AzxGf5NpCm3vpsEP-7KFsN0BvUs_hkblxVqJVL6f3cA0dZxkeI0LQZ3MBRGXjfmDCAQqDGqAu8ZSQ4obmclmGJcPG792DHe9U63DqOBHW2y7qAQ-fg87M0UF0';
let newFavTrack = firebase.database().ref('favList');

// 検索ボタン押下時の処理
$(".button").on("click", function () {
    $(".track-list").html('');
    $(".track-list").css("visibility", "visible");

    // 入力ワードを変数に代入し、Spotifyで検索
    let searchWord = $(".input").val();
    $.ajax({
        url: `https://api.spotify.com/v1/search?q=${searchWord}%20&type=track&artist`,
        headers: {
            Authorization: 'Bearer ' + token
        }
    })
        .then(function (data) {
            console.log(data);

            // 上位20件の検索結果からアーティスト名、曲名、ジャケット写真、プレビューURL、IDを取得
            for (let i = 0; i < data.tracks.items.length; i++) {
                const artists = data.tracks.items[i].artists[0].name;
                const trackName = data.tracks.items[i].name;
                const artwork = data.tracks.items[i].album.images[1].url;
                const preview = data.tracks.items[i].preview_url;
                const trackID = data.tracks.items[i].id;

                // track-listエリアに表示
                $(".track-list").append(`
                <div class="track" id="${trackID}">
                <div class="artwork">
                <img src=${artwork}>
                </div>
                <div class="track-info">
                <p class="track-name">${trackName}</p>
                <p class="artists">${artists}</p>
                <div class="LikesIcon">
                <i class="far fa-heart LikesIcon-fa-heart"></i>
                </div>
                </div>
                <video controls name="media" class="player">
                    <source src="${preview}" type="audio/mpeg">
                    </video>
                </div>`);

                // すでにFav登録されていればハートボタンを赤色にする
                newFavTrack.once("value",function(snapshot){
                    let favObj = snapshot.val();
                    // Favが何もなければそのまま
                    if(favObj==null){;}
                    else{
                    // オブジェクトのキーを配列化
                    let favArray = Object.keys(favObj);
                    if(favArray.indexOf(trackID) >=0){
                        $(".track-list").find("#"+trackID).find(".LikesIcon").addClass("on");
                        $(".track-list").find("#"+trackID).find(".LikesIcon").children("i").attr("class", "fas fa-heart LikesIcon-fa-heart heart");
                    }
                }
                })

            }
            // Likeボタンクリック
            // 参考ページ: https://yuyauver98.me/twitter-like-animation/#_fontawesomecss

            $('.LikesIcon').on('click', function () {
                let $btn = $(this);
                // Likeボタンがonクラス持っていたら
                if ($btn.hasClass('on')) {

                    $btn.removeClass('on');

                    // 白抜きアイコンに戻す
                    $btn.children("i").attr('class', 'far fa-heart LikesIcon-fa-heart');
                    // Firebaseから削除する
                    const remID = $btn.parents(".track").attr("id");
                    const remTrackRef = firebase.database().ref(`favList/${remID}`);
                    remTrackRef.remove();
                    // MyFavoriteから削除する
                    $(".save-list").find("#"+remID).remove();

                } else {
                    // Likeボタンにonクラスを付与
                    $btn.addClass('on');
                    // 赤アイコンにする
                    $btn.children("i").attr('class', 'fas fa-heart LikesIcon-fa-heart heart');
                    
                    // Firebaseに追加してMyFavoriteに表示する処理
                    const favID = $btn.parents(".track").attr("id");
                    const favTrackName = $btn.prev().prev().text();
                    const favArtist = $btn.prev().text();
                    const favArtwork = $btn.parents(".track").find("img").attr("src");
                    const favPreview = $btn.parents(".track").find("source").attr("src");
                    newFavTrack.child(`${favID}`).set({
                        artist: favArtist,
                        trackname: favTrackName
                    })
                    $(".save-list").append(`
                <div class="track" id="${favID}">
                <div class="artwork">
                <img src=${favArtwork}>
                </div>
                <div class="track-info">
                <p class="track-name">${favTrackName}</p>
                <p class="artists">${favArtist}</p>
                <div class="fav-LikesIcon on">
                <i class="fas fa-heart LikesIcon-fa-heart heart"></i>
                </div>
                </div>
                <video controls name="media" class="player">
                    <source src="${favPreview}" type="audio/mpeg">
                    </video>
                </div>`)

                }
                favRemove();

            })
            favRemove();

        })


    $(".input").val("");

})

// MyFavoriteでハートボタン押下（Favから外す）時の処理
function favRemove(){
    $(".fav-LikesIcon").on("click",function(){
        let $btn = $(this);
        const remID = $btn.parents(".track").attr("id");
        const remTrackRef = firebase.database().ref(`favList/${remID}`);
        remTrackRef.remove();
        $(".save-list").find("#"+remID).remove();
    })
}


// 初期化関数としてFirebaseからFavorite登録済の楽曲を取得
function init() {
    newFavTrack.once("value", function (snapshot) {
        let favObj = snapshot.val();
        // Favが何もなければそのまま
        if(favObj==null){;}
        else{
            // オブジェクトを配列化
        let favArray = Object.keys(favObj);
        for (let n = 0; n < favArray.length; n++) {

            // 配列に入っている楽曲のIDを取得しSpotifyで検索
            const favTrackID = favArray[n];
            $.ajax({
                url: `https://api.spotify.com/v1/tracks/${favTrackID}`,
                headers: {
                    Authorization: 'Bearer ' + token
                }
            })
            // 検索結果を変数に代入しsave-listに表示
                .then(function (savedata) {
                    const artists = savedata.artists[0].name;
                    const trackName = savedata.name;
                    const artwork = savedata.album.images[1].url;
                    const preview = savedata.preview_url;
                    const trackID = savedata.id;
                    $(".save-list").append(`
        <div class="track" id="${trackID}">
        <div class="artwork">
        <img src=${artwork}>
        </div>
        <div class="track-info">
        <p class="track-name">${trackName}</p>
        <p class="artists">${artists}</p>
        <div class="fav-LikesIcon on">
        <i class="fas fa-heart LikesIcon-fa-heart heart"></i>
        </div>
        </div>
        <video controls name="media" class="player">
            <source src="${preview}" type="audio/mpeg">
            </video>
        </div>`);
        favRemove();

                })
        }

    }
    })
}
