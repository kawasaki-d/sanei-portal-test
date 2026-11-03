/* サンエイツール 共通スクリプト（試作）
 * ポータルと全ツールで読み込む。役割は3つ:
 *  1. 利用者名（自己申告）の保存・取得   … 保存名 sanei.user
 *  2. 接続先設定（設定リンク #config=…）の取り込み … 保存名 sanei.config
 *  3. 表示モード等の診断情報の表示（試作の検証用）
 * ※コードは公開されるため、本物の名簿・GASのURL・社内情報は書かないこと。
 */
(function () {
  var K_USER = 'sanei.user', K_CONF = 'sanei.config';

  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // 設定リンク（…/#config=<URLエンコードしたJSON>）を開いたら保存し、URLから消す
  var m = location.hash.match(/[#&]config=([^&]+)/);
  if (m) {
    try {
      var conf = JSON.parse(decodeURIComponent(m[1]));
      write(K_CONF, conf);
      history.replaceState(null, '', location.pathname + location.search);
      window.__saneiConfigJustSaved = true;
    } catch (e) { console.warn('設定リンクを読めませんでした', e); }
  }

  function displayMode() {
    if (matchMedia('(display-mode: standalone)').matches) return 'アプリのウィンドウ（standalone）';
    if (matchMedia('(display-mode: minimal-ui)').matches) return 'アプリ（minimal-ui）';
    return 'Chromeのタブ（browser）';
  }

  window.Sanei = {
    getUser: function () { return read(K_USER); },
    setUser: function (u) { write(K_USER, u); },
    clearUser: function () { try { localStorage.removeItem(K_USER); } catch (e) {} },
    getConfig: function () { return read(K_CONF) || {}; },
    clearConfig: function () { try { localStorage.removeItem(K_CONF); } catch (e) {} },
    displayMode: displayMode,
    // 他のウィンドウで名前や設定が変わったら呼ばれる
    onChange: function (fn) {
      addEventListener('storage', function (e) { if (!e.key || e.key.indexOf('sanei.') === 0) fn(); });
    },
    // 診断パネル（試作の検証用）
    renderDiag: function (el, extra) {
      var u = read(K_USER), c = read(K_CONF);
      var rows = [
        ['表示モード', displayMode()],
        ['利用者', u ? u.name + '（' + (u.group || '一般') + '）' : '未選択'],
        ['接続先設定', c && c.tools ? '登録済み（' + Object.keys(c.tools).length + 'ツール分）' : '未登録'],
        ['置き場（オリジン）', location.origin],
        ['このページ', location.pathname]
      ].concat(extra || []);
      el.innerHTML = '<b>診断情報（検証用）</b><table>' + rows.map(function (r) {
        return '<tr><th>' + r[0] + '</th><td>' + String(r[1]).replace(/</g, '&lt;') + '</td></tr>';
      }).join('') + '</table>';
    }
  };

  // サービスワーカー（インストールに必要）。置き場の一番上に1つだけ。
  if ('serviceWorker' in navigator) {
    var base = document.currentScript.src.replace(/common\/sanei\.js.*$/, '');
    navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch(function (e) { console.warn('SW登録失敗', e); });
  }
})();
