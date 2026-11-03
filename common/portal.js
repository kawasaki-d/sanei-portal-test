/* ポータル画面の共通処理（試作 第2版）。各ポータルの index.html で window.PORTAL を定義してから読み込む。
 * PORTAL = { label, version, tools:[{id,name,desc,url,icon,groups}], checks:[[no,text],...], resultsKey }
 */
(function () {
  var P = window.PORTAL;
  // この窓に名前を付ける（ツールの「ポータルに戻る」で、この窓を探して前に出すため）
  try { window.name = 'sanei-portal'; } catch (e) {}
  var USERS = [
    { name: 'テスト太郎', group: 'DX' },
    { name: 'テスト花子', group: '一般' },
    { name: 'テスト次郎', group: '一般' }
  ];
  function $(id) { return document.getElementById(id); }
  $('ver').textContent = P.version;

  function loadR() { try { return JSON.parse(localStorage.getItem(P.resultsKey)) || {}; } catch (e) { return {}; } }
  function saveR(r) { try { localStorage.setItem(P.resultsKey, JSON.stringify(r)); } catch (e) {} }
  function renderChecks() {
    var r = loadR();
    $('check').innerHTML = '<tr><th>No.</th><th>確認内容</th><th>結果</th><th>メモ</th></tr>' + P.checks.map(function (c) {
      var v = r[c[0]] || {};
      function opt(x) { return '<option' + (v.res === x ? ' selected' : '') + '>' + x + '</option>'; }
      return '<tr><td>' + c[0] + '</td><td>' + c[1] + '</td><td><select data-k="' + c[0] + '" data-f="res">' +
        opt('') + opt('OK') + opt('NG') + opt('一部') + '</select></td><td><input type="text" data-k="' + c[0] +
        '" data-f="memo" value="' + (v.memo || '').replace(/"/g, '&quot;') + '"></td></tr>';
    }).join('');
  }
  $('check').addEventListener('change', function (e) {
    var k = e.target.dataset.k, f = e.target.dataset.f; if (!k) return;
    var r = loadR(); r[k] = r[k] || {}; r[k][f] = e.target.value; saveR(r);
  });
  $('copyResults').onclick = function () {
    var r = loadR();
    var txt = '【ポータル試作 第2版 ' + P.label + ' 確認結果】' + P.version + ' / ' + (navigator.userAgent.match(/Chrome\/[\d.]+/) || '') + '\n' +
      P.checks.map(function (c) { var v = r[c[0]] || {}; return c[0] + '. ' + (v.res || '未') + (v.memo ? '（' + v.memo + '）' : ''); }).join('\n');
    copyText(txt); $('copied').textContent = 'コピーしました';
  };
  function copyText(t) {
    function fallback(s) { var a = document.createElement('textarea'); a.value = s; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).catch(function () { fallback(t); }); else fallback(t);
  }

  function renderTools() {
    var u = Sanei.getUser(), g = u ? u.group : null;
    $('tools').innerHTML = P.tools.filter(function (t) { return !t.groups.length || t.groups.indexOf(g) >= 0; }).map(function (t) {
      var abs = new URL(t.url, location.href).href;
      return '<div class="card tool"><img src="' + t.icon + '" alt=""><div><div class="t">' + t.name + '</div><div class="d">' + t.desc + '</div>' +
        '<button data-popup="' + t.url + '" data-id="' + t.id + '">開く</button>' +
        '<button class="sub" data-copy="' + abs + '">URLをコピー</button></div></div>';
    }).join('');
  }
  $('tools').addEventListener('click', function (e) {
    var d = e.target.dataset;
    if (d.popup) openTool(d.popup, d.id);
    if (d.copy) { copyText(d.copy); e.target.textContent = 'コピーしました'; }
  });

  // ツールを開く。同じツールの窓がすでに開いていれば、新しく開かずにその窓を前に出す。
  var opened = {};
  function openTool(url, id) {
    var w = opened[id];
    if (w && !w.closed) { try { w.focus(); return; } catch (e) {} }
    opened[id] = window.open(url, 'sanei-tool-' + id, 'popup,width=1100,height=780');
  }

  var sel = $('userSel');
  sel.innerHTML = USERS.map(function (u, i) { return '<option value="' + i + '">' + u.name + '（' + u.group + '）</option>'; }).join('');
  $('userChip').onclick = function () { $('modal').hidden = false; };
  $('userOk').onclick = function () { Sanei.setUser(USERS[sel.value]); $('modal').hidden = true; refresh(); };

  var demoConf = { tools: { calc: { endpoint: 'https://example.invalid/calc-gas' }, memo: { endpoint: 'https://example.invalid/memo-gas' } } };
  $('confLink').href = location.pathname + '#config=' + encodeURIComponent(JSON.stringify(demoConf));
  $('confLink').onclick = function () { setTimeout(function () { location.reload(); }, 50); };
  $('clearConf').onclick = function () { Sanei.clearConfig(); refresh(); };
  $('clearUser').onclick = function () { Sanei.clearUser(); refresh(); };

  var deferred = null;
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; $('installBtn').hidden = false; });
  $('installBtn').onclick = function () { if (deferred) { deferred.prompt(); deferred = null; } };

  function refresh() {
    var u = Sanei.getUser();
    $('userChip').textContent = u ? u.name + '（名前を変える）' : '名前を選ぶ';
    if (!u) $('modal').hidden = false;
    renderTools();
    Sanei.renderDiag($('diag'), [['版', P.version], ['方式', P.label]]);
  }
  if (window.__saneiConfigJustSaved) { $('flash').hidden = false; $('flash').textContent = '接続先設定を登録しました。'; }
  Sanei.onChange(refresh);
  renderChecks();
  refresh();
})();
