# FW48 赛车技术视界 · 模式交互升级

在现有网站上升级控制、驾驶与气流。保留原有 GLB 赛车、涂装、UV、PBR 材质、摄影棚灯光、Three.js 渲染设置和中文视觉设计。

默认模型仍为 Blender 照片参考重建迭代版，非官方 CAD。气流为教学路径，非 CFD；驾驶速度、翼片和悬挂微动均为展示参数。

## 在线体验

GitHub Pages：https://wujiajunapower-tech.github.io/williams-fw48-3d/

无需安装，使用支持 WebGL 2 的现代浏览器即可。

## 本机运行

双击本目录 **打开网页.cmd**，或运行：

```powershell
Set-Location '你的项目目录\williams-fw48-3d'
.\OPEN.ps1
```

固定预览地址：**http://127.0.0.1:5180/**。入口会启动本地后台服务。不要直接双击 HTML；模型与模块需要 HTTP 服务。

开发与构建（Node.js 22.12+ 或 24 LTS）：

```powershell
npm ci
npm run dev
npm run build
```

开发地址 http://127.0.0.1:5173/ 。构建写入 dist，现有 5180 预览刷新后即可读取新版。浏览器需支持 WebGL 2 并开启硬件加速。

## 三种模式

中央视口底部的玻璃控制台可随时切换，已删除传统播放器、时间显示、拖动时间轴、阶段排程和自动轮播部件逻辑。

| 模式 | 交互 |
| --- | --- |
| 静态展示 Explore | 静止车身、自由旋转缩放、可选慢速自动环绕、平滑复位 |
| 动态行驶 Drive | 平滑起步、速度起伏、赛道运动、车轮同步滚动、28 秒闭合镜头循环 |
| 空气动力学 Aerodynamics | 气流可视化 / 部件解析两个子视图，共用同一赛车 |

- 拖动接管镜头；滚轮或双指缩放。「自动镜头」恢复当前模式镜头。
- 「复位」平滑回到完整车身视角，保留自由控制。
- Drive 支持完整序列、前方低位、侧拍、后方低位、贴地镜头。
- Drive 和 Aero 的「暂停动态」冻结行程、车轮、气流相位与自动镜头；模式切换仍可用。
- 点击车身可直接进入对应部件解析；十一系统、38 项子部件、聚焦、两级分解、说明和分解距离保持可用。
- 1 / 2 / 3 切换模式；左右方向键切换模式；R 复位；空格暂停或继续动态。输入控件与对话框内不抢占快捷键。
- 切换浏览器标签页会暂停。系统“减弱动态”开启时默认关闭自动镜头，关闭次级振动和环境拖影；显式选择镜头仍可启用。

## 驾驶实现

车辆在跟拍参考系中保持原点，不横向往返滑动。赛道、路肩、标线与护栏向 +X 运动，车头朝 -X；道路运动和轮胎相位共用米制累计行程。轮胎使用各自 rollingRadius，旋转方向通过接地点速度验证。

28 秒闭合 Catmull–Rom 样条控制机位和注视点。镜头依次经过低位前追、侧拍、低位后追、扩散器近景、贴地和远景回收；两端位置与切线连续。固定机位与模式切换都从当前镜头位置阻尼过渡，不重置相机。

速度目标为周期曲线，采用指数响应自然起步、巡航与轻微收油，累计行程在循环和切换时不归零。暂停直接冻结，不补算后台失去的时间。离开 Drive 后短暂平滑收束轮端与车身运动。

新增赛道使用五个 InstancedMesh 批次及一张自制沥青纹理，保留原灯光、接触阴影和阴影渲染器。环境速度拖影采用地面定向透明拖线，**不是全屏速度缓冲运动模糊**；车身与赞助商图案不参与模糊。轮端保持地面高度，仅车身和悬挂施加毫米级教学微动，非真实弹簧阻尼求解。

## 五套气流系统

| 系统 | 颜色 | 表达 |
| --- | --- | --- |
| 前翼 | 青蓝 Cyan | 有序来流、翼片附近分层与偏转 |
| 前轮尾流 | 橙 Orange | 前轮后方的扩张螺旋扰动 |
| 侧箱及车身 | 绿 Green | 下切、肩部、发动机盖三层绕流 |
| 底板及扩散器 | 紫 Purple | 低矮通路、局部快速示踪、扩散器上扬出流 |
| 后翼及车尾 | 红 Red | 翼面上下流路、上洗与扩散尾迹 |

共 108 条设计路径，合批流管 BufferGeometry + GPU 移动脉冲 + InstancedMesh 方向箭头 + 短示踪尾迹。没有随机逐帧抛点；颜色表示系统，不表示压力。

每组可独立显隐，点击名称突出局部，恢复全场可重启全部组。密度控制显示数量；轮胎尾流另有总开关。底板透视平滑降低车身/底板透明度，不修改原 PBR 基准；退出气流模式恢复。透明排序仍可能出现局部伪影。

## 工程结构

