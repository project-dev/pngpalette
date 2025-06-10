- [PNG PALETTE ANIMATION SAMPLE](#png-palette-animation-sample)
- [既知の問題](#既知の問題)
- [ToDo](#todo)

# PNG PALETTE ANIMATION SAMPLE

8bitカラーでパレット形式のPNG画像でパレットアニメーションさせるサンプル的なものです。

既存ライブラリを使ったほうがよいと思います。

以下のサイトを参考にしました。

- https://www.setsuki.com/hsp/ext/png.htm
- http://var.blog.jp/archives/62330155.html

今後はTypeScriptで開発していこうと思います。

index.htmlはPureJSで実装したものになります。
index_ts.htmlはTypeScriptで開発したものになります。

----

This is a sample palette animation of a PNG image in palette format with 8-bit colors.

I think it is better to use an existing library.

I refer to the following site.

- https://www.setsuki.com/hsp/ext/png.htm
- http://var.blog.jp/archives/62330155.html

From now on, I will develop with TypeScript.

index.html is implemented with PureJS. This one will not be updated in the future.
index_ts.html will be developed with TypeScript.

----

# 既知の問題

- PNGの読み込みに失敗する場合がある 
  - zipの解凍に失敗していることまでは判明

# ToDo

- 不要な情報は持たないようにする
  - 読み込んだデータそのまま持ってるのは多分よくない
- TypeScript再チャレンジ
  - なんか面倒になって中途半端になっている
- 多分読めない(未対応)なPNGがあるかもしれないのでその辺調べて何とかする