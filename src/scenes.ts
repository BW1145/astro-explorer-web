import type { SceneId } from './data/curriculum';
export type Control = { key: string; label: string; min: number; max: number; step: number; unit: string; choices?:{value:number;label:string}[]; when?:{key:string;value:number} };
export type Mode = { id: string; label: string; controls: Control[]; goal: string; preset: Record<string, number>; hint: string };
export type Scene = { id: SceneId; name: string; english: string; title: string; subtitle: string; icon: string; modes: Mode[] };
export const primaryConceptByMode:Record<string,string> = {cluster:'cluster-age',transmission:'transmission-spectrum',remnants:'pulsars',evidence:'dark-energy-evidence',sky:'daily-sky',calendar:'matariki',moon:'moon-phases',seasons:'seasons',gravity:'kepler-orbits',spectrum:'blackbody',telescope:'telescope-design',doppler:'doppler',evolution:'red-giant',hr:'hr-diagram',binary:'binary-stars',transit:'transit',atmosphere:'gas-retention',formation:'nebular-disk',tides:'tidal-forces',distance:'parallax',rotation:'rotation-curves',collision:'bullet-cluster',structure:'milky-way',expansion:'hubble-law',history:'cosmic-density',relativity:'newton-einstein'};
const c = (key:string,label:string,min:number,max:number,step:number,unit:string):Control => ({key,label,min,max,step,unit});
const choice = (key:string,label:string,choices:{value:number;label:string}[]):Control => ({...c(key,label,0,choices.length-1,1,''),choices});
const when = (control:Control,key:string,value:number):Control => ({...control,when:{key,value}});
export const defaults:Record<string,number> = {latitude:-36.85,longitude:174.76,day:172,hour:21,phase:135,inclination:5.14,node:0,spectrumType:0,element:0,collision:.65,tilt:23.44,a:1,e:.2,temperature:5800,aperture:200,velocity:0,mass:1,age:.5,radius:3,period:10,gas:28,distance:1,parallax:.1,dark:1,scale:1,H0:70,clusterAge:1,atmosphere:1,bandStrength:.7,wavelength:760,radiusEarth:3,remnantKind:0,spinPhase:0,viewAngle:45,beamTilt:45,inspiral:.1,accelerating:1,snRedshift:.8};
export const scenes:Scene[] = [
 {id:'sky',name:'自由夜空',english:'THE OBSERVING SKY',title:'抬头，宇宙就在这里。',subtitle:'从奥克兰的地平线，重新认识日月星辰。',icon:'✧',modes:[
 {id:'sky',label:'今晚的天空',controls:[c('latitude','观测纬度',-90,90,.1,'°'),c('day','一年中的日期',1,365,1,'日'),c('hour','当地平太阳时',0,24,.1,'h')],goal:'看看南北半球的天空',preset:{latitude:51.5,longitude:-.12,hour:22,day:172},hint:'标注亮星和日月按2026年日期与坐标计算；淡点背景为装饰。时间采用当地平太阳时，计算星体在地平线下时隐藏。'},
 {id:'calendar',label:'历法与 Matariki',controls:[c('day','一年中的日期',1,365,1,'日'),c('hour','当地平太阳时',0,24,.1,'h')],goal:'来到六月的黎明',preset:{latitude:-36.85,day:172,hour:6},hint:'Matariki 的偕日升与地点、地平线、月相及社群实践有关；滑到六月不是在设定统一的庆祝日期。'}]},
 {id:'orbits',name:'轨道沙盒',english:'THE ORBITAL LAB',title:'换一个角度，看见规律。',subtitle:'把月球拖过天空，让地面与太空的视角相遇。',icon:'◎',modes:[
 {id:'moon',label:'月相与食',controls:[c('phase','月球轨道角',0,360,1,'°'),c('inclination','月球轨道倾角',0,10,.1,'°'),c('node','交点方向',0,180,1,'°')],goal:'调出一轮满月',preset:{phase:180,node:90,inclination:5.14},hint:'月相来自被照亮的半球与视线的夹角；日月食还要求接近轨道交点。交点方向与食区均按教学比例夸张，不用于真实食预报。'},
 {id:'seasons',label:'地轴与季节',controls:[c('day','一年中的日期',1,365,1,'日'),c('tilt','地轴倾角',0,45,.1,'°'),c('latitude','观测纬度',-90,90,.1,'°')],goal:'如果地轴不再倾斜',preset:{tilt:0,latitude:-36.85},hint:'倾角决定太阳直射点如何南北移动。南北半球季节相反，日地距离不是季节的主因。'},
 {id:'gravity',label:'引力与轨道',controls:[c('a','半长轴',.3,5,.01,'AU'),c('e','轨道偏心率',0,.8,.01,'')],goal:'把轨道拉成椭圆',preset:{a:2,e:.65},hint:'同一中心质量下，P² = a³。椭圆轨道中，天体靠近近日点时运动更快；示意轨道按等时间扫过等面积。'}]},
 {id:'light',name:'光与望远镜',english:'READING THE LIGHT',title:'一束光，带来整个世界。',subtitle:'温度、成分与运动，都藏在抵达眼前的光里。',icon:'⌁',modes:[
 {id:'spectrum',label:'温度与光谱',controls:[c('temperature','表面温度',2500,20000,50,'K')],goal:'让恒星变得炽热',preset:{temperature:12000},hint:'温度升高，黑体峰值移向短波，单位表面面积总辐射增加。谱线位置识别元素，线强还受温度与电离影响。'},
 {id:'telescope',label:'望远镜',controls:[c('aperture','望远镜口径',25,1000,5,'mm')],goal:'把口径加倍',preset:{aperture:400},hint:'集光能力与口径平方成正比；理想衍射角分辨率与口径成反比。实际地面观测也受大气视宁度影响。'},
 {id:'doppler',label:'多普勒',controls:[c('velocity','视向速度',-10000,10000,50,'km/s')],goal:'让光源远离我们',preset:{velocity:6000},hint:'正速度表示远离，整套谱线一起红移。图中采用径向多普勒因子 √((1+v/c)/(1−v/c))；低速时 Δλ/λ ≈ v/c。'}]},
 {id:'stars',name:'恒星一生',english:'A LIFE IN STARLIGHT',title:'质量，写下恒星的一生。',subtitle:'从云中的引力坍缩，到为下一代留下元素。',icon:'✺',modes:[
 {id:'evolution',label:'生命轨迹',controls:[c('mass','初始恒星质量',.2,30,.1,'M☉'),c('age','相对演化进度',0,1,.01,'')],goal:'看看大质量恒星的终点',preset:{mass:20,age:1},hint:'质量越大，主序消耗燃料越快。演化时间轴经过压缩；遗迹还取决于质量损失、金属丰度与双星作用。'},
 {id:'hr',label:'HR 图',controls:[c('mass','主序质量',.2,30,.1,'M☉'),c('age','演化进度',0,1,.01,'')],goal:'沿主序走向蓝端',preset:{mass:8,age:.1},hint:'HR图横轴温度向右降低，纵轴光度向上增加。颜色相近的恒星仍可能因半径不同而光度不同。'},
 {id:'cluster',label:'星团年龄',controls:[c('clusterAge','同龄星团年龄',.01,10,.01,'Gyr')],goal:'让高质量星离开主序',preset:{clusterAge:5},hint:'同一星团的恒星近似同时形成。随着年龄增大，较高质量恒星先耗尽核心氢，主序转折向低质量、低温端移动；星团点群与转折线共同更新。'},
 {id:'remnants',label:'脉冲与引力波',controls:[choice('remnantKind','观测机制',[{value:0,label:'脉冲星 · 光束扫过视线'},{value:1,label:'引力波 · 双致密星内旋'}]),when(c('spinPhase','自转相位',0,360,1,'°'),'remnantKind',0),when(c('viewAngle','观测视线倾角',0,90,1,'°'),'remnantKind',0),when(c('beamTilt','磁轴倾角',0,90,1,'°'),'remnantKind',0),when(c('inspiral','内旋进度',0,1,.01,''),'remnantKind',1)],goal:'让光束错过观测者',preset:{remnantKind:0,viewAngle:85,beamTilt:15},hint:'脉冲星的光束只有扫过视线才形成周期脉冲；双致密星内旋产生随时间频率与振幅上升的引力波。两种机制使用不同观测信号，时间和尺度均作教学压缩。'},
 {id:'binary',label:'双星与遗迹',controls:[c('mass','主星质量',.5,20,.1,'M☉'),c('age','轨道相位',0,1,.01,'')],goal:'让双星质量变得悬殊',preset:{mass:10},hint:'两颗星围绕共同质心运动。双星观测可给出质量；吸积白矮星与大质量星核心坍缩的超新星机制不同。'}]},
 {id:'planets',name:'行星工坊',english:'WORLDS IN THE MAKING',title:'寻找另一个世界的线索。',subtitle:'从尘埃盘到遥远的微小光变，让行星留下证据。',icon:'◉',modes:[
 {id:'transit',label:'凌日探测',controls:[c('radius','行星半径',1,12,.1,'R⊕'),c('period','轨道周期',1,100,1,'日')],goal:'找一颗更小的行星',preset:{radius:1,period:30},hint:'中心凌日深度约为 (Rp/R★)²。几何对齐与观测时长造成选择偏差；凌日给大小，视向速度约束质量。'},
 {id:'transmission',label:'透射光谱',controls:[choice('atmosphere','大气层',[{value:0,label:'关闭大气'},{value:1,label:'开启大气'}]),c('radiusEarth','固体行星半径',1,12,.1,'R⊕'),c('wavelength','观测波长',400,1000,1,'nm'),when(c('bandStrength','示意吸收带强度',0,1,.01,''),'atmosphere',1)],goal:'比较吸收带与连续谱',preset:{atmosphere:1,bandStrength:1,wavelength:760},hint:'不同波长的吸收改变行星大气的有效遮挡半径，因而改变凌日深度。这里的代表带是合成教学模型，不能据此认定真实行星的具体成分。'},
 {id:'atmosphere',label:'大气与宜居',controls:[c('temperature','气体温度',100,2000,10,'K'),c('mass','行星质量',.1,10,.1,'M⊕'),c('gas','分子相对质量',2,44,1,'u')],goal:'比较氢气能否留下',preset:{temperature:800,mass:1,gas:2},hint:'气体热运动速度与 √(T/m) 成正比。高温、低重力及轻气体更容易逃逸；宜居带不等于一定宜居。'},
 {id:'formation',label:'形成与霜线',controls:[c('distance','距原恒星距离',.2,20,.1,'AU')],goal:'跨过盘中的霜线',preset:{distance:5},hint:'霜线外可凝结更多冰，帮助固体核心长大。太阳星云的霜线会演化，图中采用约2.7 AU的教学示意。'},
 {id:'tides',label:'潮汐与卫星',controls:[c('distance','相对轨道半长轴',1,5,.1,''),c('e','轨道偏心率',0,.6,.01,'')],goal:'让卫星靠近行星',preset:{distance:1,e:.4},hint:'潮汐来自引力的空间差异，强度约随距离立方反比变化；偏心轨道中反复形变可产生潮汐加热。'}]},
 {id:'galaxy',name:'银河和距离',english:'MEASURING THE INVISIBLE',title:'看见的光，看不见的质量。',subtitle:'从一角秒的偏移，走到银河与暗物质的证据。',icon:'◌',modes:[
 {id:'distance',label:'宇宙距离阶梯',controls:[c('parallax','年周视差',.01,1,.01,'角秒')],goal:'把恒星移到一百秒差距',preset:{parallax:.01},hint:'d(pc) = 1/p(角秒)，p是一年位置摆动的半角。基线、角度与标定让视差连接到标准烛光。'},
 {id:'rotation',label:'暗物质证据',controls:[c('dark','暗晕贡献',0,1,1,''),c('distance','银河中心距离',1,30,.5,'kpc')],goal:'只留下可见物质',preset:{dark:0,distance:25},hint:'外盘旋转速度维持较高值，说明质量分布超出发光盘。星系团、透镜与子弹星系团给出独立证据。'},
 {id:'collision',label:'子弹星系团',controls:[c('collision','碰撞进度',0,1,.01,''),c('dark','暗物质模型',0,1,1,'')],goal:'让气体与星系分离',preset:{collision:.8,dark:1},hint:'碰撞中的热气体受阻，星系与透镜重建的主要质量中心继续向前。这里演示证据的空间关系，色彩分别代表观测示踪量，不是暗物质照片。'},
 {id:'structure',label:'银河与星系',controls:[c('age','俯视到侧视',0,1,.01,'')],goal:'从银河平面看过去',preset:{age:1},hint:'太阳位于银河盘内。尘埃遮挡让早期可见光星数计数误判太阳位置；球状星团与红外观测补足视角。'}]},
 {id:'cosmos',name:'宇宙时间线',english:'THE EXPANDING STORY',title:'宇宙，在每一处展开。',subtitle:'把尺度拉开，看过去的光如何抵达今天。',icon:'↗',modes:[
 {id:'expansion',label:'膨胀与红移',controls:[c('scale','宇宙尺度因子',.3,2,.01,''),c('H0','哈勃常数',50,90,1,'km/s/Mpc')],goal:'让宇宙大小加倍',preset:{scale:2},hint:'均匀膨胀中，越远的星系退行越快；没有特殊中心。引力束缚的银河、太阳系和原子不随哈勃流一起膨胀。'},
 {id:'history',label:'物质与暗能量',controls:[c('scale','相对今日尺度',.2,2,.01,'')],goal:'回到物质占优的时代',preset:{scale:.3},hint:'物质密度随 a⁻³、辐射随 a⁻⁴ 稀释；宇宙常数形式的暗能量密度保持不变。加速膨胀由距离与红移的证据推断。'},
 {id:'evidence',label:'暗能量证据',controls:[choice('accelerating','对比膨胀模型',[{value:0,label:'仅物质 · 减速模型'},{value:1,label:'物质与Λ · 加速模型'}]),c('snRedshift','选取超新星红移',.02,1.5,.01,'')],goal:'对比减速模型的距离残差',preset:{accelerating:0,snRedshift:1},hint:'合成超新星点模拟已标准化亮度后的距离测量。比较相同红移处的距离模数与模型残差，观察为什么单一减速模型难以匹配；模型的物质/Λ参数属于解释假设。'},
 {id:'relativity',label:'引力与时空',controls:[c('mass','引力源相对质量',1,10,.1,''),c('distance','相对经过距离',1,5,.1,'')],goal:'让光更靠近质量',preset:{mass:8,distance:1},hint:'广义相对论以时空曲率描述引力。弯曲的网格是二维类比，光路偏折与引力波来自可检验的观测。'}]}
];