```text
src/
  app.js                         模式、选择、输入与单一渲染循环
  animations/StoryDirector.js    模式状态、速度积分、28 秒闭合机位
  animations/CameraRig.js        可打断的绕车过渡，避免穿过车身
  scenes/TechnicalStudio.js      保留渲染和灯光；接入模式、拾取、分解
  scenes/DriveEnvironment.js     轻量合批赛道、运动参照、环境拖影
  components/FlowField.js        五系统路径、着色器、方向箭头
  components/Car.js              保留备用模型；聚焦/透视组合与还原
  components/Materials.js        原材质模块，未修改
  assets/loadCarModel.js         原 GLB 适配器，未修改
  data/story.js                  无时长排程的模式文案
  data/technical.js              原十一系统、38 项子部件说明
  ui/ChineseInterface.js         浮动控制台、模式面板、气动子视图
  ui/modes.css                   模式控制台及局部布局覆盖
  ui/technical.css              原中文主题和响应式基础
  ui/readability.css            原中文字体与可读性
public/models/fw48/fw48.glb      原赛车资产，逐字节保留
tests/modes-*.mjs                本次验证
test-results/modes/              截图与报告
tests/asset-baseline.json        原材质/渲染与模型的跨平台校验基准
```

旧文件名 StoryDirector 保留以减小集成范围，内部已无 GSAP 影片时间轴。Three.js 0.186.1 / Vite 8.3.4 / 原生模块；无新增运行依赖、远程字体、远程环境贴图。

## 调整动画与讲解

- 驾驶循环：StoryDirector.js 的 DRIVE_CYCLE、positions、targets 和镜头名称；曲线 closed 必须保持 true。
- 速度：Director.update 的周期目标速度、响应系数；单位 m/s。不要独立驱动车轮或重置累计 distance。
- 模式过渡：state.road / state.flow 的阻尼系数；相机由 Studio 从实际当前姿态追踪目标，避免启动并行时间轴。
- 气流：FlowField.js 的五组颜色、说明、路径控制点、速度和半径。坐标米制、Y-up、车头 -X。
- 部件：data/technical.js 的 where / function / detail / impact / observe / subparts；网格 extras.subpart 需保持匹配。
- 界面：data/story.js 的模式文案与 ui/ChineseInterface.js。保持系统中文字体与本地资源。

## 模型替换（本次没有替换）

模型契约见 assets/MODEL_CONTRACT.md。使用未压缩 glTF 2.0 / GLB、米制、Y-up、车头 -X。保留十一系统分组、四轮轴心 wheel_FL / FR / RL / RR、rollingRadius 与子部件标签。FBX 可经 Blender 转 GLB。

默认路径 public/models/fw48/fw48.glb。可通过 ?model=相对GLB路径 指定其他模型；?model=procedural 为备用程序化模型。缺失分组时回退并提示，不会损坏原资产。未配置 Draco / KTX2 解码器。替换后必须重新校准气流、相机与拾取，不能只看是否加载成功。

## GitHub Pages 与验证

vite.config.js 保留 base:'./'，模型路径相对于 document.baseURI。推送 main 后，.github/workflows/deploy-pages.yml 自动校验、构建并发布 dist；无需服务端。首次启用时在仓库 Settings → Pages 选择 GitHub Actions。源码仓库不包含本地备份、私用参考照片或录屏帧。生产测试额外在 /fw48/ 子路径运行同一构建，验证脚本、样式和 GLB 的相对路径。

开发服务运行时：

```powershell
npm run test:motion
npm run test:e2e
```

构建及 5180 预览运行时：

```powershell
npm run build
npm run test:production
```

数学/资产检查：镜头闭环位置与速度连续、环绕半径、行程积分、轮胎旋转方向、暂停与快速切换、五组独立遮罩、GLB SHA256、原渲染/灯光片段及原材质模块。浏览器检查：真实拖动缩放、三模式、五组开关、透视恢复、38 子部件映射、快速打断、减弱动态、390/617/768/1024 视窗、着色器和资源错误。报告及截图写入 test-results/modes/。

模型 SHA256：
`9c51e12861374cac62cba2b773193cd5fb27788a90d42dcc38d67cf07ac2c308`

默认使用本机 Edge，可用 BROWSER_PATH / BASE_URL / PRODUCTION_URL 覆盖。软件 WebGL 测试不能替代真实手机或独显帧率测试；报告会明确区分验证内容。

## 已知限制与后续方向

- 原车照片重建精度、涂装与隐藏结构的近似仍存在。本次仅升级展示系统，未重新建模或改变 PBR / 灯光。
- 气流不是 CFD，分解不是维修顺序；速度与车身微动不是 FW48 遥测或车辆动力学仿真。
- 透明模型存在排序局限；环境拖影不包含真实快门积分。
- 大型 Three.js 运行库仍有构建体积提示。可后续加入模型 LOD、KTX2、GPU 流场采样与设备画质档位。
- 后续可导入有来源与工况的 CFD 数据，增加独立发动机音轨及固定帧率影片输出。

公开参考与品牌使用边界继续见 assets/references/SOURCES.md。
