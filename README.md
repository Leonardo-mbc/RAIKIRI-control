# RAIKIRIの制御用プログラム
載せているセンサーは、秋月仕様のLIS3DH（3軸加速度センサーモジュール）と、同じく秋月仕様のAE-L3GD20（3軸ジャイロセンサーモジュール）

## 出力仕様
i2c通信（Aruduino Uno A4, A5）にて加速度を送信  
各軸の加速度値を100msごとに算術平均を取り速度に変換  

加速度センサーとジャイロセンサーの値は符号付き8bitをOUT_Hの値（上位1オクテット）とOUT_Lの値（下位1オクテット）で結合した16bitにて構成  
速度変換はこの16bitから符号ビット2bitを取り除いた14bitで割わり、重力加速度をかけることで行った
```
acclr[axis] = (h << 8 | l) / 16384.0 * 9.8;
```

### 出力設定
```
#define ENABLE_MOVEAVG false
#define LOWPASS_FILTER false
#define ZEROS_MOD false
```
`ENABLE_MOVEAVG`を`true`にすることで、加速度センサーから得られる値の移動平均を算出する
>このとき、`MOVING_STEPS`にて遅れステップをintで設定  

`LOWPASS_FILTER`を`true`にすることで、加速度センサーの値に簡易的なローパスフィルターをかける
>遅れは1ステップのみで`(preview * 0.9) + (new * 0.1)`のように前の値9、今の値1で用いる  

`ZEROS_MOD`を`true`にすることで、初期出力の平均値を現在地から減算する
>`LEARN_STEPS`を設定することで初期出力の`LEARN_STEPS`ステップ分だけサンプルをとり平均値として保持する  

## モニター
![3](https://user-images.githubusercontent.com/6761278/40275234-67e2a66c-5c25-11e8-9470-10c9f693587b.png)
