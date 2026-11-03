/* ツール台帳（試作）。ツールを追加するときはここに1件足すだけで、ポータルに表示される。
 * groups: 空なら全員に表示。["DX"] ならDXグループの人だけに表示（非表示にするだけで、URLを知れば開ける）。
 * ※本番では名簿（SANEI_USERS）をコードに書かず、GAS等から読み込む想定。ここは架空の名前。
 */
window.SANEI_USERS = [
  { name: 'テスト太郎', group: 'DX' },
  { name: 'テスト花子', group: '一般' },
  { name: 'テスト次郎', group: '一般' }
];

window.SANEI_TOOLS = [
  { id: 'calc', name: 'テスト計算', desc: '2つの数の掛け算。小数の桁数設定を保存する（保存の共有を確認する用）',
    url: 'tools/calc/', icon: 'icons/calc-192.png', groups: [] },
  { id: 'memo', name: 'テストメモ', desc: 'メモを保存し「誰がいつ更新したか」を記録する（名前の引き継ぎを確認する用）',
    url: 'tools/memo/', icon: 'icons/memo-192.png', groups: [] },
  { id: 'dxonly', name: 'DX専用（表示切替の確認）', desc: 'DXグループの人にだけ一覧に表示される。中身はテスト計算と同じ',
    url: 'tools/calc/', icon: 'icons/calc-192.png', groups: ['DX'] }
];
