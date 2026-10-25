import { useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { placeSkyLabels } from '../lib/skyLabels';
import { raDecToHorizontal, sunEquatorial, moonHorizontal, lunarPhase, solarDeclination, daylightHours, solarAltitude, cosmicAge, rotationSpeed, transitDepth } from '../lib/astro';
import AdvancedExperiments from './AdvancedExperiments';
import './Universe.css';

type Scene = 'sky' | 'orbits' | 'light' | 'stars' | 'planets' | 'galaxy' | 'cosmos';
type Props = { scene: Scene; mode: string; values: Record<string, number>; onChange: (key: string, value: number) => void };
const TAU = Math.PI * 2;
const rad = (n: number) => n * Math.PI / 180;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const wrap = (n: number, m = 360) => ((n % m) + m) % m;
const seed = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blackbodyColor = (t: number) => t < 3500 ? '#ff9b68' : t < 5000 ? '#ffca91' : t < 6500 ? '#fff1ce' : t < 10000 ? '#e3efff' : '#9bc7ff';
const sceneLabels: Record<Scene, string> = { sky: '自由夜空', orbits: '轨道沙盒', light: '光与望远镜', stars: '恒星一生', planets: '行星工坊', galaxy: '银河和距离', cosmos: '宇宙时间线' };
const descriptions: Record<string, string> = {
  sky: '地平展开星图，北、东、南、西依次从左向右。恒星、太阳与月亮按2026年日期、当地平太阳时和经纬度投影，地平线下星体不显示。',
  calendar: '以Matariki星团和季节天空观察历法。地点、日期与太阳时决定星团是否位于地平线以上；太阳在地平线下时以虚线标出其方位，高度和太阳到星团的真实天球角距另列读数。本图不规定社群庆祝日期。',
  moon: '左图是日地月几何，太阳光从左侧照来；可拖动月球，或用实验台滑条与方向键调节。右图是月面照明示意图标，未计算地点、时间和观测者方向造成的月面朝向。轨道倾角和交点影响日月食对齐，模型不用于食预报。',
  seasons: '左图地轴朝向的投影随日期改变，黄色点表示所选纬度。右图用日期、纬度与真实地轴倾角计算全天太阳高度；太阳在地平线以上的时段就是白昼。',
  gravity: '倾斜投影的椭圆轨道中，太阳处于真实轨道焦点。行星按开普勒方程运动，浅色扇形表示固定时间间隔扫过的面积；蓝色箭头为统一比例下的投影速度矢量，三维速率由活力公式计算，金色箭头表示引力方向。',
  spectrum: '恒星颜色和黑体谱峰随温度变化，曲线按自身峰值归一化。下方是可选择氢或氦的吸收、发射谱线示意。',
  telescope: '反射式望远镜把平行光线汇聚并导向探测器。口径增大提高集光力并改善理想衍射分辨率；读数使用550纳米波长。',
  doppler: '光源远离观测者时谱线向更长波长移动，接近时向更短波长移动。上条是实验室光谱，下条是按相对论多普勒因子缩放波长的观测光谱。',
  evolution: '初始质量控制恒星生命路径和主序寿命。演化进度指示当前阶段；图中阶段长度和天体大小为示意。',
  hr: '赫罗图的横轴从左到右由热变冷，纵轴由暗变亮。主序、巨星与白矮星区域分别标出，亮环根据初始质量与示意演化进度移动。',
  binary: '两颗恒星围绕共同质心运动。主星质量可调，伴星固定一个太阳质量；下方两条径向速度曲线振幅反映它们的质量比。',
  transit: '行星经过恒星前方造成亮度下降。上方行星接触恒星边缘的时刻与下方光变曲线同步。行星图形单独放大；通量图使用固定的0到1.3%下降范围，无最小深度钳制，半径加倍时真实深度和曲线下降幅度都变为四倍。',
  atmosphere: '地球半径固定的行星周围，分子热运动速度与逃逸速度比较。改变温度、行星质量或气体分子质量可以探索气体保留条件。',
  formation: '原行星盘由岩石、金属与冰形成固体核心。金色轨道显示所选距离，虚线雪线固定在2.7天文单位作示意；播放展示盘中物质吸积。',
  tides: '月球引力在行星近侧和远侧的差异引起两侧潮汐形变。距离和偏心率控制即时潮汐强度，随距离立方反比改变；海洋形变大幅夸张。',
  distance: '左右两处地球位置相隔半年，形成视差基线。播放让地球沿轨道运动，同时右图亮环相对遥远背景星年周摆动。视差角越小，恒星越远。',
  rotation: '虚线按可见物质计算旋转曲线，实线可额外包含暗物质晕；关闭暗物质时两条曲线重合。亮点给出所选银心距离处的速度，并按同一压缩时间下的角速度v除以半径运动。',
  collision: '星系团碰撞的定性重构中，气体受到碰撞阻力，星系与弱相互作用质量分布继续通过。蓝紫轮廓表示透镜推断的质量；可切换仅跟随可见气体的假设。',
  structure: '银河旋臂、中央核球、恒星盘与太阳系位置的艺术示意。观察角度可以从盘面转向侧面；播放中的转动经过加速。',
  expansion: '共动网格随尺度因子伸展，星系间距离增大；星系本身大小保持不变。所选星系距离和退行速度遵循附近宇宙的哈勃定律，观测位置不是宇宙中心。',
  history: '对数压缩时间线标出早期事件、第一批恒星、太阳系形成与今天。固定对数密度图分别展示辐射随尺度四次方反比、物质随尺度立方反比下降，以及暗能量密度保持常数。密度示意与只含物质加宇宙常数的晚期年龄模型分开。',
  relativity: '背景光源的光线经过前景质量后偏折并抵达观察者。调高质量或减小光线经过距离，会提高相对偏折。时空网格和光路是定性示意。',
};
// HTML labels retain readable type when the diagram is scaled to a phone width.
const compactKeys: Record<string, string[]> = {
  sky: ['从左到右：北 → 东 → 南 → 西 → 北。星点越高，高度角越大；地平线下的天体不显示。'],
  calendar: ['青色圆环为 Matariki；虚线标出太阳方位，地下太阳仅为方向标记。天球角距不能用图上的水平距离代替。'],
  moon: ['拖动左侧月球，或用滑条／方向键调节。太阳光从左侧照来；右侧是月面照明图标，未计算观测朝向。', '新月、满月接近轨道交点时才可能发生食；图形与食阈值为示意。'],
  seasons: ['左：地轴投影，黄点代表所选纬度。右：横轴为当地太阳时 0–24 h，纵轴为太阳高度。', '金色水平线是地平线 0°；太阳在其上方的时段就是白昼。'],
  gravity: ['蓝箭头：统一比例的投影速度；金箭头：引力方向。浅色扇形表示固定时间扫过的面积。', '太阳位于真实轨道焦点；画面纵向压缩 ×0.67，速度按 v² = GM(2/r − 1/a) 计算。'],
  spectrum: ['曲线横轴：波长 100–2000 nm，向右增大；纵轴：按自身峰值归一化的辐射强度。', '底部光谱带：380–750 nm 可见光。彩色连续谱上的暗线为吸收线，暗背景亮线为发射线。'],
  telescope: ['光路：平行光 → 主镜 → 次镜 → 目镜／探测器。圆形图显示镜面口径 D。', '集光力 ∝ D²；550 nm 理想分辨角约为 138 / D（D 用 mm，结果为角秒）。'],
  doppler: ['上条：实验室参考光谱。下条：观测光谱。波长从左至右为 380–750 nm。', '远离时谱线向右红移；接近时向左蓝移。相同谱线按波长比例移动。'],
  evolution: ['沿连线从左到右阅读演化阶段；亮色路径和下划线标出当前进度。', '各阶段时间、天体大小均为示意；改变初始质量会改变演化终点。'],
  hr: ['横轴：温度 40,000 → 2,500 K，向右更冷。纵轴：光度 10⁻⁴ → 10⁶ L☉，向上更亮。', '斜带为主序，右上为巨星，左下为白矮星；亮环为所选恒星的示意演化位置。'],
  binary: ['黄星：可调主星。蓝星：固定 1 M☉ 伴星。十字：两星的共同质心。', '下图横轴为时间，纵轴为径向速度；质量较小的恒星速度振幅较大。'],
  transit: ['下图横轴：时间。纵轴：相对通量 1.0000–0.9870，对应固定 0–1.3% 下降。', '行星圆单独放大；曲线没有最小深度钳制，半径加倍会使通量下降变为四倍。'],
  atmosphere: ['行星半径固定 1 R⊕。蓝条：逃逸速度。金条：气体分子方均根速度。', '粒子速度存在分布；长期逃逸取决于高速尾部，不能只比较单个平均速度。'],
  formation: ['实线：所选原行星轨道。虚线：2.7 AU 示意雪线。轨道半径按对数压缩。', '雪线内主要凝结岩石和金属；雪线外冰也能凝结，固体原料更多。'],
  tides: ['近侧引力较强、远侧较弱，形成两侧潮汐隆起。偏心轨道使距离随时间改变。', '潮汐强度 ∝ d⁻³；海洋形变大幅夸张，真实潮汐还受地形、海盆和太阳影响。'],
  distance: ['左：地球两次观测相隔半年，基线半径 1 AU。右：相对遥远背景星的年周摆动。', '摆动全幅为 2p，亮环为当前像。d(pc) = 1 / p(角秒)；图上角度和位移大幅放大。'],
  rotation: ['横轴：银心距离 0–30 kpc。纵轴：轨道速度 0–350 km/s。灰虚线仅含可见物质，金线为当前模型。', '亮点按 ω = v(r) / r 运动；播放 1 s 统一对应 31.7 Myr。'],
  collision: ['金点：星系。粉红：X 射线热气体。蓝紫轮廓：透镜推断的质量分布。', '碰撞后气体受到阻力，星系与暗物质继续通过；本图是证据的定性重构。'],
  structure: ['银河的中央核球、棒状结构、旋臂和恒星盘。金色标记为太阳系，距银心约 8 kpc。', '可切换盘面与侧视角；旋臂形态和加速转动均为示意。'],
  history: ['右图为固定双对数坐标：横轴 a = 10⁻⁴–2；纵轴 ρ / ρc,₀ = 10⁻⁶–10¹²。', '辐射 ∝ a⁻⁴，物质 ∝ a⁻³，暗能量密度恒定；密度图与未含辐射的晚期年龄模型分开。'],
  relativity: ['左：背景光源。中：前景质量。右：观测者。蓝、金两线为示意光路，b 为经过距离。', '弱场偏折 α ≈ 4GM / (bc²)：质量越大、经过距离越小，偏折越大。'],
  expansion: ['网格间距随尺度因子 a 增大，星系本身大小保持不变。观测位置不是宇宙中心。', '附近宇宙退行速度 v = H₀d；任选一个观测者都会看到相同的均匀膨胀规律。'],
};

function Caption({ x, y, children, small = false, essential = false, anchor = 'start', color }: { x: number; y: number; children: ReactNode; small?: boolean; essential?: boolean; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  return <text x={x} y={y} textAnchor={anchor} className={`u-label${small ? ' u-small' : ''}${essential ? ' u-essential' : ''}`} style={color ? { fill: color } : undefined}>{children}</text>;
}
function Readout({ x, y, label, value, unit = '' }: { x: number; y: number; label: string; value: string; unit?: string }) {
  return <g className="u-readout"><Caption x={x} y={y} small>{label}</Caption><text x={x} y={y + 36} className="u-number">{value}<tspan className="u-unit"> {unit}</tspan></text></g>;
}
function Star({ x, y, r = 30, color = '#fff0cd', glow = true }: { x: number; y: number; r?: number; color?: string; glow?: boolean }) {
  return <g>{glow && <circle cx={x} cy={y} r={r * 2.8} fill={color} opacity=".065" filter="url(#u-blur)"/>}<circle cx={x} cy={y} r={r} fill={color}/><circle cx={x - r * .25} cy={y - r * .28} r={r * .68} fill="url(#u-starLight)"/><circle cx={x} cy={y} r={r * 1.1} fill="none" stroke={color} opacity=".15" strokeWidth={r * .14}/></g>;
}
function Earth({ x, y, r = 40, angle = 0 }: { x: number; y: number; r?: number; angle?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${r / 50})`}><circle r="52" fill="#74baff" opacity=".1"/><circle r="50" fill="url(#u-earth)"/><path d="M-34 -31 -12 -42 6 -35 11 -20 -3 -6 -13 -8 -18 9 -35 4 -43 -9ZM1 8 15 2 29 12 22 29 10 43 1 31ZM25 -37 40 -26 47 -8 35 -8 22 -20Z" fill="#80b6a7" opacity=".73"/><ellipse rx="47" ry="15" fill="none" stroke="#d4edff" opacity=".13"/><path d="M0 -49C-28 -24 -28 25 0 49M0 -49C28 -24 28 25 0 49" fill="none" stroke="#d4edff" opacity=".12"/><circle r="50" fill="url(#u-shade)"/><path d="M-39 -31A50 50 0 0 1 31 -39" stroke="#d9f0ff" strokeWidth="2" fill="none" opacity=".6"/></g>;
}
function MoonFace({ x, y, r, phase }: { x: number; y: number; r: number; phase: number }) {
  const a = rad(wrap(phase));
  const c = Math.cos(a), waxing = Math.sin(a) >= 0;
  const path = `M0 ${-r} A${r} ${r} 0 0 ${waxing ? 1 : 0} 0 ${r} A${Math.max(.001, Math.abs(c) * r)} ${r} 0 0 ${waxing ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0)} 0 ${-r}Z`;
  return <g transform={`translate(${x} ${y})`}><circle r={r + 5} fill="#d7e8f4" opacity=".025"/><circle r={r} fill="#222b39"/>{Math.abs(wrap(phase)) > .01 && <path d={path} fill="url(#u-moon)"/>}<circle cx={-r * .22} cy={-r * .32} r={r * .17} fill="#142133" opacity=".1"/><circle cx={r * .28} cy={r * .27} r={r * .24} fill="#142133" opacity=".1"/><circle cx={r * .4} cy={-r * .4} r={r * .1} fill="#142133" opacity=".1"/><circle r={r} fill="none" stroke="#d1e0e8" strokeOpacity=".15"/></g>;
}
function Grid({ x, y, width, height, nx = 6, ny = 4 }: { x: number; y: number; width: number; height: number; nx?: number; ny?: number }) {
  return <g className="u-grid">{Array.from({ length: nx + 1 }, (_, i) => <line key={`x${i}`} x1={x + width * i / nx} x2={x + width * i / nx} y1={y} y2={y + height}/>)}{Array.from({ length: ny + 1 }, (_, i) => <line key={`y${i}`} y1={y + height * i / ny} y2={y + height * i / ny} x1={x} x2={x + width}/>)}</g>;
}

// Bright-star positions in degrees (J2000); precession, refraction and extinction are omitted.
const brightStars: [string, number, number, number][] = [
  ['Sirius', 101.287, -16.716, -1.46], ['Canopus', 95.988, -52.696, -.74], ['α Centauri', 219.902, -60.834, -.27], ['Arcturus', 213.915, 19.182, -.05], ['Vega', 279.235, 38.784, .03], ['Capella', 79.172, 45.998, .08], ['Rigel', 78.634, -8.202, .13], ['Procyon', 114.825, 5.225, .34], ['Achernar', 24.429, -57.237, .46], ['Betelgeuse', 88.793, 7.407, .5], ['Hadar', 210.956, -60.373, .61], ['Altair', 297.696, 8.868, .76], ['Acrux', 186.65, -63.099, .76], ['Aldebaran', 68.98, 16.509, .85], ['Spica', 201.298, -11.161, .97], ['Antares', 247.352, -26.432, 1.06], ['Pollux', 116.329, 28.026, 1.14], ['Fomalhaut', 344.413, -29.622, 1.16], ['Deneb', 310.358, 45.28, 1.25], ['Mimosa', 191.93, -59.689, 1.25], ['Regulus', 152.093, 11.967, 1.35], ['Adhara', 104.656, -28.972, 1.5], ['Shaula', 263.402, -37.104, 1.62], ['Gacrux', 187.792, -57.113, 1.63], ['Bellatrix', 81.283, 6.35, 1.64], ['Elnath', 81.573, 28.608, 1.65], ['Alnair', 332.058, -46.961, 1.74], ['Alnitak', 85.19, -1.943, 1.77], ['Alioth', 193.507, 55.96, 1.77], ['Dubhe', 165.932, 61.751, 1.79], ['Wezen', 107.098, -26.393, 1.83], ['Sargas', 264.329, -42.998, 1.86], ['Kaus Australis', 276.043, -34.384, 1.85], ['Avior', 125.629, -59.51, 1.86], ['Alkaid', 206.885, 49.314, 1.86], ['Menkalinan', 89.882, 44.947, 1.9], ['Alhena', 99.428, 16.399, 1.93], ['Peacock', 306.412, -56.735, 1.94], ['Alsephina', 131.175, -54.709, 1.96], ['Mirzam', 95.675, -17.956, 1.98], ['Alphard', 141.897, -8.659, 1.98], ['Polaris', 37.955, 89.264, 1.98], ['Hamal', 31.793, 23.462, 2.0], ['Diphda', 10.897, -17.987, 2.04], ['Alpheratz', 2.097, 29.09, 2.06], ['Saiph', 86.939, -9.67, 2.09], ['Matariki', 56.75, 24.12, 1.6], ['Mintaka', 83.002, -.299, 2.23], ['Caph', 2.295, 59.15, 2.27], ['Dschubba', 240.083, -22.621, 2.29], ['Merak', 165.46, 56.382, 2.37], ['Phecda', 178.458, 53.695, 2.44], ['Megrez', 183.857, 57.033, 3.31], ['Alcor', 201.306, 54.988, 3.99],
];

export default function Universe({ scene, mode, values, onChange }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [skyLabelFont,setSkyLabelFont]=useState(20);
  useLayoutEffect(()=>{
    if(scene!=='sky'||!svg.current)return;
    const element=svg.current;
    const resize=()=>{const rect=element.getBoundingClientRect(),scale=Math.min(rect.width/1000,rect.height/585);if(scale>0)setSkyLabelFont(Math.max(16,Math.min(64,13/scale)));};
    const observer=new ResizeObserver(resize);observer.observe(element);resize();return()=>observer.disconnect();
  },[scene,mode]);
  if (['cluster', 'transmission', 'remnants', 'evidence'].includes(mode)) return <AdvancedExperiments scene={scene} mode={mode} values={values} onChange={onChange}/>;
  const val = (key: string, fallback: number) => values[key] ?? fallback;
  const phase = val('phase', 135), day = val('day', 172), tilt = val('tilt', 23.44);
  const temperature = val('temperature', scene === 'planets' ? 300 : 5800);
  const mass = val('mass', 1), age = val('age', .5);
  const clock = val('clock', 0);
  const moonDrag = (event: PointerEvent<SVGGElement>) => {
    if (event.type !== 'pointerdown' && event.buttons === 0) return;
    event.preventDefault();
    if (event.type === 'pointerdown') event.currentTarget.setPointerCapture(event.pointerId);
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    onChange('phase', wrap(Math.atan2(-(p.y - 313), -(p.x - 350)) * 180 / Math.PI));
  };
  let content: ReactNode;
  let compactReadings: ReactNode = null;

  if (scene === 'sky') {
    const latitude = val('latitude', -36.85), hour = val('hour', 21);
    const longitude = val('longitude', 174.76);
    // Input is local mean solar time; longitude determines the conversion to UTC.
    const dateUTC = new Date(Date.UTC(2026, 0, 1) + ((Math.floor(day) - 1) + (hour - longitude / 15) / 24) * 86400000);
    const project = (ra: number, dec: number) => {
      const position = raDecToHorizontal(ra / 15, dec, dateUTC, latitude, longitude);
      return { x: 65 + position.azimuth / 360 * 870, y: 520 - position.altitude / 90 * 385, alt: position.altitude, az: position.azimuth };
    };
    const stars = brightStars.map(([name, ra, dec, mag]) => ({ name, mag, ...project(ra, dec) }));
    const links = [['Acrux', 'Mimosa'], ['Mimosa', 'Gacrux'], ['Gacrux', 'Acrux'], ['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnitak'], ['Alnitak', 'Saiph'], ['Saiph', 'Rigel'], ['Rigel', 'Mintaka'], ['Betelgeuse', 'Alnitak'], ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Alioth'], ['Alioth', 'Alkaid']];
    const sunEQ = sunEquatorial(dateUTC), sun = project(sunEQ.ra * 15, sunEQ.dec), solarAlt = sun.alt;
    const moon = moonHorizontal(dateUTC, latitude, longitude), skyMoonPhase = lunarPhase(dateUTC);
    const matariki = stars.find(star => star.name === 'Matariki')!;
    const moonPoint={x:65+moon.azimuth/360*870,y:520-moon.altitude/90*385};
    const labelPoints=[...stars.filter(star=>star.alt>0),...(moon.altitude>0?[{...moonPoint,radius:15}]:[]),...(solarAlt>0?[{...sun,radius:18}]:[]),{x:413,y:478,radius:32}];
    const skyLabels=placeSkyLabels([
      ...stars.filter(star=>star.alt>0&&(star.mag<.8||['Matariki','Acrux','Gacrux'].includes(star.name))).map(star=>({id:star.name,text:star.name,x:star.x,y:star.y,priority:star.name==='Matariki'&&mode==='calendar'?-20:star.mag})),
      ...(moon.altitude>0?[{id:'Moon',text:'Moon 月亮',...moonPoint,priority:-30}]:[]),
      ...(solarAlt>0?[{id:'Sun',text:'Sun 太阳',x:sun.x,y:sun.y,priority:-25}]:[])
    ],labelPoints,skyLabelFont);
    const elongation = Math.acos(clamp(Math.sin(rad(24.12)) * Math.sin(rad(sunEQ.dec)) + Math.cos(rad(24.12)) * Math.cos(rad(sunEQ.dec)) * Math.cos(rad(56.75 - sunEQ.ra * 15)), -1, 1)) * 180 / Math.PI;
    if (mode === 'calendar') compactReadings = <dl className="u-compact-readings"><div><dt>太阳高度</dt><dd>{sun.alt.toFixed(1)}°</dd></div><div><dt>Matariki 高度</dt><dd>{matariki.alt.toFixed(1)}°</dd></div><div><dt>天球角距</dt><dd>{elongation.toFixed(1)}°</dd></div></dl>;
    content = <>
      <defs><linearGradient id="u-skyAir" x1="0" y1="0" x2="0" y2="1"><stop stopColor={solarAlt > 0 ? '#143d65' : '#07101d'}/><stop offset=".72" stopColor={solarAlt > 0 ? '#385d7b' : '#101d32'}/><stop offset="1" stopColor={solarAlt > -12 ? '#c69d73' : '#37404b'} stopOpacity=".7"/></linearGradient><clipPath id="u-skyClip"><path d="M65 520V90H935V520Z"/></clipPath></defs>
      <rect x="40" y="75" width="920" height="480" rx="28" fill="url(#u-skyAir)"/>
      <g clipPath="url(#u-skyClip)">
        {[15, 30, 45, 60, 75].map(a => <g key={a}><line x1="65" x2="935" y1={520 - a / 90 * 385} y2={520 - a / 90 * 385} stroke="#b6cadc" opacity=".055"/><Caption x={77} y={515 - a / 90 * 385} small>{a}°</Caption></g>)}
        {[0, 90, 180, 270, 360].map(a => <line key={a} x1={65 + a / 360 * 870} x2={65 + a / 360 * 870} y1="90" y2="520" stroke="#b6cadc" opacity=".055"/>)}
        <path d="M0 380Q180 70 440 260T1050 140" fill="none" stroke="#9db4d4" opacity=".035" strokeWidth="80" filter="url(#u-blur)"/>
        <g opacity={solarAlt > 0 ? .12 : 1}>{links.map(([a, b]) => { const p = stars.find(s => s.name === a), q = stars.find(s => s.name === b); return p && q && p.alt > 0 && q.alt > 0 && Math.abs(p.x - q.x) < 400 ? <line key={a + b} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#9bbbd9" opacity=".25"/> : null; })}
          {stars.filter(s => s.alt > 0).map(s => <g key={s.name} data-star={s.name} data-altitude={s.alt} data-azimuth={s.az}><circle cx={s.x} cy={s.y} r={Math.max(1.4, 3 - s.mag * .7)} fill={s.name === 'Antares' || s.name === 'Betelgeuse' ? '#ffbf9a' : '#e6efff'}/>{s.mag < 0 && <circle cx={s.x} cy={s.y} r="11" fill="#b9dcff" opacity=".08"/>}</g>)}
        </g>
        {solarAlt > 0 && <Star x={sun.x} y={sun.y} r={13} color="#ffe1a0"/>}
        {moon.altitude > 0 && <g data-observer-orientation="not-computed"><MoonFace x={moonPoint.x} y={moonPoint.y} r={10} phase={skyMoonPhase}/></g>}
        <g pointerEvents="none">{skyLabels.map(label=><g key={label.id} opacity={solarAlt>0&&!['Sun','Moon'].includes(label.id)?.12:1}>
          <line x1={label.x} y1={label.y} x2={Math.max(label.labelX,Math.min(label.labelX+label.width,label.x))} y2={Math.max(label.labelY,Math.min(label.labelY+label.height,label.y))} stroke="#a0bad2" strokeOpacity=".65" strokeWidth=".8" vectorEffect="non-scaling-stroke"/>
          <text data-sky-label={label.id} x={label.labelX} y={label.labelY+skyLabelFont*1.2} style={{fontSize:skyLabelFont}} fill="#d1dce7">{label.text}</text>
        </g>)}</g>
      </g>
      <path d="M40 523 84 521 115 516 145 520 180 515 214 519 246 513 275 519 315 515 340 520 375 518 390 488 400 518 412 518 412 476 418 476 418 458 421 453 424 476 431 476 431 519 456 522 489 520 530 525 563 520 600 522 620 514 649 520 680 518 720 523 754 516 790 521 820 518 864 524 907 517 960 523V555H40Z" fill="#080e17"/>
      <line x1="65" x2="935" y1="520" y2="520" stroke="#9da7b3" strokeOpacity=".25"/>
      {mode === 'calendar' && <g data-testid="calendar-geometry" data-sun-altitude={sun.alt} data-sun-azimuth={sun.az} data-matariki-altitude={matariki.alt} data-matariki-azimuth={matariki.az} data-elongation={elongation}>
        <path d={`M${sun.x} ${solarAlt > 0 ? sun.y + 20 : 521}V565`} stroke="#e5c092" strokeDasharray="3 5" strokeOpacity=".75"/>
        {solarAlt <= 0 && <g><circle cx={sun.x} cy="565" r="7" fill="none" stroke="#e5c092" strokeWidth="1.5"/><path d={`M${sun.x - 3} 574L${sun.x} 578 ${sun.x + 3} 574`} stroke="#e5c092" fill="none"/></g>}
        <Caption x={clamp(sun.x + 13, 90, 750)} y={575} small color="#d6bd9a">☉ {sun.alt.toFixed(1)}° · 方位 {sun.az.toFixed(0)}°{solarAlt <= 0 ? '（地下方向）' : ''}</Caption>
        {matariki.alt > 0 && <circle cx={matariki.x} cy={matariki.y} r="12" fill="none" stroke="#a9d3e4" strokeWidth="1.5"/>}
        <g className="u-model-note"><Caption x={935} y={120} small anchor="end">Matariki 高度 {matariki.alt.toFixed(1)}° · 天球角距独立于地平展开距离</Caption></g>
      </g>}
      {['N 北', 'E 东', 'S 南', 'W 西', 'N'].map((s, i) => <Caption key={s + i} x={65 + i * 217.5} y={548} small anchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>{s}</Caption>)}
      <Readout x={65} y={593} label="观测纬度" value={`${Math.abs(latitude).toFixed(2)}°`} unit={latitude < 0 ? 'S' : 'N'}/><Readout x={340} y={593} label="当地平太阳时" value={`${Math.floor(hour).toString().padStart(2, '0')}:${Math.floor(hour % 1 * 60).toString().padStart(2, '0')}`}/>{mode === 'calendar' ? <Readout x={665} y={593} label="太阳—Matariki天球角距" value={elongation.toFixed(1)} unit="°"/> : <><Caption x={935} y={611} small anchor="end">2026 亮星坐标 · 地平展开投影</Caption><Caption x={935} y={633} small anchor="end">日月低精度星历；月面为照明图标，未计算观测朝向</Caption></>}
    </>;
  } else if (scene === 'orbits' && mode === 'moon') {
    const a = rad(phase), mx = 350 - 153 * Math.cos(a), my = 313 - 153 * Math.sin(a);
    const inclination = val('inclination', 5.14), node = val('node', 90), beta = Math.asin(Math.sin(rad(inclination)) * Math.sin(rad(phase - node))) * 180 / Math.PI;
    const solarEclipse = Math.min(wrap(phase), 360 - wrap(phase)) < 5 && Math.abs(beta) < .5;
    const lunarEclipse = Math.abs(wrap(phase) - 180) < 7 && Math.abs(beta) < 1;
    content = <>
      <Caption x={75} y={108} small essential>拖动月球 · 方向键可调节</Caption>
      <path d="M-60 125H515V500H-60Z" fill="url(#u-rays)" opacity=".5"/>
      <Star x={-63} y={313} r={133} color="#ffd8a1"/>
      {[220, 270, 320, 370, 420].map(y => <path key={y} d={`M90 ${y}H262`} className="u-sunRay" markerEnd="url(#u-arrowGold)"/>)}
      <ellipse cx="350" cy="313" rx="153" ry="153" fill="none" stroke="#9db4cc" strokeOpacity=".7" strokeDasharray="3 8"/>
      {[0, 90, 180, 270].map(d => <circle key={d} cx={350 - 153 * Math.cos(rad(d))} cy={313 - 153 * Math.sin(rad(d))} r="4" fill="#6a7b93"/>)}
      <path d={`M350 313L${mx} ${my}`} stroke="#b5c9e1" strokeOpacity=".65" strokeDasharray="4 5"/>
      {lunarEclipse && <path d="M392 287L531 304V322L392 339Z" fill="#b18d73" opacity=".16"/>}
      {solarEclipse && <path d="M213 298L322 310V316L213 328Z" fill="#020610" opacity=".7"/>}
      <Earth x={350} y={313} r={41}/>
      <circle cx="350" cy="313" r="64" fill="none" stroke="#82b7da" opacity=".1"/>
      <g role="slider" tabIndex={0} aria-label="月球轨道相位角" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(phase)} onPointerDown={moonDrag} onPointerMove={moonDrag} onKeyDown={e => { if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(e.key)) { e.preventDefault(); onChange('phase', wrap(phase + (e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -5 : 5))); } }} className="u-moonHandle">
        <circle cx={mx} cy={my} r="33" fill="transparent"/><circle cx={mx} cy={my} r="25" fill="none" stroke="#e2bf8c" strokeOpacity=".4"/>
        <circle cx={mx} cy={my} r="16" fill="#c4c8ca"/><path d={`M${mx} ${my - 16}A16 16 0 0 1 ${mx} ${my + 16}Z`} fill="#3c4653"/><circle cx={mx - 4} cy={my - 5} r="3" fill="#64717a" opacity=".4"/>
      </g>
      <Caption x={350} y={383} small essential anchor="middle">地球</Caption><Caption x={350} y={494} small anchor="middle">俯视轨道 · 太阳光从左侧照来</Caption>
      <path d="M193 525H505" stroke="#a1b4c4" strokeOpacity=".35" strokeDasharray="4 5"/><path d={`M193 ${525 + Math.sin(rad(phase - node)) * inclination * 3}Q350 ${525 - beta * 6} 505 ${525 - Math.sin(rad(phase - node)) * inclination * 3}`} stroke="#99bcd4" fill="none" strokeOpacity=".45"/><circle cx="350" cy={525 - beta * 4} r="5" fill="#d6d5cc"/><Caption x={193} y={549} small>黄道面截面 · 月球纬度 β = {beta.toFixed(1)}°</Caption>
      <path d="M569 105V535" stroke="#8a9cb6" strokeOpacity=".2"/>
      <circle cx="780" cy="300" r="135" fill="url(#u-nightHalo)"/>
      {solarEclipse && <g><circle cx="780" cy="293" r="75" fill="#e9c695" opacity=".35" filter="url(#u-blur)"/><circle cx="780" cy="293" r="73" fill="#ffdfb0"/></g>}
      <g data-testid="moon-illumination" data-observer-orientation="not-computed"><MoonFace x={780} y={293} r={72} phase={phase}/></g>
      {lunarEclipse && <circle cx="780" cy="293" r="72" fill="#ac624e" opacity=".65"/>}
      {(solarEclipse || lunarEclipse) && <Caption x={780} y={405} anchor="middle" color="#e7c39a">{solarEclipse ? '日食对齐' : '月食对齐'} · 示意</Caption>}
      <path d="M618 473Q720 442 938 477V520H618Z" fill="#121f2a"/><path d="M618 473Q720 442 938 477" fill="none" stroke="#6e8196" strokeOpacity=".35"/>
      <path d="M767 466V443M759 452H775" stroke="#a4bac9" strokeWidth="2"/><circle cx="767" cy="437" r="5" fill="#a4bac9"/>
      <g className="u-model-note"><Caption x={780} y={510} small anchor="middle">月面照明图标 · 未计算观测朝向</Caption></g>
      <Caption x={930} y={596} small anchor="end">新月 / 满月 + 接近轨道交点，才可能发生食</Caption><Caption x={930} y={619} small anchor="end">食阈值、阴影与大小均为示意，非食预报</Caption>
    </>;
  } else if (scene === 'orbits' && mode === 'seasons') {
    const lat = val('latitude', -36.85), dec = solarDeclination(day, tilt), projectedTilt = -dec;
    const length = daylightHours(lat, day, tilt);
    const alt = 90 - Math.abs(lat - dec);
    const arc = Array.from({ length: 81 }, (_, i) => `${635 + i / 80 * 295},${447 - solarAltitude(lat, day, i / 80 * 24, tilt) / 90 * 220}`).join(' ');
    content = <>
      <path d="M-30 130H500V510H-30Z" fill="url(#u-rays)" opacity=".55"/><Star x={-89} y={325} r={140} color="#ffe0a9"/>
      {[210, 270, 330, 390, 450].map(y => <path key={y} d={`M80 ${y}H183`} className="u-sunRay" markerEnd="url(#u-arrowGold)"/>)}
      <g transform={`rotate(${projectedTilt} 350 325)`}><Earth x={350} y={325} r={127}/><ellipse cx="350" cy="325" rx="126" ry="36" fill="none" stroke="#d5dddf" strokeOpacity=".5" strokeDasharray="4 5"/><path d="M350 143V507" stroke="#dfceb0" strokeWidth="2"/><circle cx="350" cy="143" r="3" fill="#f1d4a8"/><Caption x={350} y={127} small anchor="middle">N</Caption><Caption x={350} y={532} small anchor="middle">S</Caption><circle cx={350 - Math.cos(rad(lat)) * 126} cy={325 - Math.sin(rad(lat)) * 126} r="5" fill="#f9d795"/></g>
      <path d="M350 145V216" stroke="#9bafc8" strokeDasharray="3 5" opacity=".6"/>
      <Caption x={465} y={178} color="#e6c699">ε = {tilt.toFixed(1)}°</Caption><Caption x={465} y={200} small>真实地轴倾角</Caption>
      <Caption x={350} y={566} small anchor="middle">轴向投影随日期变化 · 黄色点为所选纬度</Caption>
      <Caption x={635} y={167}>太阳高度 / °</Caption><Caption x={635} y={192} small>{Math.abs(lat).toFixed(1)}° {lat < 0 ? 'S' : 'N'} · 太阳高度角随时间变化</Caption>
      <Grid x={635} y={227} width={295} height={293} ny={4} nx={4}/>
      <line x1="635" x2="930" y1="447" y2="447" stroke="#d6bd93" opacity=".6"/>
      <polyline points={arc} fill="none" stroke="#eed2a1" strokeWidth="2.5"/>
      <circle cx="782.5" cy={447 - alt / 90 * 220} r="7" fill="#ffe0a6"/>
      <Caption x={930} y={438} small essential anchor="end">地平线 0°</Caption>
      {['0h', '6h', '12h', '18h', '24h'].map((s, i) => <Caption key={s} x={635 + i * 73.75} y={544} small essential anchor="middle">{s}</Caption>)}
      <Readout x={635} y={576} label="白昼长度" value={length.toFixed(1)} unit="h"/><Readout x={815} y={576} label="正午太阳高度" value={`${alt.toFixed(1)}°`}/>
      <Caption x={60} y={622} small>示意光照方向；右图按日期、纬度与地轴倾角计算，不含大气折射</Caption>
    </>;
  } else if (scene === 'orbits') {
    const eccentricity = clamp(val('e', .2), 0, .9), a = val('a', 1), rx = 295, ry = rx * Math.sqrt(1 - eccentricity * eccentricity) * .67;
    const focus = 500 - rx * eccentricity;
    const solve = (mean: number) => { let n = mean; for (let i = 0; i < 8; i++) n -= (n - eccentricity * Math.sin(n) - mean) / (1 - eccentricity * Math.cos(n)); return n; };
    const M = TAU * (day / 365.25) + clock * .45 / Math.sqrt(a ** 3), E = solve(M), previousE = solve(M - .35);
    const x = 500 - rx * Math.cos(E), y = 317 - ry * Math.sin(E);
    const distance = a * (1 - eccentricity * Math.cos(E)), period = Math.sqrt(a ** 3);
    const speed = 29.7846918 * Math.sqrt(2 / distance - 1 / a);
    const velocityX = 29.7846918 / Math.sqrt(a) * Math.sin(E) / (1 - eccentricity * Math.cos(E));
    const velocityY = -29.7846918 / Math.sqrt(a) * Math.sqrt(1 - eccentricity ** 2) * Math.cos(E) / (1 - eccentricity * Math.cos(E));
    const arrowX = x + velocityX * 1.3, arrowY = y + velocityY * .67 * 1.3;
    const wedge = `M${focus} 317L${500 - rx * Math.cos(previousE)} ${317 - ry * Math.sin(previousE)}A${rx} ${ry} 0 0 1 ${x} ${y}Z`;
    content = <>
      <ellipse cx="500" cy="317" rx={rx + 45} ry={ry + 30} fill="none" stroke="#7896b5" strokeOpacity=".07"/><ellipse cx="500" cy="317" rx={rx} ry={ry} fill="none" stroke="#c0d2e5" strokeOpacity=".75"/>
      <path d={wedge} fill="#bda172" opacity=".16"/><path d={`M${focus} 317L${x} ${y}`} stroke="#d5bf98" strokeOpacity=".45" strokeDasharray="4 6"/>
      <line x1="205" x2="795" y1="317" y2="317" stroke="#a8b6c9" strokeOpacity=".15" strokeDasharray="3 8"/>
      <Star x={focus} y={317} r={36}/><Earth x={x} y={y} r={17}/>
      <circle cx={500 + rx * eccentricity} cy="317" r="4" fill="none" stroke="#78889c"/><Caption x={500 + rx * eccentricity} y={344} small anchor="middle">空焦点</Caption>
      <g data-testid="kepler-velocity" data-speed={speed} data-radius-au={distance} data-vx={velocityX} data-vy={velocityY} data-projection-y={.67} data-arrow-pixels-per-kms={1.3}>
        <path d={`M${x} ${y}L${arrowX} ${arrowY}`} stroke="#a0c4cb" strokeWidth="2" markerEnd="url(#u-arrowBlue)"/><Caption x={arrowX + 8} y={arrowY - 9} small>v = {speed.toFixed(1)} km/s</Caption>
      </g>
      <path d={`M${x} ${y}L${x + (focus - x) * .22} ${y + (317 - y) * .22}`} stroke="#edc398" strokeWidth="2" markerEnd="url(#u-arrowGold)"/>
      <Caption x={205} y={317 + ry + 36} small>近日点 a(1 − e)</Caption><Caption x={795} y={317 + ry + 36} small anchor="end">远日点 a(1 + e)</Caption>
      <Readout x={90} y={575} label="当前日心距离" value={distance.toFixed(2)} unit="AU"/><Readout x={360} y={575} label="公转周期 T² = a³" value={period.toFixed(2)} unit="yr"/><Readout x={680} y={575} label="轨道离心率" value={eccentricity.toFixed(2)}/>
      <Caption x={940} y={642} small anchor="end">倾斜投影 · v² = GM(2/r − 1/a)；速度箭头统一 1.3 px/(km/s)，纵向投影 ×0.67</Caption>
    </>;
  } else if (scene === 'light' && mode === 'telescope') {
    const aperture = val('aperture', 200), radius = 35 + Math.sqrt(aperture / 200) * 35;
    const resolution = 138 / aperture;
    content = <>
      <g transform="translate(100 140)">
        <path d="M95 70H580L632 176 580 282H95Z" fill="url(#u-metal)" stroke="#8b9daf" strokeOpacity=".4"/>
        <path d="M95 70H580L632 176H95Z" fill="#141f2a"/><path d="M95 70V282" stroke="#bdd8e0" strokeWidth="3"/>
        <path d="M579 80Q650 176 579 272" fill="none" stroke="#d9e9eb" strokeWidth="7"/>
        {[101, 139, 213, 251].map(y => <g key={y}><path d={`M-35 ${y}H${y < 176 ? 593 : 594}L350 176L518 105`} fill="none" stroke="#e2c695" strokeOpacity=".7" strokeWidth="1.5"/><path d={`M-35 ${y}H125`} fill="none" stroke="#e2c695" strokeWidth="1.5" markerEnd="url(#u-arrowGold)"/></g>)}
        <path d="M336 190L364 162" stroke="#c6d9df" strokeWidth="5"/><path d="M350 176L518 105V17" fill="none" stroke="#e5c79b" strokeWidth="2"/><path d="M502 70V10H535V70" fill="#26384a" stroke="#8b9daf"/><Caption x={535} y={0} small>目镜 / detector</Caption>
        <path d="M360 283V360M293 380L360 330 427 380" fill="none" stroke="#637789" strokeWidth="7"/>
      </g>
      <Caption x={115} y={465} small>反射式望远镜光路 · 结构示意</Caption>
      <g transform="translate(837 313)"><circle r={radius + 14} fill="none" stroke="#8097ac" strokeOpacity=".22" strokeDasharray="2 6"/><circle r={radius} fill="#172737" stroke="#bbd0df" strokeOpacity=".5"/><circle r={radius * .88} fill="url(#u-earth)" opacity=".25"/><circle r="12" fill="#17212c"/><path d={`M${-radius} 0H${radius}M0 ${-radius}V${radius}`} stroke="#718799"/><Caption x={0} y={radius + 45} small anchor="middle">有效口径 D</Caption></g>
      <Readout x={90} y={568} label="镜面口径" value={aperture.toFixed(0)} unit="mm"/><Readout x={360} y={568} label="相对 7 mm 瞳孔集光力" value={(aperture / 7) ** 2 > 9999 ? `${((aperture / 7) ** 2 / 1000).toFixed(1)}k` : ((aperture / 7) ** 2).toFixed(0)} unit="×"/><Readout x={720} y={568} label="550 nm 瑞利分辨角" value={resolution.toFixed(2)} unit="arcsec"/>
      <Caption x={60} y={639} small>理想圆孔 θ ≈ 1.22 λ / D；实际观测还受大气视宁度影响</Caption>
    </>;
  } else if (scene === 'light' && mode === 'doppler') {
    const velocity = val('velocity', 0), beta = clamp(velocity / 299792.458, -.95, .95), factor = Math.sqrt((1 + beta) / (1 - beta));
    const lines = [393.4, 434, 486.1, 517, 589.3, 656.3], lineX = (nm: number) => 270 + (nm - 380) / 370 * 590;
    content = <>
      <Star x={190} y={268} r={49} color={beta > 0 ? '#ffb18d' : beta < 0 ? '#badbff' : '#fff0cf'}/>
      {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${300 + i * (54 + beta * 32)} 202Q${345 + i * (54 + beta * 32)} 268 ${300 + i * (54 + beta * 32)} 334`} fill="none" stroke={beta >= 0 ? '#e3b29d' : '#a7cde5'} opacity={.62 - i * .065} strokeWidth="2"/>)}
      <Earth x={852} y={268} r={33}/><Caption x={190} y={363} small anchor="middle">光源</Caption><Caption x={852} y={333} small anchor="middle">观测者</Caption>
      {velocity !== 0 && <path d={`M190 165H${190 - Math.sign(velocity) * 70}`} stroke="#d7c8b0" markerEnd="url(#u-arrowGold)"/>}<Caption x={190} y={139} small anchor="middle">{velocity > 0 ? '远离观测者' : velocity < 0 ? '接近观测者' : '相对静止'}</Caption>
      <Caption x={90} y={428} small essential>实验室谱</Caption><rect x="270" y="409" width="590" height="25" rx="3" fill="url(#u-spectrum)" opacity=".65"/>
      {lines.map(nm => <line key={nm} x1={lineX(nm)} x2={lineX(nm)} y1="409" y2="434" stroke="#080d15" strokeWidth="4"/>)}
      <Caption x={90} y={490} small essential>观测光谱</Caption><rect x="270" y="470" width="590" height="25" rx="3" fill="url(#u-spectrum)"/>
      {lines.filter(nm => nm * factor >= 380 && nm * factor <= 750).map(nm => <g key={nm}><line x1={lineX(nm * factor)} x2={lineX(nm * factor)} y1="470" y2="495" stroke="#080d15" strokeWidth="4"/><line x1={lineX(nm)} x2={lineX(nm * factor)} y1="438" y2="465" stroke="#e4e6e6" strokeOpacity=".25" strokeDasharray="2 4"/></g>)}
      <Readout x={90} y={567} label="径向速度" value={velocity.toFixed(0)} unit="km/s"/><Readout x={440} y={567} label="波长变化 z = λobs / λrest − 1" value={(factor - 1).toFixed(4)}/><Caption x={940} y={588} small anchor="end">380 nm ← → 750 nm</Caption><Caption x={940} y={615} small anchor="end">λobs = λrest √[(1 + β) / (1 − β)]</Caption>
    </>;
  } else if (scene === 'light') {
    const peak = 2897771.955 / temperature;
    const wavelengths = Array.from({ length: 181 }, (_, i) => 100 + i * 1900 / 180);
    const planck = (nm: number) => 1 / ((nm / 1000) ** 5 * Math.expm1(14387769 / (nm * temperature)));
    const max = planck(peak), points = wavelengths.map(nm => `${355 + (nm - 100) / 1900 * 555},${476 - planck(nm) / max * 300}`).join(' ');
    const peakX = 355 + (peak - 100) / 1900 * 555;
    const emission = val('spectrumType', 0) === 1, helium = val('element', 0) === 1;
    const elementLines = helium ? [402.6, 447.1, 501.6, 587.6, 667.8, 706.5] : [410.2, 434.0, 486.1, 656.3];
    content = <>
      <Star x={181} y={303} r={68} color={blackbodyColor(temperature)}/><Caption x={181} y={421} small anchor="middle">理想黑体</Caption>
      <Grid x={355} y={145} width={555} height={331} nx={5}/>
      <rect x={355 + 280 / 1900 * 555} y="145" width={370 / 1900 * 555} height="331" fill="url(#u-spectrum)" opacity=".12"/>
      <polygon points={`355,476 ${points} 910,476`} fill="url(#u-chartFill)"/>
      <polyline points={points} fill="none" stroke={blackbodyColor(temperature)} strokeWidth="3"/>
      {peakX > 355 && peakX < 910 && <><line x1={peakX} x2={peakX} y1="176" y2="476" stroke="#f4e0be" strokeOpacity=".4" strokeDasharray="3 6"/><circle cx={peakX} cy="176" r="5" fill="#ffe5b9"/></>}
      <Caption x={355} y={126} small essential>归一化辐射强度</Caption><Caption x={910} y={513} small essential anchor="end">波长 / nm →</Caption>
      {[100, 500, 1000, 1500, 2000].map(n => <Caption key={n} x={355 + (n - 100) / 1900 * 555} y={499} small essential anchor="middle">{n}</Caption>)}
      <Caption x={90} y={518} small>{helium ? 'He 氦' : 'H 氢'} · {emission ? '发射光谱' : '吸收光谱'}</Caption>
      <rect x="355" y="533" width="555" height="18" rx="2" fill={emission ? '#080e18' : 'url(#u-spectrum)'}/>
      {elementLines.map((nm, i) => <line key={nm} x1={355 + (nm - 380) / 370 * 555} x2={355 + (nm - 380) / 370 * 555} y1="533" y2="551" stroke={emission ? ['#a4a5ec', '#89afd4', '#8bc7c4', '#dfb38f', '#d79a91', '#cb8b91'][i] : '#080e18'} strokeWidth={nm > 650 ? 4 : 3}/>)}
      <Caption x={90} y={541} small>可见光 380–750 nm →</Caption>
      <Readout x={90} y={579} label="表面温度" value={temperature.toFixed(0)} unit="K"/><Readout x={440} y={579} label="维恩位移定律 · λmax = b / T" value={peak.toFixed(0)} unit="nm"/><Caption x={940} y={615} small anchor="end">各曲线按自身峰值归一化</Caption>
    </>;
  } else if (scene === 'stars' && mode === 'hr') {
    const mainT = clamp(5772 * mass ** .5, 2500, 40000), mainL = mass ** 3.5;
    const giantFraction = mass < .5 ? 0 : clamp((age - .65) / .2, 0, 1), remnantFraction = mass < 8 ? clamp((age - .85) / .15, 0, 1) : 0;
    const t = mainT * (1 - giantFraction) + 3500 * giantFraction + remnantFraction * 9000;
    const luminosity = 10 ** (Math.log10(mainL) + giantFraction * (mass >= 8 ? .3 : 2) * (1 - remnantFraction) - remnantFraction * (Math.log10(mainL) + 2));
    const hx = (temp: number) => 230 + (Math.log10(40000) - Math.log10(temp)) / (Math.log10(40000) - Math.log10(2500)) * 620;
    const hy = (l: number) => 485 - (Math.log10(l) + 4) / 10 * 365;
    content = <>
      <Grid x={230} y={120} width={620} height={365} nx={6} ny={5}/>
      <path d="M260 151Q500 248 810 455" fill="none" stroke="url(#u-spectrum)" strokeWidth="44" strokeLinecap="round" opacity=".07"/>
      {Array.from({ length: 250 }, (_, i) => { const f = seed(i + 300), tx = 255 + f * 540, ty = 140 + f * 310 + (seed(i + 700) - .5) * 45; return <circle key={i} cx={tx} cy={ty} r={1.1 + seed(i) * 1.7} fill={blackbodyColor(35000 * (1 - f) ** 2 + 2800)} opacity={.35 + seed(i + 10) * .5}/>; })}
      {Array.from({ length: 46 }, (_, i) => <circle key={i} cx={650 + seed(i + 800) * 140} cy={149 + seed(i + 900) * 96} r={1.5 + seed(i) * 2.5} fill="#efb888" opacity=".65"/>)}
      {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={365 + seed(i + 400) * 170} cy={400 + seed(i + 500) * 65} r="1.6" fill="#b3d0ef" opacity=".65"/>)}
      <Caption x={686} y={132} small>红巨星 / 超巨星</Caption><Caption x={410} y={478} small>白矮星</Caption><Caption x={555} y={301} small>主序 MAIN SEQUENCE</Caption>
      <circle cx={hx(t)} cy={hy(luminosity)} r="16" fill="none" stroke="#f3ddbd" strokeOpacity=".7"/><circle cx={hx(t)} cy={hy(luminosity)} r="6" fill={blackbodyColor(t)}/><Caption x={hx(t) + 23} y={hy(luminosity) + 5} small>示意演化位置</Caption>
      <circle cx={hx(5772)} cy={hy(1)} r="4" fill="#ffe3a0"/><Caption x={hx(5772) - 14} y={hy(1) + 24} small>Sun</Caption>
      {['10⁶', '10⁴', '10²', '1', '10⁻²', '10⁻⁴'].map((n, i) => <Caption key={n} x={213} y={125 + i * 73} small essential anchor="end">{n}</Caption>)}
      {[40000, 20000, 10000, 5000, 2500].map(n => <Caption key={n} x={hx(n)} y={509} small essential anchor="middle">{n.toLocaleString()}</Caption>)}
      <Caption x={230} y={101} small essential>光度 / L☉ ↑</Caption><Caption x={850} y={539} small essential anchor="end">← 更热　表面温度 / K　更冷 →</Caption>
      <Readout x={90} y={581} label="初始质量" value={mass.toFixed(1)} unit="M☉"/><Readout x={400} y={581} label="估算主序光度" value={mainL < .01 ? mainL.toExponential(1) : mainL.toFixed(1)} unit="L☉"/><Caption x={940} y={620} small anchor="end">演化轨迹、散点均为示意；非数值恒星演化计算</Caption>
    </>;
  } else if (scene === 'stars' && mode === 'binary') {
    const t = age * TAU, separation = 200, q = 1 / mass, x1 = 500 - Math.cos(t) * separation * q / (1 + q), x2 = 500 + Math.cos(t) * separation / (1 + q), y1 = 296 - Math.sin(t) * 85 * q / (1 + q), y2 = 296 + Math.sin(t) * 85 / (1 + q);
    const v1 = 55 * q / (1 + q), v2 = 55 / (1 + q);
    const curve = Array.from({ length: 100 }, (_, i) => `${200 + i / 99 * 600},${486 - Math.sin(i / 99 * TAU * 2) * v1}`).join(' ');
    content = <>
      <ellipse cx="500" cy="296" rx={separation * q / (1 + q)} ry={85 * q / (1 + q)} fill="none" stroke="#e2c48f" strokeOpacity=".35"/><ellipse cx="500" cy="296" rx={separation / (1 + q)} ry={85 / (1 + q)} fill="none" stroke="#a3c5e1" strokeOpacity=".35"/>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cfdae4" strokeDasharray="3 6" strokeOpacity=".25"/><Star x={x1} y={y1} r={25 * mass ** .2} color="#ffe2ab"/><Star x={x2} y={y2} r={19 * mass ** .2} color="#b8d9ff"/>
      <path d="M490 296H510M500 286V306" stroke="#d3bd98" strokeWidth="1"/><Caption x={500} y={382} small essential anchor="middle">共同质心 · m₁r₁ = m₂r₂</Caption>
      <Grid x={200} y={435} width={600} height={105} ny={2} nx={6}/><polyline points={curve} fill="none" stroke="#e1c397" strokeWidth="2"/><polyline points={Array.from({ length: 100 }, (_, i) => `${200 + i / 99 * 600},${486 + Math.sin(i / 99 * TAU * 2) * v2}`).join(' ')} fill="none" stroke="#96bad9" strokeWidth="2"/>
      <Caption x={200} y={423} small>径向速度（示意）</Caption><Caption x={800} y={562} small anchor="end">时间 →</Caption>
      <Readout x={90} y={590} label="主星质量（伴星固定 1 M☉）" value={mass.toFixed(1)} unit="M☉"/><Caption x={940} y={610} small anchor="end">光谱双星的周期性多普勒位移可测量恒星质量</Caption>
    </>;
  } else if (scene === 'stars') {
    const high = mass >= 8, intermediate = mass >= .5;
    const labels = high ? ['星云', '大质量主序星', '红超巨星', '核心坍缩', mass >= 25 ? '黑洞' : '中子星'] : ['星云', '主序星', intermediate ? '红巨星' : '缓慢燃烧', intermediate ? '行星状星云' : '耗尽燃料', '白矮星'];
    const fraction = clamp(age, 0, 1), active = Math.min(4, Math.floor(fraction * 5));
    const positions = [130, 315, 500, 685, 870];
    const lifespan = 10 * mass ** -2.5;
    compactReadings = <p className="u-compact-sequence">{labels.join(' → ')}</p>;
    content = <>
      <path d="M130 310H870" stroke="#70849f" strokeOpacity=".3"/>
      <path d={`M130 310H${130 + fraction * 740}`} stroke="#d8bc94" strokeWidth="2" strokeOpacity=".7"/>
      {positions.map((x, i) => <g key={i} opacity={i <= active ? 1 : .34}>
        {i === 0 ? <g>{Array.from({ length: 32 }, (_, n) => <circle key={n} cx={x + (seed(n) - .5) * 100} cy={310 + (seed(n + 40) - .5) * 110} r={8 + seed(n + 80) * 18} fill={n % 2 ? '#9c849e' : '#527e9b'} opacity=".13" filter="url(#u-blur)"/>)}<Star x={x} y={310} r={10}/></g> : i === 1 ? <Star x={x} y={310} r={high ? 30 : 23} color={blackbodyColor(5772 * mass ** .5)}/> : i === 2 ? <Star x={x} y={310} r={!intermediate ? 20 : high ? 65 : 51} color="#e89d75"/> : i === 3 ? <g>{intermediate && [21, 32, 45, 59].map(r => <ellipse key={r} cx={x} cy="310" rx={r} ry={r * .72} fill="none" stroke={high ? '#eed8a1' : '#95c3c2'} strokeWidth={high ? 3 : 7} opacity={.75 - r / 100}/>)}<Star x={x} y={310} r={high ? 13 : 7} color="#d4edff"/></g> : high && mass >= 25 ? <g><ellipse cx={x} cy="310" rx="51" ry="15" fill="none" stroke="#e9ad71" strokeWidth="10" opacity=".75" transform={`rotate(-23 ${x} 310)`}/><circle cx={x} cy="310" r="24" fill="#03060c" stroke="#efd5ab" strokeOpacity=".7"/><circle cx={x} cy="310" r="29" fill="none" stroke="#f3caa3" strokeOpacity=".15" strokeWidth="3"/></g> : <g>{high && <path d={`M${x - 20} 238L${x + 20} 382`} stroke="#99c6f5" opacity=".25" strokeWidth="7"/>}<Star x={x} y={310} r={high ? 10 : 13} color="#cee5ff"/></g>}
        <Caption x={x} y={418} anchor="middle">{labels[i]}</Caption><Caption x={x} y={446} small anchor="middle">0{i + 1}</Caption>
        {i === active && <path d={`M${x - 24} 470H${x + 24}`} stroke="#e2c59c" strokeWidth="2"/>}
      </g>)}
      <Readout x={90} y={568} label="初始质量" value={mass.toFixed(1)} unit="M☉"/><Readout x={390} y={568} label="估算主序寿命" value={lifespan < .01 ? (lifespan * 1000).toFixed(1) : lifespan.toFixed(1)} unit={lifespan < .01 ? 'Myr' : 'Gyr'}/>
      <Caption x={940} y={589} small anchor="end">{mass < .5 ? '低质量红矮星寿命可超过当前宇宙年龄' : high ? '大质量恒星迅速燃烧燃料，并经历核心坍缩' : '类太阳恒星逐渐失去外层，留下炽热核心'}</Caption><Caption x={940} y={616} small anchor="end">演化阶段与大小示意；分界随金属丰度等条件变化</Caption>
    </>;
  } else if (scene === 'planets' && mode === 'transit') {
    const radius = val('radius', 3), period = val('period', 10), phaseTransit = wrap(val('transit', .5) + clock / period, 1);
    const planetR = clamp(radius * 3.4, 3, 60), depth = transitDepth(radius), baseline = 453, fluxRange = .013, fluxHeight = 98;
    const depthPixels = depth / fluxRange * fluxHeight, nadirY = baseline + depthPixels;
    const transitCurve = Array.from({ length: 181 }, (_, i) => { const t = i / 180, d = Math.abs(560 * (t - .5)); const dip = clamp((100 + planetR - d) / (2 * planetR), 0, 1); return `${135 + t * 730},${baseline + dip * depthPixels}`; }).join(' ');
    content = <>
      <ellipse cx="500" cy="265" rx="310" ry="29" fill="none" stroke="#7891aa" strokeOpacity=".3" strokeDasharray="3 6"/>
      <Star x={500} y={265} r={100} color="#ffdfac"/>
      <circle cx={220 + phaseTransit * 560} cy="265" r={planetR} fill="#111b26" stroke="#67899f" strokeOpacity=".5"/>
      <path d="M235 265H375M625 265H765" stroke="#e5ceb0" strokeOpacity=".25" markerEnd="url(#u-arrowGold)"/>
      <Caption x={500} y={399} small anchor="middle">凌日：行星从恒星前方经过</Caption>
      <Grid x={135} y={baseline} width={730} height={fluxHeight} nx={8} ny={2}/><polyline data-testid="transit-flux" data-depth={depth} data-y={nadirY} data-baseline={baseline} data-depth-pixels={depthPixels} data-flux-range={fluxRange} data-flux-height={fluxHeight} points={transitCurve} fill="none" stroke="#e5c69d" strokeWidth="2.5"/>
      {[1, 1 - fluxRange / 2, 1 - fluxRange].map((flux, i) => <Caption key={i} x={124} y={baseline + i * fluxHeight / 2 + 4} small essential anchor="end">{flux.toFixed(4)}</Caption>)}
      <line x1={135 + phaseTransit * 730} x2={135 + phaseTransit * 730} y1="440" y2="559" stroke="#accbda" strokeOpacity=".65" strokeDasharray="3 4"/>
      <Caption x={135} y={430} small essential>相对通量 · 固定纵轴</Caption><Caption x={865} y={579} small essential anchor="end">时间 →</Caption>
      <Readout x={90} y={600} label="太阳大小恒星的凌日深度" value={(depth * 100).toFixed(3)} unit="%"/><Readout x={610} y={600} label="两次凌日间隔" value={period.toFixed(1)} unit="days"/>
      <Caption x={940} y={648} small anchor="end">行星圆单独放大；通量纵轴统一为 0–1.3% 下降，无最小深度钳制 · δ = (Rp / R★)²</Caption>
    </>;
  } else if (scene === 'planets' && mode === 'atmosphere') {
    const gas = val('gas', 28), escape = 11.186 * Math.sqrt(mass), thermal = Math.sqrt(3 * 8314.46 * temperature / gas) / 1000;
    const gasDots = Array.from({ length: 50 }, (_, i) => { const a = seed(i) * TAU + clock * .1 * thermal, r = 142 + wrap(seed(i + 80) * 59 + clock * thermal * 2, 59); return { x: 330 + Math.cos(a) * r, y: 321 + Math.sin(a) * r }; });
    content = <>
      <circle cx="330" cy="321" r="211" fill="url(#u-atmosphere)"/><circle cx="330" cy="321" r="144" fill="none" stroke="#8eb5d8" strokeOpacity=".2"/>
      <Earth x={330} y={321} r={124}/>
      {gasDots.map(({ x, y }, i) => <g key={i}><circle cx={x} cy={y} r={i % 3 === 0 ? 3 : 2} fill={thermal * 6 > escape ? '#ebbd91' : '#9fcbe2'} opacity=".7"/><path d={`M${x} ${y}l${(x - 330) / 25 * Math.min(3, thermal)} ${(y - 321) / 25 * Math.min(3, thermal)}`} stroke="#b4d5e5" opacity=".23"/></g>)}
      <Caption x={330} y={571} small anchor="middle">半径固定为 1 R⊕ · 粒子与大气厚度为示意</Caption>
      <Caption x={650} y={190}>逃逸速度</Caption><path d="M650 217H917" stroke="#7d92aa" strokeOpacity=".25"/><path d={`M650 217H${650 + clamp(escape / 30, 0, 1) * 267}`} stroke="#a2c9d9" strokeWidth="6" strokeLinecap="round"/><text x="650" y="270" className="u-number">{escape.toFixed(2)}<tspan className="u-unit"> km/s</tspan></text>
      <Caption x={650} y={345}>分子方均根速度</Caption><path d="M650 373H917" stroke="#7d92aa" strokeOpacity=".25"/><path d={`M650 373H${650 + clamp(thermal / 30, 0, 1) * 267}`} stroke="#e5c096" strokeWidth="6" strokeLinecap="round"/><text x="650" y="426" className="u-number">{thermal.toFixed(2)}<tspan className="u-unit"> km/s</tspan></text>
      <Caption x={650} y={488} small>vᵣₘₛ = √(3RT / M)</Caption><Caption x={650} y={515} small>vₑₛ꜀ = √(2GM / R)</Caption>
      <Readout x={90} y={599} label="气体温度" value={temperature.toFixed(0)} unit="K"/><Readout x={400} y={599} label="分子摩尔质量" value={gas.toFixed(0)} unit="g/mol"/><Caption x={940} y={621} small anchor="end">粒子速度存在分布；长期逃逸取决于高速尾部</Caption>
    </>;
  } else if (scene === 'planets' && mode === 'formation') {
    const diskAge = clamp(.3 + clock * .015, 0, 1), angle = clock * 9, selectedDistance = val('distance', 1);
    const selectedOrbit = 35 + Math.log10(selectedDistance / .2) / 2 * 320, frostOrbit = 35 + Math.log10(2.7 / .2) / 2 * 320;
    content = <>
      <g transform="translate(500 321) rotate(-14)">
        {[95, 150, 215, 285, 355].map((r, i) => <ellipse key={r} rx={r} ry={r * .3} fill="none" stroke={i < 2 ? '#c4a080' : '#829cbb'} strokeWidth={Math.max(2, 33 * (1 - diskAge))} strokeOpacity={.1 + .15 * (1 - diskAge)}/>)}
        {Array.from({ length: 280 }, (_, i) => { const a = seed(i) * TAU + rad(angle), r = 75 + seed(i + 1400) * 290; return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r * .3} r={.7 + seed(i + 5) * 1.7} fill={r < 190 ? '#d8b797' : '#8caac7'} opacity={(1 - diskAge * .8) * .65}/>; })}
        <Star x={0} y={0} r={35}/>
        {[110, 170, 237, 310].map((r, i) => <g key={r} transform={`translate(${Math.cos(rad(angle + i * 85)) * r} ${Math.sin(rad(angle + i * 85)) * r * .3})`}><circle r={3 + diskAge * (i > 1 ? 18 : 7)} fill={['#cda88c', '#b18d77', '#b0b9b7', '#96b4c8'][i]}/>{i === 3 && <ellipse rx={12 + diskAge * 27} ry={3 + diskAge * 7} fill="none" stroke="#b5ac97" strokeWidth="3" opacity=".6"/>}</g>)}
        <ellipse rx={frostOrbit} ry={frostOrbit * .3} fill="none" stroke="#a6c9df" strokeDasharray="5 7" strokeOpacity=".5"/>
        <ellipse rx={selectedOrbit} ry={selectedOrbit * .3} fill="none" stroke="#e9c79b" strokeOpacity=".6"/>
        <circle cx={selectedOrbit * .87} cy={selectedOrbit * .3 * .5} r="7" fill={selectedDistance < 2.7 ? '#d5ad8c' : '#b1d5e9'} stroke="#f0ddbe" strokeWidth="2"/>
      </g>
      <path d="M670 267L775 180H900" fill="none" stroke="#9db8cd" strokeOpacity=".6"/><Caption x={900} y={165} small anchor="end">雪线 SNOW LINE</Caption><Caption x={900} y={201} small anchor="end">更冷的外侧可凝结冰</Caption>
      <Caption x={160} y={487} small>内侧：岩石、金属</Caption><Caption x={835} y={487} small anchor="end">外侧：冰、气体与固体核心</Caption>
      <Readout x={90} y={584} label="所选原行星轨道" value={selectedDistance.toFixed(1)} unit="AU"/><Caption x={940} y={595} anchor="end">{selectedDistance < 2.7 ? '雪线内：主要凝结岩石与金属' : '雪线外：冰也能凝结，固体原料更多'}</Caption><Caption x={940} y={628} small anchor="end">半径按对数压缩；雪线固定 2.7 AU 作示意</Caption>
    </>;
  } else if (scene === 'planets') {
    const distance = val('distance', 1), e = val('e', .2), instantaneousDistance = distance * (1 - e * Math.cos(clock * .6)), moonX = 690 + instantaneousDistance * 32, bulge = 20 / instantaneousDistance ** 3;
    content = <>
      <ellipse cx="370" cy="321" rx={127 + clamp(bulge, 2, 90)} ry={124 - clamp(bulge / 3, 0, 24)} fill="#76b3d2" fillOpacity=".1" stroke="#8ac5e1" strokeOpacity=".6"/>
      <Earth x={370} y={321} r={107}/><MoonFace x={moonX} y={321} r={32} phase={180}/>
      {[270, 370, 470].map((x, i) => <g key={x}><path d={`M${x} 321H${x + [35, 48, 76][i]}`} stroke="#edc596" strokeWidth="2" markerEnd="url(#u-arrowGold)"/><circle cx={x} cy="321" r="3" fill="#e7cca4"/></g>)}
      <path d="M257 395L213 446H125M485 395L530 446H620" fill="none" stroke="#8abbd5" strokeOpacity=".6"/><Caption x={125} y={471} small>远侧隆起</Caption><Caption x={620} y={471} small anchor="end">近侧隆起</Caption>
      <Caption x={805} y={390} small anchor="middle">月球</Caption><path d="M510 321H757" stroke="#a0b6cd" strokeOpacity=".15" strokeDasharray="3 8"/>
      <Readout x={90} y={577} label="此刻距离 / 参考距离" value={instantaneousDistance.toFixed(2)} unit="×"/><Readout x={480} y={577} label="相对潮汐作用 ∝ 1 / d³" value={(1 / instantaneousDistance ** 3).toFixed(2)} unit="×"/>
      <Caption x={940} y={642} small anchor="end">海洋形变大幅夸张；真实潮汐还受海盆、地形与太阳影响</Caption>
    </>;
  } else if (scene === 'galaxy' && mode === 'distance') {
    const parallax = val('parallax', .1), distance = 1 / Math.max(.001, parallax), width = clamp(parallax * 230, 8, 140);
    const orbitAngle = clock * .7, observerX = 290 + Math.cos(orbitAngle) * 145, observerY = 473 + Math.sin(orbitAngle) * 42, apparentX = 782 - Math.cos(orbitAngle) * width / 2;
    content = <>
      <ellipse cx="290" cy="473" rx="145" ry="42" fill="none" stroke="#9db4cb" strokeOpacity=".35"/>
      <Star x={290} y={473} r={24}/><g opacity=".35"><Earth x={145} y={473} r={15}/><Earth x={435} y={473} r={15}/></g>
      <path d={`M${observerX} ${observerY}L290 183`} stroke="#a6cde1" strokeWidth="1.7" strokeOpacity=".9"/><Earth x={observerX} y={observerY} r={18}/>
      <Star x={290} y={183} r={9} color="#d2e4ff"/>
      <path d="M145 473L290 183 435 473" fill="none" stroke="#d1b78f" strokeOpacity=".55"/><path d="M290 473V143" stroke="#a6bbd0" strokeOpacity=".3" strokeDasharray="3 7"/>
      <path d="M290 241Q308 241 320 234" stroke="#edc99c" fill="none"/><Caption x={316} y={265} small essential>p</Caption>
      <Caption x={290} y={536} small anchor="middle">基线半径 1 AU · 两次观测相隔半年</Caption><Caption x={290} y={132} small anchor="middle">近邻恒星</Caption>
      <path d="M580 140V530" stroke="#8296b0" strokeOpacity=".2"/>
      <rect x="635" y="160" width="295" height="300" rx="10" fill="#14202e" fillOpacity=".45" stroke="#8298ae" strokeOpacity=".15"/>
      {Array.from({ length: 35 }, (_, i) => <circle key={i} cx={650 + seed(i + 1500) * 260} cy={177 + seed(i + 1600) * 260} r={.8 + seed(i) * 1.3} fill="#e2eaf4" opacity=".55"/>)}
      <circle cx={782 - width / 2} cy="309" r="5" fill="#e7c49b"/><circle cx={782 + width / 2} cy="309" r="5" fill="#9cc9df"/>
      <circle cx={apparentX} cy="309" r="11" fill="none" stroke="#f0debd" strokeWidth="1.5"/><circle cx={apparentX} cy="309" r="3" fill="#f8ecd5"/>
      <path d={`M${782 - width / 2} 343H${782 + width / 2}`} stroke="#d6d9d8"/><Caption x={782} y={378} small essential anchor="middle">摆动全幅 2p</Caption><Caption x={782} y={500} small anchor="middle">相对遥远背景恒星的年周摆动</Caption>
      <Readout x={90} y={585} label="视差角 p" value={parallax.toFixed(3)} unit="arcsec"/><Readout x={440} y={585} label="距离 d = 1 / p" value={distance.toFixed(1)} unit="pc"/><Caption x={940} y={626} small anchor="end">角度与恒星位移大幅放大；1 pc ≈ 3.26 ly</Caption>
    </>;
  } else if (scene === 'galaxy' && mode === 'rotation') {
    const dark = val('dark', 1);
    const expected = Array.from({ length: 80 }, (_, i) => `${500 + i / 79 * 410},${450 - rotationSpeed(i / 79 * 30, false) / 350 * 292}`).join(' ');
    const observed = Array.from({ length: 80 }, (_, i) => `${500 + i / 79 * 410},${450 - rotationSpeed(i / 79 * 30, Boolean(dark)) / 350 * 292}`).join(' ');
    const selectedRadius = val('distance', 10), selectedSpeed = rotationSpeed(selectedRadius, Boolean(dark));
    const timeCompression = 1e15, physicalAngularSpeed = selectedSpeed / (selectedRadius * 3.0856775814913673e16), angularSpeed = physicalAngularSpeed * timeCompression, orbitAngle = clock * angularSpeed;
    content = <>
      <g transform="translate(252 309)"><ellipse rx="195" ry="195" fill="url(#u-darkHalo)" opacity={clamp(dark * .5, 0, 1)}/>{[52, 93, 137].map(r => <ellipse key={r} rx={r} ry={r * .48} fill="none" stroke="#8299b3" strokeOpacity=".2"/>)}<ellipse rx="139" ry="62" fill="url(#u-galaxyDisc)"/><Star x={0} y={0} r={20}/>{Array.from({ length: 130 }, (_, i) => { const a = seed(i) * TAU, r = Math.sqrt(seed(i + 700)) * 138; return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r * .45} r="1" fill="#e7d7c0" opacity=".7"/>; })}<circle data-testid="rotation-orbiter" data-radius-kpc={selectedRadius} data-speed={selectedSpeed} data-angle={orbitAngle} data-angular-speed={angularSpeed} data-physical-angular-speed={physicalAngularSpeed} data-time-compression={timeCompression} cx={Math.cos(orbitAngle) * selectedRadius / 30 * 170} cy={Math.sin(orbitAngle) * selectedRadius / 30 * 170 * .45} r="5" fill="#b9dcf1"/></g>
      <Caption x={252} y={515} small anchor="middle">ω = v(r) / r · 播放 1 s = 31.7 Myr</Caption><Caption x={252} y={537} small anchor="middle">可见星系盘 + 暗物质晕示意</Caption>
      <Grid x={500} y={158} width={410} height={292} nx={5}/><polyline points={expected} fill="none" stroke="#acb9c7" strokeWidth="2" strokeDasharray="6 7"/><polyline points={observed} fill="none" stroke="#e4c49a" strokeWidth="3"/>
      {[0,100,200,300].map(speed=><Caption key={speed} x={487} y={454-speed/350*292} small essential anchor="end">{speed}</Caption>)}{[0,10,20,30].map(radius=><Caption key={radius} x={500+radius/30*410} y={470} small essential anchor="middle">{radius}</Caption>)}
      <line x1={500 + selectedRadius / 30 * 410} x2={500 + selectedRadius / 30 * 410} y1={450 - selectedSpeed / 350 * 292} y2="450" stroke="#e8d6b9" strokeOpacity=".35" strokeDasharray="3 5"/><circle cx={500 + selectedRadius / 30 * 410} cy={450 - selectedSpeed / 350 * 292} r="6" fill="#efd4aa"/>
      <Caption x={500} y={139} small essential>速度 / km·s⁻¹ ↑</Caption><Caption x={910} y={493} small essential anchor="end">银心距离 / kpc →</Caption><line x1="520" x2="552" y1="519" y2="519" stroke="#e4c49a" strokeWidth="3"/><Caption x={565} y={523} small>可见物质 + 暗物质</Caption><line x1="520" x2="552" y1="551" y2="551" stroke="#acb9c7" strokeDasharray="5 5"/><Caption x={565} y={555} small>仅按可见物质估算</Caption>
      <Readout x={90} y={587} label={`${selectedRadius.toFixed(1)} kpc 处轨道速度`} value={selectedSpeed.toFixed(0)} unit="km/s"/><Caption x={940} y={611} small anchor="end">v² = GM(&lt;r) / r · 示例质量分布，非银河实测数据</Caption>
    </>;
  } else if (scene === 'galaxy' && mode === 'collision') {
    const progress = clamp(val('collision', .6), 0, 1), dark = val('dark', 1), split = 300 * (progress - .5), centre1 = 500 + split, centre2 = 500 - split;
    const lag = progress <= .5 ? 1 : .24;
    const gas1 = 500 + split * lag, gas2 = 500 - split * lag;
    content = <>
      {[{ x: centre1, gas: gas1, color: '#9fbfdc', index: 0 }, { x: centre2, gas: gas2, color: '#b6a4c9', index: 1 }].map(cluster => <g key={cluster.index}>
        <ellipse cx={cluster.gas} cy="319" rx={78 + 45 * progress} ry="84" fill="#ce8c87" opacity=".12" filter="url(#u-blur)"/><ellipse cx={cluster.gas} cy="319" rx={61 + 35 * progress} ry="60" fill="#c48b84" opacity=".13"/>
        {[78, 105, 134].map(r => <ellipse key={r} cx={dark ? cluster.x : cluster.gas} cy="319" rx={r} ry={r * .77} fill="none" stroke={cluster.color} strokeWidth="1.4" strokeOpacity=".45" strokeDasharray="4 5"/>)}
        {Array.from({ length: 38 }, (_, i) => { const a = seed(i + 3000 + cluster.index * 100) * TAU, r = Math.sqrt(seed(i + 3200)) * 103; return <g key={i} transform={`translate(${cluster.x + Math.cos(a) * r} ${319 + Math.sin(a) * r * .7}) rotate(${seed(i) * 160})`}><ellipse rx={3 + seed(i) * 4} ry="1.6" fill="#e3d7c4" opacity=".8"/></g>; })}
        <path d={`M${cluster.x} 312V326M${cluster.x - 7} 319H${cluster.x + 7}`} stroke={cluster.color} strokeWidth="1.5"/>
      </g>)}
      <path d={`M${gas1} 370L420 482H245`} fill="none" stroke="#d09b91" strokeOpacity=".7"/><Caption x={245} y={508} anchor="middle" color="#d6ada1">高温气体 · X 射线</Caption><Caption x={245} y={536} small anchor="middle">发生碰撞并受到阻力</Caption>
      <path d={`M${centre1 + 105} 319L790 211H929`} fill="none" stroke="#a9c7df" strokeOpacity=".6"/><Caption x={929} y={190} anchor="end" color="#b8d5e8">引力透镜推断的质量分布</Caption><Caption x={929} y={237} small anchor="end">{dark ? '与星系群一起越过碰撞区' : '假设质量仅跟随可见气体'}</Caption>
      <Readout x={90} y={587} label="碰撞过程" value={(progress * 100).toFixed(0)} unit="%"/><Caption x={940} y={603} small anchor="end">子弹星系团证据的定性重构；轮廓非观测数据</Caption><Caption x={940} y={630} small anchor="end">星系、气体与质量中心的分离支持非普通物质成分</Caption>
    </>;
  } else if (scene === 'galaxy') {
    const particles = Array.from({ length: 580 }, (_, i) => { const arm = i % 4, t = seed(i + 1800) * 4.2, r = 15 + t * 55, a = arm * Math.PI / 2 + t * 1.18; return { x: 500 + Math.cos(a) * r + (seed(i) - .5) * 30, y: 316 + Math.sin(a) * r * .57 + (seed(i + 20) - .5) * 19, r: .5 + seed(i + 45) * 1.8, t }; });
    const discAngle = -13 + clock * 1.2, flatten = 1 - age * .86;
    const solarX = 500 + 124 * Math.cos(rad(discAngle)) - 44 * Math.sin(rad(discAngle));
    const solarY = 316 + (124 * Math.sin(rad(discAngle)) + 44 * Math.cos(rad(discAngle))) * flatten;
    content = <>
      <ellipse cx="500" cy="316" rx="310" ry="205" fill="url(#u-darkHalo)"/>
      <g transform={`translate(0 ${316 * age * .86}) scale(1 ${flatten}) rotate(${discAngle} 500 316)`}><ellipse cx="500" cy="316" rx="246" ry="148" fill="url(#u-galaxyDisc)"/>
        {[0, 1, 2, 3].map(a => <path key={a} d={Array.from({ length: 90 }, (_, i) => { const t = i / 89 * 4.2, r = 15 + t * 55, theta = a * Math.PI / 2 + t * 1.18; return `${i ? 'L' : 'M'}${500 + Math.cos(theta) * r} ${316 + Math.sin(theta) * r * .57}`; }).join(' ')} fill="none" stroke="#809eb7" strokeWidth="20" opacity=".12" filter="url(#u-blur)"/>)}
        {particles.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.t < .8 ? '#edcfaa' : i % 6 === 0 ? '#d59bba' : '#bed3e7'} opacity={.3 + seed(i + 120) * .65}/>)}
        <ellipse cx="500" cy="316" rx="52" ry="27" fill="url(#u-galaxyCore)"/><circle cx="500" cy="316" r="6" fill="#fff1d2"/>
        <circle cx="624" cy="360" r="5" fill="#f7c995"/><circle cx="624" cy="360" r="13" fill="none" stroke="#e8c69d" strokeOpacity=".5"/>
      </g>
      <path d={`M${solarX} ${solarY}L789 410H922`} fill="none" stroke="#d9bf97" strokeOpacity=".65"/><Caption x={922} y={438} anchor="end">太阳系 SOLAR SYSTEM</Caption><Caption x={922} y={463} small anchor="end">距银心约 8 kpc</Caption>
      <path d="M485 310L277 165H90" fill="none" stroke="#c1c8d0" strokeOpacity=".4"/><Caption x={90} y={148} small>中央核球与棒状结构</Caption>
      <path d="M270 428L194 500H90" fill="none" stroke="#c1c8d0" strokeOpacity=".4"/><Caption x={90} y={529} small>星际气体、尘埃与年轻恒星</Caption>
      <Readout x={90} y={586} label="银河恒星盘直径数量级" value="100,000" unit="ly"/><Caption x={940} y={610} small anchor="end">艺术示意；旋臂、恒星数量及加速转动不按真实比例</Caption>
    </>;
  } else if (scene === 'cosmos' && mode === 'history') {
    const scale = val('scale', 1), H0 = val('H0', 70), today = cosmicAge(1, H0), time = cosmicAge(scale, H0), maxTime = Math.max(today, time);
    const matter = .3 / scale ** 3, radiation = 9e-5 / scale ** 4, darkEnergy = .7;
    const events = [{ t: 0, label: '热大爆炸' }, { t: .00038, label: '复合 · CMB' }, { t: .2, label: '第一批恒星' }, { t: today - 4.57, label: '太阳系形成' }, { t: today, label: '今天' }];
    const mapTime = (t: number) => 100 + Math.log10(1 + t * 15) / Math.log10(1 + maxTime * 15) * 800;
    const x = mapTime(time);
    const densityX = (a: number) => 590 + (Math.log10(a) + 4) / (Math.log10(2) + 4) * 340;
    const densityY = (density: number) => 400 - (Math.log10(density) + 6) / 18 * 250;
    const densityComponents = [
      { id: 'radiation', label: '辐射', power: -4, today: 9e-5, value: radiation, color: '#e1b690', formula: '∝ a⁻⁴' },
      { id: 'matter', label: '物质', power: -3, today: .3, value: matter, color: '#a8c8df', formula: '∝ a⁻³' },
      { id: 'dark-energy', label: '暗能量', power: 0, today: .7, value: darkEnergy, color: '#baa3cc', formula: '= 常数' },
    ];
    compactReadings = <dl className="u-compact-readings">{densityComponents.map(component => <div key={component.id}><dt>{component.label} ρ/ρc,₀</dt><dd>{component.value < .001 || component.value > 1000 ? component.value.toExponential(2) : component.value.toFixed(3)}</dd></div>)}</dl>;
    content = <>
      <Caption x={90} y={113}>大爆炸后 {time.toFixed(2)} Gyr</Caption><Caption x={90} y={139} small>{scale > 1 ? '未来' : '回望'} {Math.abs(time - today).toFixed(2)} Gyr</Caption>
      <path d="M90 293Q150 289 220 257T510 177V418Q330 379 220 330T90 303Z" fill="url(#u-cosmicHistory)" stroke="#94abc3" strokeOpacity=".2"/>
      <path d="M90 298Q230 269 510 177M90 298Q230 341 510 418" fill="none" stroke="#9db4cc" strokeOpacity=".3"/>
      <ellipse cx="119" cy="298" rx="9" ry="20" fill="#f2ce98" opacity=".9"/><ellipse cx="163" cy="298" rx="10" ry="28" fill="none" stroke="#eac7a0" strokeWidth="7" strokeOpacity=".5"/>
      {Array.from({ length: 95 }, (_, i) => { const f = seed(i + 2200), px = 195 + f * 300, half = 24 + f * 76; return <g key={i} transform={`translate(${px} ${298 + (seed(i + 200) - .5) * half * 2}) rotate(${seed(i) * 150})`}><ellipse rx={1.2 + f * 3} ry={.8 + f} fill={i % 4 ? '#b7d3e5' : '#e4b998'} opacity=".6"/></g>; })}
      <Caption x={90} y={457} small>空间尺度增长示意；不是在外部空间中的爆炸</Caption>
      <g data-testid="cosmic-density" data-scale={scale} data-radiation={radiation} data-matter={matter} data-dark-energy={darkEnergy} data-radiation-model="density-only-separate-from-age">
        <defs><clipPath id="u-density-clip"><rect x="590" y="150" width="340" height="250"/></clipPath></defs>
        <Grid x={590} y={150} width={340} height={250} nx={4} ny={6}/>
        <Caption x={590} y={122} small essential>密度 ρ / ρc,₀</Caption>
        {[12, 9, 6, 3, 0, -3, -6].map(log => <Caption key={log} x={578} y={densityY(10 ** log) + 4} small essential anchor="end">10<tspan baselineShift="super" fontSize="12">{log}</tspan></Caption>)}
        {[{ a: .0001, text: '10⁻⁴' }, { a: .001, text: '10⁻³' }, { a: .01, text: '0.01' }, { a: .1, text: '0.1' }, { a: 1, text: '1' }].map(({ a, text }) => <Caption key={a} x={densityX(a)} y={422} small essential anchor="middle">{text}</Caption>)}
        <Caption x={930} y={444} small essential anchor="end">尺度因子 a →</Caption>
        <g clipPath="url(#u-density-clip)">
          {densityComponents.map(component => <g key={component.id}>
            <polyline data-testid={`density-${component.id}`} data-power={component.power} data-density={component.value} points={Array.from({ length: 130 }, (_, i) => { const a = 10 ** (-4 + i / 129 * (Math.log10(2) + 4)); return `${densityX(a)},${densityY(component.today * a ** component.power)}`; }).join(' ')} fill="none" stroke={component.color} strokeWidth="2"/>
            <circle cx={densityX(scale)} cy={densityY(component.value)} r="4" fill={component.color}/>
          </g>)}
          <line x1={densityX(scale)} x2={densityX(scale)} y1="150" y2="400" stroke="#e8d7bd" strokeOpacity=".5" strokeDasharray="3 5"/>
        </g>
        {densityComponents.map((component, i) => <g key={component.id}>
          <line x1="590" x2="613" y1={467 + i * 24} y2={467 + i * 24} stroke={component.color} strokeWidth="2"/>
          <text x="622" y={471 + i * 24} className="u-label u-small u-density-label">{component.label} {component.formula}</text>
          <text x="930" y={471 + i * 24} className="u-label u-small u-density-label" textAnchor="end">{component.value < .001 || component.value > 1000 ? component.value.toExponential(2) : component.value.toFixed(3)}</text>
        </g>)}
      </g>
      <path d="M100 542H900" stroke="#91a8bf" strokeOpacity=".4"/>
      <path d={`M${x} 530V559`} stroke="#ecd0a9" strokeWidth="2"/><circle cx={x} cy="542" r="7" fill="#f5d5a8" fillOpacity=".25" stroke="#e8c99e"/>
      {events.map((event, i) => <g key={event.label}><circle cx={mapTime(event.t)} cy="542" r="4" fill="#d6c09e"/><path d={`M${mapTime(event.t)} 542V${i % 2 ? 589 : 555}`} stroke="#899fb5" strokeOpacity=".4"/><Caption x={i === 0 ? 65 : i === 1 ? 195 : mapTime(event.t)} y={i % 2 ? 611 : 577} small anchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>{event.label}</Caption></g>)}
      <g className="u-model-note"><Caption x={60} y={634} small>密度：Ωr,₀ ≈ 9×10⁻⁵；年龄：H₀={H0}、Ωm=0.3、ΩΛ=0.7（不含辐射）</Caption>
      <Caption x={60} y={652} small>时间轴经对数压缩；早期事件采用教学近似年代</Caption></g>
    </>;
  } else if (scene === 'cosmos' && mode === 'relativity') {
    const lensMass = val('mass', 1), impact = val('distance', 1), bend = clamp(lensMass / impact * 12, 7, 105), wave = wrap(clock * 85, 780), offset = 35 + impact * 15;
    content = <>
      {Array.from({ length: 9 }, (_, i) => { const y = 135 + i * 43; const depth = Math.max(0, 1 - Math.abs(y - 310) / 210) * bend; return <path key={i} d={`M90 ${y}Q300 ${y} 400 ${y + depth}T610 ${y}H915`} fill="none" stroke="#7896b4" strokeOpacity=".13"/>; })}
      <path d="M105 320H900" stroke="#899eb6" strokeOpacity=".2" strokeDasharray="4 8"/>
      <ellipse cx="510" cy="320" rx={44 + lensMass * 2} ry={25 + lensMass} fill="url(#u-galaxyCore)"/><Star x={510} y={320} r={14 + lensMass}/>
      <path d={`M105 320C${300 - bend} 320 ${450 - bend} ${320 - offset} 510 ${320 - offset}S${720 + bend} 320 900 320`} fill="none" stroke="#e6c79d" strokeWidth="2"/>
      <path d={`M105 320C${300 - bend} 320 ${450 - bend} ${320 + offset} 510 ${320 + offset}S${720 + bend} 320 900 320`} fill="none" stroke="#9dbfd7" strokeWidth="2"/>
      <circle cx={105 + wave} cy={320 - Math.sin(wave / 780 * Math.PI) ** 2 * offset} r="3" fill="#ffe4b9"/>
      <Star x={105} y={320} r={14} color="#cfe5ff"/><Earth x={900} y={320} r={22}/>
      <Caption x={105} y={386} small anchor="middle">遥远光源</Caption><Caption x={510} y={400 + offset * .4} small anchor="middle">前景质量 · 引力透镜</Caption><Caption x={900} y={373} small anchor="middle">观测者</Caption>
      <path d={`M510 ${320 - offset}V320`} stroke="#bcd3e2" strokeOpacity=".5" strokeDasharray="3 5"/><Caption x={529} y={315 - offset * .5} small>b</Caption>
      <Caption x={500} y={518} anchor="middle">质量越大、光线越靠近，偏折越明显。</Caption>
      <Readout x={90} y={582} label="相对偏折 ∝ M / b" value={(lensMass / impact).toFixed(2)} unit="×"/><Caption x={940} y={602} small anchor="end">弱场偏折角 α ≈ 4GM / (bc²)</Caption><Caption x={940} y={627} small anchor="end">弯曲与尺度均为夸张示意；不是光线轨迹数值积分</Caption>
    </>;
  } else {
    const scale = val('scale', 1), H0 = val('H0', 70), centre = { x: 500, y: 320 };
    const galaxies = Array.from({ length: 52 }, (_, i) => { const a = seed(i + 2400) * TAU, r = Math.sqrt(seed(i + 2600)) * 200; return { x: centre.x + Math.cos(a) * r * scale, y: centre.y + Math.sin(a) * r * .68 * scale, i }; }).filter(g => g.x > 60 && g.x < 940 && g.y > 130 && g.y < 505);
    const target = { x: 500 + 125 * scale, y: 320 - 60 * scale };
    content = <>
      <g opacity=".2">{Array.from({ length: 11 }, (_, i) => <g key={i}><path d={`M${500 + (i - 5) * 70 * scale} 125V510`} stroke="#526e8c"/><path d={`M60 ${320 + (i - 5) * 45 * scale}H940`} stroke="#526e8c"/></g>)}</g>
      {galaxies.map(g => <g key={g.i} transform={`translate(${g.x} ${g.y}) rotate(${seed(g.i) * 180})`}><ellipse rx={5 + seed(g.i) * 7} ry="2.4" fill={g.i % 3 ? '#bed4e8' : '#e7c8a8'} opacity=".65"/><ellipse rx="15" ry="5" fill="#b2cee8" opacity=".06"/></g>)}
      <circle cx="500" cy="320" r="5" fill="#e7c9a0"/><circle cx="500" cy="320" r="14" fill="none" stroke="#e7c9a0" strokeOpacity=".5"/>
      <path d={`M500 320L${target.x} ${target.y}`} stroke="#e3c59e" strokeOpacity=".8" markerEnd="url(#u-arrowGold)"/><circle cx={target.x} cy={target.y} r="16" fill="none" stroke="#a9cde1" strokeOpacity=".65"/>
      <Caption x={500} y={355} small anchor="middle">任选一个观测位置</Caption>
      <g aria-label="同一束光的波长随宇宙尺度因子成正比伸长">
        <rect x="75" y="416" width="255" height="91" rx="5" fill="#0b1421" opacity=".9" stroke="#abc5dc" strokeOpacity=".1"/>
        <Caption x={90} y={438} small>跟随一束光 · λ / λ₀ = a</Caption>
        <path d={Array.from({length:160},(_,i)=>`${i?'L':'M'}${90+i*1.4} ${470+Math.sin((i*1.4-clock*12)/(9*scale))*11}`).join(' ')} fill="none" stroke={scale>=1?'#dfb292':'#99b7dc'} strokeWidth="1.6"/>
      </g>
      <Caption x={clamp(target.x + 22, 100, 850)} y={target.y - 22} small>{(scale * 100).toFixed(0)} Mpc</Caption>
      <path d="M90 527H910" stroke="#a0b4cb" strokeOpacity=".15"/>
      <Readout x={90} y={575} label="尺度因子 a（相对值）" value={scale.toFixed(2)}/><Readout x={400} y={575} label="哈勃常数 H₀" value={H0.toFixed(0)} unit="km/s/Mpc"/><Readout x={760} y={575} label="示例退行速度 v = H₀d" value={(H0 * scale * 100).toFixed(0)} unit="km/s"/>
      <Caption x={940} y={643} small anchor="end">共动网格的示意切片；星系自身及引力束缚系统不随之等比例膨胀</Caption>
    </>;
  }

  return <div className={`universe universe-${scene} universe-mode-${mode}`}><svg ref={svg} viewBox="0 75 1000 585" role="img" aria-label={`${sceneLabels[scene]}互动教学图`} aria-describedby="u-model-description">
    <title>{`${sceneLabels[scene]}互动教学图`}</title><desc id="u-model-description">{descriptions[mode] ?? descriptions[scene]}</desc>
    <defs>
      <radialGradient id="u-earth" cx="30%" cy="26%" r="85%"><stop stopColor="#6ba4b9"/><stop offset=".5" stopColor="#315f80"/><stop offset="1" stopColor="#102236"/></radialGradient>
      <radialGradient id="u-shade" cx="17%" cy="35%" r="88%"><stop offset=".25" stopColor="#06101c" stopOpacity="0"/><stop offset=".75" stopColor="#020815" stopOpacity=".1"/><stop offset="1" stopColor="#020815" stopOpacity=".8"/></radialGradient>
      <radialGradient id="u-starLight" cx="20%" cy="16%"><stop stopColor="#fff" stopOpacity=".7"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      <radialGradient id="u-moon" cx="38%" cy="25%"><stop stopColor="#e5e1d7"/><stop offset="1" stopColor="#aab4bf"/></radialGradient>
      <radialGradient id="u-nightHalo"><stop stopColor="#97aec7" stopOpacity=".08"/><stop offset="1" stopColor="#97aec7" stopOpacity="0"/></radialGradient>
      <linearGradient id="u-rays"><stop stopColor="#d6a56b" stopOpacity=".15"/><stop offset="1" stopColor="#d6a56b" stopOpacity="0"/></linearGradient>
      <linearGradient id="u-metal" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#354859"/><stop offset=".48" stopColor="#192a3a"/><stop offset="1" stopColor="#0e1926"/></linearGradient>
      <linearGradient id="u-spectrum"><stop stopColor="#a48ad4"/><stop offset=".17" stopColor="#718ccf"/><stop offset=".33" stopColor="#7dbac5"/><stop offset=".49" stopColor="#a4c69b"/><stop offset=".65" stopColor="#ebd894"/><stop offset=".82" stopColor="#daa071"/><stop offset="1" stopColor="#b97479"/></linearGradient>
      <linearGradient id="u-chartFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d8c19e" stopOpacity=".2"/><stop offset="1" stopColor="#d8c19e" stopOpacity="0"/></linearGradient>
      <radialGradient id="u-atmosphere"><stop offset=".55" stopColor="#5ba8d3" stopOpacity="0"/><stop offset=".65" stopColor="#6badd1" stopOpacity=".14"/><stop offset="1" stopColor="#6badd1" stopOpacity="0"/></radialGradient>
      <radialGradient id="u-darkHalo"><stop stopColor="#7186a9" stopOpacity=".15"/><stop offset=".5" stopColor="#7186a9" stopOpacity=".08"/><stop offset="1" stopColor="#7186a9" stopOpacity="0"/></radialGradient>
      <radialGradient id="u-galaxyDisc"><stop stopColor="#f6d8aa" stopOpacity=".6"/><stop offset=".17" stopColor="#d7bba0" stopOpacity=".2"/><stop offset=".65" stopColor="#94b2cf" stopOpacity=".06"/><stop offset="1" stopColor="#94b2cf" stopOpacity="0"/></radialGradient>
      <radialGradient id="u-galaxyCore"><stop stopColor="#fff3d5" stopOpacity=".8"/><stop offset=".3" stopColor="#efcf9e" stopOpacity=".45"/><stop offset="1" stopColor="#e4bb8b" stopOpacity="0"/></radialGradient>
      <linearGradient id="u-cosmicHistory"><stop stopColor="#e2b47d" stopOpacity=".6"/><stop offset=".12" stopColor="#967a73" stopOpacity=".35"/><stop offset=".35" stopColor="#293853" stopOpacity=".3"/><stop offset="1" stopColor="#223f5c" stopOpacity=".15"/></linearGradient>
      <filter id="u-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="12"/></filter>
      <marker id="u-arrowGold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L9 5 1 9" fill="none" stroke="#dec09a" strokeWidth="1.3"/></marker>
      <marker id="u-arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L9 5 1 9" fill="none" stroke="#a0c4cb" strokeWidth="1.3"/></marker>
    </defs>
    <g className="u-background" aria-hidden="true">{Array.from({ length: 105 }, (_, i) => <circle key={i} cx={seed(i + 4000) * 1000} cy={seed(i + 4200) * 660} r={.4 + seed(i + 4400)} fill="#d0dfef" opacity={.08 + seed(i + 4600) * .22}/>)}</g>
    <g key={`${scene}-${mode}`} className="u-content">{content}</g>
  </svg>{mode==='history'&&<MobileDensityPlot scale={val('scale',1)}/>}<div className="u-compact-key" aria-label="图的坐标与图例" data-testid="compact-teaching-key">{compactReadings}{(compactKeys[mode] ?? compactKeys[scene] ?? []).map((line, i) => <p key={i}>{line}</p>)}</div></div>;
}

