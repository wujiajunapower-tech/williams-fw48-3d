// Modes have no start/end time. Components are a view inside Aerodynamics.
export const modes=[
 {id:'explore',name:'静态展示',english:'Explore',index:'01',title:'每一道曲面，\n都有它的目的。',description:'自由旋转、缩放，观察同一台 FW48。开启自动镜头，可缓慢环绕；点击车身进入部件解析。',label:'摄影棚 · 自由探索',tip:'拖动即可接管镜头。R 复位；1 / 2 / 3 随时切换模式。'},
 {id:'drive',name:'动态行驶',english:'Drive',index:'02',title:'贴近地面，\n感受速度。',description:'前方低位追踪、侧向跟拍、后方与贴地镜头连续循环。车身保持在画面中心，赛道提供真实尺度的运动参照。',label:'动态 · 连续跟拍',tip:'镜头循环约 28 秒。拖动可自由观察，开启自动镜头返回跟拍。'},
 {id:'aero',name:'空气动力学',english:'Aerodynamics',index:'03',title:'沿着气流，\n读懂整台赛车。',description:'五套独立流场区分翼面导流、轮胎扰动、车身绕流和底部通路。切换部件解析，深入十一大系统。',label:'气动 · 工程可视化',tip:'颜色区分流动区域，不代表计算压力。底板透视可显露车底路径。'}
];
export const componentView={id:'components',title:'从一个系统，\n深入每个部件。',description:'十一大系统、38 项子部件。选择、高亮与分解都由你控制，不再按时间自动跳转。',label:'结构 · 分层解析',tip:'分解距离可调；展示位置关系，不代表维修拆装顺序。'};
