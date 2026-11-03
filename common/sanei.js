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
    // インストール済みの記録（ツール側で呼ぶ）。
    // 自分専用のアプリ窓（standalone かつ ポータルから開かれていない）で動いていれば、インストール済みとみなす。
    trackInstall: function (toolId) {
      var k = 'sanei.installed.' + toolId;
      function mark() { try { localStorage.setItem(k, '1'); } catch (e) {} }
      if (displayMode().indexOf('standalone') >= 0 && !window.opener) mark();
      addEventListener('appinstalled', mark);
    },
    isInstalled: function (toolId) { try { return localStorage.getItem('sanei.installed.' + toolId) === '1'; } catch (e) { return false; } },
    clearInstalled: function () { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('sanei.installed.') === 0) localStorage.removeItem(k); }); } catch (e) {} },
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

  // 共通のインストールボタン：Chromeが「インストールできる」と判断したときだけ右下に出す。
  // ページに自前のボタン（id="installBtn"）があるツール・ポータルでは出さない。
  // ポータルの小窓（アドレスバーが無くChromeのインストールマークが出ない窓）でもインストールできるようにするため。
  var deferredInstall = null;
  addEventListener('beforeinstallprompt', function (e) {
    if (document.getElementById('installBtn')) return;
    // 自分専用のアプリ窓（＝インストール済み）で動いているときは出さない（押しても何も起きないため）
    if (displayMode().indexOf('standalone') >= 0 && !window.opener) { e.preventDefault(); return; }
    e.preventDefault(); deferredInstall = e;
    function show() {
      if (document.getElementById('saneiInstallBtn')) return;
      var b = document.createElement('button');
      b.id = 'saneiInstallBtn'; b.type = 'button'; b.textContent = 'このツールをインストール';
      b.setAttribute('style', 'position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:8px 14px;border-radius:999px;' +
        'border:1px solid #fff;background:#1f4e8c;color:#fff;font:14px "Yu Gothic UI","Meiryo",sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35)');
      b.onclick = function () { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } b.remove(); };
      document.body.appendChild(b);
    }
    if (document.body) show(); else addEventListener('DOMContentLoaded', show);
  });
  addEventListener('appinstalled', function () { var b = document.getElementById('saneiInstallBtn'); if (b) b.remove(); });

  // サービスワーカー（インストールに必要）。置き場の一番上に1つだけ。
  if ('serviceWorker' in navigator) {
    var base = document.currentScript.src.replace(/common\/sanei\.js.*$/, '');
    navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch(function (e) { console.warn('SW登録失敗', e); });
  }
})();