function MobileDensityPlot({scale}:{scale:number}) {
 const x=(a:number)=>45+(Math.log10(a)+4)/(Math.log10(2)+4)*290;
 const y=(density:number)=>155-(Math.log10(density)+6)/18*130;
 const components=[{label:'辐射 ∝ a⁻⁴',power:-4,today:9e-5,color:'#e1b690'},{label:'物质 ∝ a⁻³',power:-3,today:.3,color:'#a8c8df'},{label:'Λ 恒密度',power:0,today:.7,color:'#baa3cc'}];
 return <div className="u-mobile-density"><svg viewBox="0 0 360 190" role="img" aria-label="完整宽度的辐射、物质与暗能量密度双对数图" data-testid="mobile-cosmic-density" data-scale={scale}>
  <defs><clipPath id="u-mobile-density-clip"><rect x="45" y="20" width="290" height="137"/></clipPath></defs>
  {[12,6,0,-6].map(power=><g key={power}><path d={`M45 ${y(10**power)}H335`} stroke="#637a924d"/><text x="39" y={y(10**power)+5} textAnchor="end">10<tspan baselineShift="super" fontSize="11">{power}</tspan></text></g>)}
  {[{a:.0001,label:'10⁻⁴'},{a:.01,label:'0.01'},{a:1,label:'1'}].map(tick=><g key={tick.a}><path d={`M${x(tick.a)} 20V155`} stroke="#637a924d"/><text x={x(tick.a)} y="179" textAnchor="middle">{tick.label}</text></g>)}
  <g clipPath="url(#u-mobile-density-clip)">{components.map(component=><g key={component.power} data-mobile-density-power={component.power} data-density={component.today*scale**component.power}><polyline points={Array.from({length:100},(_,i)=>{const a=10**(-4+i/99*(Math.log10(2)+4));return `${x(a)},${y(component.today*a**component.power)}`;}).join(' ')} stroke={component.color} strokeWidth="2" fill="none"/><circle cx={x(scale)} cy={y(component.today*scale**component.power)} r="4" fill={component.color}/></g>)}<path d={`M${x(scale)} 20V155`} stroke="#e5cfab" strokeDasharray="3 5"/></g>
 </svg><div className="u-mobile-density-legend"><p>{components.map(component=><span key={component.power}><i style={{background:component.color}}/>{component.label}</span>)}</p><p>横轴：尺度 a（双对数） · 纵轴：ρ / 今日临界密度。</p><p>年龄按晚期物质 + Λ 估算，不含辐射。</p></div></div>;
}
