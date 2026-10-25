import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { absoluteCepheidMagnitude, apparentMagnitude, balmerWavelength, celsiusToKelvin, diffractionArcsec, eclipticSolarPosition, equilibriumTemperature, greySurfaceTemperature, hawkingRelativeLifetime, hawkingTemperature, hydrogenEnergy, kelvinToCelsius, labKindFor, lensImages, photometricDistance, planetPositions, radialAmplitude, relativeFlux, rotationalLineFlux, TRGB_I_MAGNITUDE, trgbDistance } from '../lib/conceptMath';
import type { LabConcept } from '../lib/conceptMath';
import './ConceptLab.css';
export { labKindFor } from '../lib/conceptMath';

const fmt = (n: number, digits = 1) => n.toLocaleString('zh-CN', { maximumFractionDigits: digits });
function Range({ label, value, set, min, max, step = 1, unit = '' }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; unit?: string }) {
  const id = useId();
  return <label className="cl-range" htmlFor={id}><span>{label}<output>{fmt(value, 2)} {unit}</output></span><input id={id} type="range" min={min} max={max} step={step} value={value} onChange={e => set(+e.target.value)} /></label>;
}
function Panel({ title, children, note }: { title: string; children: ReactNode; note: string }) {
  return <section className="cl-lab" aria-label={`${title}互动实验`}><div className="cl-top"><span className="cl-kicker">CONCEPT BENCH · 概念实验</span><h4>{title}</h4></div>{children}<p className="cl-note">{note}</p></section>;
}
function Graph({ children, label }: { children: ReactNode; label: string }) {
  return <div className="cl-graph-shell" style={{width:'100%',maxWidth:'100%',minWidth:0}}><style>{'.cl-graph-shell .cl-graph text{font-size:14px}.cl-scroll-hint{display:block}@media(min-width:641px){.cl-scroll-hint{display:none}}'}</style><div className="cl-graph-viewport" role="region" aria-label={`${label}，可横向滚动`} tabIndex={0} style={{width:'100%',maxWidth:'100%',overflowX:'auto',overscrollBehaviorX:'contain'}}><svg className="cl-graph" style={{minWidth:600}} viewBox="0 0 600 220" role="img" aria-label={label}>{children}</svg></div><p className="cl-scroll-hint" style={{fontSize:12,lineHeight:1.7,color:'#bacbd8',margin:'6px 0'}}>横向拖动图表查看完整坐标</p></div>;
}
function Line({ points, color = '#9fc8de' }: { points: string; color?: string }) { return <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />; }
const sample = (fn: (x: number) => number, start = 0, end = 1) => Array.from({ length: 121 }, (_, i) => { const x = start + (end - start) * i / 120; return `${40 + i * 4.3},${fn(x)}`; }).join(' ');

function Retrograde() {
  const [day, setDay] = useState(0); const [view, setView] = useState('earth'); const [inner, setInner] = useState(false);
  const p = planetPositions(day, inner); const scale = 57; const origin = view === 'earth' ? p.earth : { x: 0, y: 0 };
  const xy = (x: number, y: number) => [150 + (x - origin.x) * scale, 104 - (y - origin.y) * scale];
  const earth = xy(p.earth.x, p.earth.y), planet = xy(p.planet.x, p.planet.y), sun = xy(0, 0);
  const rate = (planetPositions(day + .1, inner).longitude - planetPositions(day - .1, inner).longitude + 540) % 360 - 180;
  const angle = (d: number) => { const v = planetPositions(d, inner); const a = view === 'earth' ? v.longitude - (inner ? 180 : 0) : v.heliocentric; return ((a + 180) % 360 + 360) % 360 - 180; };
  return <Panel title="把观察者也放进轨道" note="圆轨道、共面模型；轨道尺寸按 AU 统一缩放，天体大小夸张。地心画面是同一日心运动的坐标变换，并非托勒密本轮模型。">
    <div className="cl-options"><label>观察坐标<select value={view} onChange={e => setView(e.target.value)}><option value="earth">随地球移动</option><option value="sun">以太阳为中心</option></select></label><label>追踪行星<select value={inner ? 'venus' : 'mars'} onChange={e => setInner(e.target.value === 'venus')}><option value="mars">火星 · 外行星</option><option value="venus">金星 · 内行星</option></select></label></div>
    <Graph label="太阳、地球、行星与相对背景星的投影经度"><circle cx={sun[0]} cy={sun[1]} r={scale} className="cl-orbit"/><circle cx={sun[0]} cy={sun[1]} r={scale * (inner ? .723 : 1.524)} className="cl-orbit"/><line x1={earth[0]} y1={earth[1]} x2={planet[0]} y2={planet[1]} stroke="#d7ba85" strokeDasharray="4 3"/><circle cx={sun[0]} cy={sun[1]} r="7" fill="#edc675"/><circle cx={earth[0]} cy={earth[1]} r="5" fill="#8cbdd9"/><circle cx={planet[0]} cy={planet[1]} r="5" fill="#c98a73"/><text x="15" y="205">蓝：地球　橙：{inner ? '金星' : '火星'}</text><path d="M330 32V184H574" className="cl-axis"/><text x="337" y="26">相对背景星的经度</text>{[-180, 0, 180].map(a => <text key={a} x="325" textAnchor="end" y={110 - a / 2.7}>{a}°</text>)}<Line points={Array.from({ length: 161 }, (_, i) => `${333 + i * 1.45},${110 - angle(i - 80) / 2.7}`).join(' ')}/><circle cx={333 + (day + 80) * 1.45} cy={110 - angle(day) / 2.7} r="4" fill="#edc675"/><text x="337" y="205">−80天　　会合附近　　＋80天</text></Graph>
    <Range label="相对会合时刻" value={day} set={setDay} min={-80} max={80} unit="天"/><p className="cl-result">地球所见：{rate < 0 ? '正在逆行，投影经度减小' : '正在顺行，投影经度增加'}。日心轨道上的行星始终沿同一方向前进。</p><button className="cl-action" onClick={() => { setDay(0); setView('earth'); }}>来到追越附近</button>
  </Panel>;
}
function Hydrogen() {
  const [n, setN] = useState(3); const [absorb, setAbsorb] = useState(false); const wave = balmerWavelength(n); const energy = hydrogenEnergy(n) - hydrogenEnergy(2);
  return <Panel title="让氢原子选一个光子" note="采用氢原子的 Rydberg 近似，波长为真空值；能级高度按能量作图。这里演示 Balmer 系列，不把其他元素的谱线视为氢。">
    <div className="cl-options"><label>过程<select value={absorb ? 'absorb' : 'emit'} onChange={e => setAbsorb(e.target.value === 'absorb')}><option value="emit">向低能级跃迁 · 发射</option><option value="absorb">吸收匹配光子 · 跃迁</option></select></label></div>
    <Graph label={`氢原子从${absorb ? 2 : n}到${absorb ? n : 2}能级，${fmt(wave)}纳米`}>
      {[2, 3, 4, 5, 6].map(k => <g key={k}><line x1="45" x2="245" y1={55 - hydrogenEnergy(k) * 35} y2={55 - hydrogenEnergy(k) * 35} stroke={k === n || k === 2 ? '#d6b879' : '#3a485a'}/>{k === 6 && <path d={`M40 47L45 ${55-hydrogenEnergy(k)*35}`} fill="none" stroke="#93a6b7"/>}<text x="8" y={k === 6 ? 51 : k === 5 ? 72 : 60 - hydrogenEnergy(k) * 35}>n={k}</text></g>)}
      <path d={`M160 ${55 - hydrogenEnergy(absorb ? 2 : n) * 35} L160 ${55 - hydrogenEnergy(absorb ? n : 2) * 35}`} stroke="#b9d1e0" strokeWidth="3"/><text x="180" y="120">{absorb ? '↑ 吸收' : '↓ 发射'}</text>
      {[3,4,5,6].map(k => { const x = 320 + (balmerWavelength(k) - 380) * .8; return <g key={k}><line x1={x} x2={x} y1="55" y2="160" stroke={k === 3 ? '#e8907c' : k === 4 ? '#88cdda' : '#a898df'} strokeWidth={n === k ? 6 : 2} opacity={n === k ? 1 : .4}/><text x={x - 13} y={k === 6 ? 210 : 187}>{fmt(balmerWavelength(k), 0)}</text></g>; })}<text x="318" y="30">谱线位置 / nm</text>
    </Graph><Range label="上能级 n" value={n} set={setN} min={3} max={6}/><p className="cl-result"><strong>{fmt(wave, 2)} nm</strong> · ΔE = {fmt(energy, 3)} eV。{absorb ? '只有能量匹配的光子能驱动这个理想跃迁。' : '失去的原子能量成为发射光子的能量。'}</p><code className="cl-formula">1/λ = Rₕ(1/2² − 1/n²)　　E = hc/λ</code>
  </Panel>;
}
function Cepheid() {
  const [period, setPeriod] = useState(10), [m, setM] = useState(15); const M = absoluteCepheidMagnitude(period); const d = photometricDistance(m, M);
  return <Panel title="用脉动的一颗星测距离" note="经典造父变星 V 波段教学标定 Mᵥ ≈ −2.76 log₁₀P − 1.40；真实标定依波段、金属丰度和脉动模式变化。本实验忽略消光，光变形状仅为示意。">
    <Graph label="造父变星光变曲线与周期光度位置"><path d="M40 35V179H554" className="cl-axis"/><Line points={sample(t => 106 - 37 * Math.sin(t / period * 2 * Math.PI) - 9 * Math.sin(t / period * 4 * Math.PI), 0, 80)}/><text x="45" y="25">归一化光通量</text><text x="410" y="205">观测时间 0 → 80 天</text><line x1="40" x2={40 + period / 80 * 516} y1="163" y2="163" stroke="#d7ba85"/><text x="45" y="153">一个周期 {fmt(period)} 天</text></Graph>
    <Range label="脉动周期 P" value={period} set={setPeriod} min={2} max={60} step={.5} unit="天"/><Range label="平均视星等 mᵥ" value={m} set={setM} min={5} max={25} step={.1}/><p className="cl-result">标定绝对星等 <strong>{fmt(M, 2)}</strong> → 距离 <strong>{d >= 1e6 ? `${fmt(d / 1e6, 2)} Mpc` : `${fmt(d / 1000, 2)} kpc`}</strong>。同样的表观亮度，周期更长意味着更远。</p><code className="cl-formula">m − M = 5 log₁₀[d(pc)] − 5</code>
  </Panel>;
}
function Photometry() {
  const [distance, setDistance] = useState(10), [L, setL] = useState(1); const M = 4.83 - 2.5 * Math.log10(L); const m = apparentMagnitude(M, distance); const flux = relativeFlux(L, distance);
  return <Panel title="光度相同，远近不同" note="L 表示 V 波段光度相对于太阳，太阳 Mᵥ 取 4.83；忽略星际消光。示意星圆面积按光通量压缩显示，旁边数值保留实际反平方关系。">
    <Graph label="距离增大时光通量的反平方衰减"><circle cx="130" cy="106" r={Math.min(65, 18 * Math.sqrt(Math.sqrt(flux)))} fill="#e3c493"/><circle cx="130" cy="106" r="78" className="cl-orbit"/><text x="59" y="207">当前接收到的光</text><path d="M280 35V180H560" className="cl-axis"/><Line points={Array.from({ length: 100 }, (_, i) => { const d = 5 + i * 95 / 99; return `${280 + i * 2.8},${180 - 140 * (5 / d) ** 2}`; }).join(' ')}/><circle cx={280 + (distance - 5) / 95 * 277.2} cy={180 - 140 * (5 / distance) ** 2} r="5" fill="#edc675"/><text x="285" y="25">固定光度的接收光通量</text><text x="290" y="205">距离 5 → 100 pc</text></Graph>
    <Range label="距离" value={distance} set={setDistance} min={5} max={100} unit="pc"/><Range label="V 波段光度" value={L} set={setL} min={.1} max={10} step={.1} unit="L☉,V"/><p className="cl-result">mᵥ = <strong>{fmt(m, 2)}</strong>；Mᵥ = {fmt(M, 2)}；接收光通量为太阳放在 10 pc 时的 <strong>{fmt(flux, 3)} 倍</strong>。</p><button className="cl-action" onClick={() => setDistance(Math.min(100, distance * 2))} disabled={distance > 50}>距离加倍：光通量变为四分之一</button><code className="cl-formula">F ∝ L/d²　　Δm = −2.5 log₁₀(F₂/F₁)</code>
  </Panel>;
}
function Radial() {
  const [mass, setMass] = useState(1), [inclination, setInclination] = useState(90), [period, setPeriod] = useState(365.25); const K = radialAmplitude(mass, period, inclination); const a = (period / 365.25) ** (2 / 3); const b = a * 215.032 * Math.abs(Math.cos(inclination * Math.PI / 180)); const transit = b < 1.10045;
  return <Panel title="同一颗行星，两种探测信号" note="恒星取 1 M☉、1 R☉；行星半径固定为 1 R♃，圆轨道，Mp≪M★。RV 振幅采用低行星质量近似。仅说明几何可凌日，未模拟观测噪声、边缘昏暗或部分凌日深度。">
    <Graph label="轨道倾角改变恒星视向速度与凌日几率"><path d="M40 110H555" className="cl-axis"/><Line points={sample(t => 110 - K / 300 * 70 * Math.sin(t * 4 * Math.PI))}/><text x="40" y="25">恒星视向速度 · 同一纵轴刻度 ±300 m/s</text><text x="44" y="205">两圈轨道：靠近 ← 0 → 远离</text></Graph>
    <Range label="轨道倾角 i（90°侧向）" value={inclination} set={setInclination} min={0} max={90} step={.1} unit="°"/><Range label="真实行星质量" value={mass} set={setMass} min={.1} max={3} step={.1} unit="M♃"/><Range label="轨道周期" value={period} set={setPeriod} min={10} max={730} step={1} unit="天"/><div className="cl-readouts"><p>视向速度振幅<br/><strong>{fmt(K, 2)} m/s</strong></p><p>RV 给出的最低质量<br/><strong>{fmt(mass * Math.sin(inclination * Math.PI / 180), 3)} M♃</strong></p><p>凌日几何<br/><strong>{transit ? '可经过恒星盘' : '未经过恒星盘'}</strong></p><p>放在 10 pc：最大角分离<br/><strong>{fmt(a / 10, 3)}″</strong></p></div><p className="cl-result">面向轨道正上方时，恒星仍在摇摆，但运动没有视线方向分量。凌日约束半径；RV 约束 Mₚ sin i，两者结合才能进一步估计密度。<br/>直接成像还要分开恒星耀光：固定木星半径、几何反照率 0.3、满相位上限下，反射光仅为恒星的约 <strong>{(.3 * (.0004779 / a) ** 2).toExponential(1)}</strong>。拉长周期会扩大最大角分离，却削弱反射光和 RV 振幅；最大分离与满相位不是同一轨道位置。</p><code className="cl-formula">K ∝ Mₚ sin i · P⁻¹ᐟ³　　b = a cos i / R★　　Fₚ/F★ = Aɡ(Rₚ/a)²Φ</code>
  </Panel>;
}
function Climate() {
  const [a, setA] = useState(1), [albedo, setAlbedo] = useState(.3), [epsilon, setEpsilon] = useState(0), [L, setL] = useState(1); const te = equilibriumTemperature(L, a, albedo), ts = greySurfaceTemperature(te, epsilon);
  return <Panel title="能量收支与温室的一层模型" note="均匀再分配、短波透明、长波灰体的一层大气模型。ε 是红外吸收/发射率，不是 CO₂ 浓度。无云、水汽反馈、内部热或环流，因此数值不是现实气候预测。绿色带按太阳 0.95–1.67 AU 的示意边界随 √L 缩放，真实边界还依恒星光谱与气候。">
    <Graph label="随距离变化的平衡温度与恒星光度缩放的宜居带"><rect x={40 + Math.max(0, .95 * Math.sqrt(L) - .3) / 2.7 * 515} y="38" width={(1.67 - .95) * Math.sqrt(L) / 2.7 * 515} height="140" fill="#7eac96" opacity=".12"/><path d="M40 35V180H558" className="cl-axis"/><Line points={sample(d => Math.max(30, 190 - equilibriumTemperature(L, d, albedo) / 4), .3, 3)}/><circle cx={40 + (a - .3) / 2.7 * 516} cy={Math.max(30, 190 - te / 4)} r="5" fill="#edc675"/><text x="43" y="25">有效辐射温度（纵轴压缩）</text><text x="45" y="205">距恒星 0.3 → 3 AU · 绿色：参考宜居带</text></Graph>
    <Range label="距恒星距离" value={a} set={setA} min={.3} max={3} step={.01} unit="AU"/><Range label="恒星总光度" value={L} set={setL} min={.1} max={2} step={.1} unit="L☉"/><Range label="反照率（反射掉的份额）" value={albedo} set={setAlbedo} min={0} max={.8} step={.01}/><Range label="大气红外发射率 ε" value={epsilon} set={setEpsilon} min={0} max={1} step={.01}/><div className="cl-readouts"><p>有效辐射温度<br/><strong>{fmt(te)} K</strong></p><p>模型地表温度<br/><strong>{fmt(ts)} K / {fmt(ts - 273.15)} °C</strong></p></div><p className="cl-result">反照率增加会减少吸收；红外吸收增强时，地表需要更暖才能让系统向太空辐射同样多的能量。温度范围本身不能证明存在液态水或生命。</p><code className="cl-formula">Tₑ = [L(1−A)/(16πσd²)]¹ᐟ⁴　　Tₛ = Tₑ/(1−ε/2)¹ᐟ⁴</code>
  </Panel>;
}
function Galaxies({ initialShape = false }: { initialShape?: boolean }) {
  const [mode, setMode] = useState(initialShape ? 'shape' : 'lens'), [beta, setBeta] = useState(.8), [mass, setMass] = useState(1), [shape, setShape] = useState('spiral'), [tilt, setTilt] = useState(0); const thetaE = Math.sqrt(mass); const images = lensImages(beta, thetaE);
  return <Panel title="星系的投影与引力透镜" note="星系图为形态示意，观测倾角会改变外观。透镜采用固定距离组合的点质量薄透镜，θE 取 √(M/M₀) 角秒；光线/像位置并非质量的照片。β=0 时轴对称点源成为爱因斯坦环。">
    <div className="cl-options"><label>观察主题<select value={mode} onChange={e => setMode(e.target.value)}><option value="lens">引力透镜 · 源与像</option><option value="shape">星系形态 · 观看角度</option></select></label>{mode === 'shape' && <label>形态<select value={shape} onChange={e => setShape(e.target.value)}><option value="spiral">旋涡星系</option><option value="elliptical">椭圆星系</option><option value="irregular">不规则星系</option></select></label>}</div>
    {mode === 'lens' ? <><Graph label="点质量透镜的两个像与爱因斯坦环"><path d="M40 110H560" className="cl-axis"/><circle cx="300" cy="110" r="10" fill="#ead5a3"/>{Math.abs(beta) < .001 ? <circle cx="300" cy="110" r={thetaE * 62} fill="none" stroke="#9dcde2" strokeWidth="4"/> : images.map((theta, i) => <g key={i}><circle cx={300 + theta * 62} cy="110" r={i === 0 ? 7 : 5} fill="#9dcde2"/><text x={300 + theta * 62 - 17} y="153">θ{ i + 1}</text></g>)}<circle cx={300 + beta * 62} cy="110" r="14" fill="none" stroke="#d19e95"/><text x="40" y="26">粉色空心：无透镜时源位置 β</text><text x="40" y="205">蓝：观测到的像　金：前景质量中心</text></Graph><Range label="未偏折源位置 β" value={beta} set={setBeta} min={-1.5} max={1.5} step={.05} unit="角秒"/><Range label="前景质量" value={mass} set={setMass} min={.2} max={3} step={.1} unit="M₀"/><p className="cl-result">θE = <strong>{fmt(thetaE, 2)}″</strong>。{beta === 0 ? '完全对齐：理想爱因斯坦环。' : `两个像位于 ${fmt(images[0], 2)}″ 和 ${fmt(images[1], 2)}″。增加质量会扩大分离。`}</p><code className="cl-formula">θ± = (β ± √[β² + 4θE²])/2　　θE ∝ √M</code></> : <><Graph label={`${shape}星系的投影外观`}><g transform={`translate(300 108) scale(1 ${1 - tilt * .0085})`}>{Array.from({ length: 220 }, (_, i) => { const r = Math.sqrt((i + .5) / 220) * 95; const phi = shape === 'spiral' ? i * Math.PI * 2 / 2 + r / 20 : i * 2.39996; const x = r * Math.cos(phi), y = r * Math.sin(phi); return <circle key={i} cx={shape === 'irregular' ? x + Math.sin(i * 3.7) * 20 : x} cy={shape === 'elliptical' ? y * .7 : y} r={shape === 'elliptical' ? 2.8 : 1.7} fill={shape === 'elliptical' ? '#dfbe98' : i % 4 === 0 ? '#b4d8eb' : '#d8c3a3'} opacity={.4 + (1 - r / 100) * .5}/>; })}<circle r="14" fill="#e7d4b0" opacity=".5"/></g><text x="40" y="210">外形是投影，不能单凭倾角判断演化阶段</text></Graph><Range label="盘面倾角" value={tilt} set={setTilt} min={0} max={90} unit="°"/><p className="cl-result">{shape === 'spiral' ? '旋臂、盘与核球；侧向观看会让旋臂重叠。' : shape === 'elliptical' ? '椭圆星系以平滑光分布为特征；不应当作侧向旋涡星系。' : '不规则外观缺少清晰对称结构，气体与成星历史也需要光谱等证据。'}</p></>}
  </Panel>;
}
const bands = [
  { name: 'γ 射线', wavelength: 1e-12, window: '大气阻挡，主要在太空探测', object: '高能爆发、致密天体与极端粒子过程' },
  { name: 'X 射线', wavelength: 1e-9, window: '大气阻挡，需要太空望远镜', object: '高温气体、吸积盘与星系团热气体' },
  { name: '紫外', wavelength: 1e-7, window: '大部分被大气吸收，太空观测更合适', object: '年轻高温恒星与高能气体' },
  { name: '可见光', wavelength: 5.5e-7, window: '主要地面窗口；仍受天气与视宁度影响', object: '恒星、星云谱线与反射光' },
  { name: '近红外', wavelength: 2.2e-6, window: '部分窗口可从高而干燥的地面观测', object: '低温恒星、尘埃后方的恒星' },
  { name: '远红外', wavelength: 1e-4, window: '大多被水汽吸收，通常需要太空或特殊平台', object: '寒冷尘埃与成星区域' },
  { name: '射电', wavelength: .21, window: '主要窗口；部分频段仍被大气/电离层吸收', object: '中性氢 21 cm、脉冲星及非热辐射' },
];
function Windows() {
  const [band, setBand] = useState(3), [diameter, setDiameter] = useState(2), [baseline, setBaseline] = useState(100), [array, setArray] = useState(false); const b = bands[band]; const resolution = diffractionArcsec(b.wavelength, array ? baseline : diameter) / (array ? 1.22 : 1);
  return <Panel title="为信号选择一台望远镜" note="大气窗口是定性示意，会受具体波长、海拔和天气影响。θ≈1.22λ/D 用于圆口径；干涉阵列以同量级 λ/B 展示基线趋势，其实际波束还依阵列与成像重建。分辨率不等于集光面积。">
    <div className="cl-options"><label>观测波段<select value={band} onChange={e => setBand(+e.target.value)}>{bands.map((b, i) => <option key={b.name} value={i}>{b.name}</option>)}</select></label><label>仪器<select value={array ? 'array' : 'single'} onChange={e => setArray(e.target.value === 'array')}><option value="single">单一圆口径</option><option value="array">合成孔径 · 理想基线</option></select></label></div>
    <Graph label="电磁波波长与望远镜孔径关系"><path d="M40 170H560" className="cl-axis"/>{bands.map((b, i) => <g key={b.name}><rect x={43 + i * 74} y="60" width="65" height={i === band ? 100 : 65} rx="3" fill={['#a98bc3','#9495d1','#8baccd','#b9cba5','#d6bd91','#c89881','#a19aaa'][i]} opacity={i === band ? .85 : .25}/><text x={43 + i * 74} y="195">{b.name}</text></g>)}<text x="42" y="27">短波 / 高能量 ← 电磁波谱 → 长波 / 低能量</text></Graph>
    {array ? <Range label="最长基线" value={baseline} set={setBaseline} min={10} max={10000} step={10} unit="m"/> : <Range label="口径 D" value={diameter} set={setDiameter} min={.2} max={40} step={.2} unit="m"/>}<p className="cl-result"><strong>{b.window}</strong><br/>主要线索：{b.object}。<br/>理想角分辨尺度约 <strong>{resolution < .001 ? `${fmt(resolution * 1e6, 2)} μas` : `${fmt(resolution, 4)}″`}</strong>；同一波段将口径或基线加倍，此尺度减半。</p>
  </Panel>;
}
function Hawking() {
  const [logMass, setLogMass] = useState(0);
  const temperature = hawkingTemperature(10 ** logMass), relativeLifetime = hawkingRelativeLifetime(10 ** logMass);
  const x = (m: number) => 66 + (m + 18) / 27 * 482;
  const y = (t: number) => 181 - (Math.log10(t) + 17) / 28 * 140;
  return <Panel title="质量越大，霍金温度越低" note="孤立、非旋转、无电荷 Schwarzschild 黑洞的半经典温度模型，温度对应远方观察者；没有模拟吸积或环境辐射。图仅表示温度关系，没有用可见光光环表示霍金辐射。">
    <Range label="黑洞质量 log₁₀(M/M☉)" value={logMass} set={setLogMass} min={-18} max={9} step={.1}/>
    <div className="cl-options"><button className="cl-action" onClick={() => setLogMass(0)}>太阳质量</button><button className="cl-action" onClick={() => setLogMass(1)}>十倍太阳质量</button><button className="cl-action" onClick={() => setLogMass(-12)}>假设的微小黑洞</button></div>
    <div className="cl-readouts" aria-live="polite"><p>黑洞质量<br/><strong>10^{fmt(logMass)} M☉</strong></p><p>理论霍金温度<br/><strong><output aria-label="理论霍金温度">{temperature.toExponential(2)} K</output></strong></p><p>相对蒸发寿命 τ/τ☉<br/><strong><output aria-label="相对蒸发寿命">{relativeLifetime.toExponential(2)}</output></strong></p></div>
    <p className="cl-result">太阳质量黑洞的理论温度仅约 <strong>6.2 × 10⁻⁸ K</strong>，其孤立蒸发寿命远长于宇宙目前年龄。质量加倍，温度减半、蒸发寿命变为八倍。相对寿命以太阳质量黑洞为1，采用同一孤立蒸发近似；图中较小质量是模型探索，不代表已经发现这种微小黑洞。</p><code className="cl-formula">τ/τ☉ = (M/M☉)³　　log₁₀(τ/τ☉) = {fmt(3*logMass,2)}</code>
    <details className="cl-disclosure" open><summary>展开温度—质量图与推理</summary><Graph label="双对数坐标下黑洞质量与霍金温度的反比关系"><path d="M66 35V181H550" className="cl-axis"/><Line points={`${x(-18)},${y(hawkingTemperature(1e-18))} ${x(9)},${y(hawkingTemperature(1e9))}`}/><circle cx={x(logMass)} cy={y(temperature)} r="5" fill="#dfc99d"/>{[-18,-9,0,9].map(m => <text key={m} x={x(m)-8} y="201">{m}</text>)}{[-16,-8,0,8].map(t => <text key={t} x="30" y={y(10 ** t)+4}>{t}</text>)}<text x="75" y="25">log₁₀[T(K)]</text><text x="396" y="217">log₁₀(M/M☉)</text></Graph><code className="cl-formula">T = ℏc³ / (8πGkᴮM)　　T ∝ 1/M</code><p className="cl-result">辐射带走黑洞的能量，孤立模型中质量逐渐减少。天体黑洞附近明亮的吸积盘属于落入物质的辐射，与极微弱的霍金辐射要区分。</p><a className="cl-source" href="https://jila.colorado.edu/~ajsh/bh/hawk.html" target="_blank" rel="noreferrer">公式核验：JILA / Andrew Hamilton</a></details>
  </Panel>;
}
function BlackHoleOrigins() {
  const [origin, setOrigin] = useState<'primordial' | 'stellar'>('primordial');
  const primordial = origin === 'primordial';
  const stages = primordial ? ['极早期宇宙', '局部密度扰动足够强', '引力坍缩形成黑洞'] : ['已有恒星的宇宙', '大质量恒星演化', '核心坍缩留下黑洞'];
  return <Panel title="同是黑洞，起源可以不同" note="这是形成途径的定性对照，时间箭头不按比例。原初黑洞尚为假说；恒星坍缩不是所有黑洞的唯一可能起源，大质量恒星也并非必定留下黑洞。">
    <div className="cl-options" role="group" aria-label="选择黑洞起源"><button className="cl-action" aria-pressed={primordial} onClick={() => setOrigin('primordial')}>原初黑洞假说</button><button className="cl-action" aria-pressed={!primordial} onClick={() => setOrigin('stellar')}>恒星坍缩起源</button></div>
    <p className="cl-result"><strong>{primordial ? '在第一批恒星形成以前' : '在恒星已形成并完成演化以后'}</strong>：{primordial ? '假如早期宇宙有足够强的密度扰动，某些区域可能直接坍缩；这一途径不要求先有恒星。' : '恒星的核心失去足够支撑后坍缩，在适当条件下形成黑洞；它需要先经历恒星诞生与演化。'}</p>
    <details className="cl-disclosure" open><summary>展开形成过程与证据对照</summary><ol className="cl-origin-chain">{stages.map((stage, i) => <li key={stage}><span>0{i+1}</span>{stage}</li>)}</ol><div className="cl-origin-evidence"><span className="cl-kicker">证据能回答什么</span><p className="cl-result">{primordial ? '探测到黑洞并合引力波，说明有致密双星并合；单凭这一事实无法判定它们在极早期形成。检验原初起源还需质量、自旋、数量及其他观测约束共同支持。' : '双星的轨道、吸积辐射和并合引力波可以提供黑洞的证据。判断具体形成途径仍需结合质量、自旋与所处环境。'}</p></div><a className="cl-source" href="https://science.nasa.gov/dark-matter/" target="_blank" rel="noreferrer">背景核验：NASA · 原初黑洞候选假说</a></details>
  </Panel>;
}
function Trgb() {
  const [mI, setMI] = useState(24), [extinction, setExtinction] = useState(.1), [corrected, setCorrected] = useState(false);
  const distance = trgbDistance(mI, extinction), plottedMagnitude = mI - (corrected ? extinction : 0);
  const y = (m: number) => 35 + (m - 19) / 12 * 145;
  return <Panel title="红巨星支尖：另一把距离尺" note="颜色—星等图是定性教学点群，不是观测数据。采用老年、贫金属星族的示例 I 波段标定 Mᵢ≈−4.05；真实分析需要颜色、金属丰度、星族与滤光系统修正，不能把该值移用到 V 波段。">
    <Range label="支尖视星等 mᵢ（I 波段）" value={mI} set={setMI} min={20} max={28} step={.05}/><Range label="I 波段消光 Aᵢ" value={extinction} set={setExtinction} min={0} max={1.5} step={.05}/>
    <div className="cl-readouts"><p>消光校正后星等<br/><strong>{fmt(mI-extinction, 2)}</strong></p><p>真实距离模数 μ₀<br/><strong>{fmt(mI-extinction-TRGB_I_MAGNITUDE, 2)}</strong></p><p>推算距离<br/><strong>{fmt(distance/1e6, 3)} Mpc</strong></p></div>
    <p className="cl-result">同样的支尖标定下，看到的星等越大，推算距离越远。固定观测星等后，扣除更多消光会使本来应有的光更亮，因而推算距离更近。TRGB 根据红巨星群体的支尖亮度测距，无需先测造父变星的脉动周期。</p>
    <details className="cl-disclosure" open><summary>展开红巨星支与距离计算</summary><button className="cl-action" aria-pressed={corrected} onClick={() => setCorrected(!corrected)}>{corrected ? '显示观测图（含消光）' : '显示消光校正图'}</button><Graph label={`定性颜色—星等图，红巨星支尖I波段星等为${fmt(plottedMagnitude,2)}`}><path d="M65 30V185H550" className="cl-axis"/><text x="72" y="23">I 波段星等：上方更亮</text><text x="315" y="211">颜色（示意）：向右更红 →</text>{[20,24,28].map(m => <text key={m} x="35" y={y(m)+4}>{m}</text>)}{Array.from({length:56},(_,i)=>{const t=i/55, magnitude=plottedMagnitude+3*t;return <circle key={i} cx={370-115*t+Math.sin(i*2.4)*12} cy={y(magnitude)} r="2.2" fill="#cd9e83" opacity={.65}/>;})}<line x1="200" x2="510" y1={y(plottedMagnitude)} y2={y(plottedMagnitude)} stroke="#dfc99d" strokeDasharray="5 4"/><circle cx="370" cy={y(plottedMagnitude)} r="5" fill="#e1c99e"/><text x="405" y={y(plottedMagnitude)-9}>TRGB {fmt(plottedMagnitude,2)}</text></Graph><code className="cl-formula">μ₀ = mᵢ − Aᵢ − Mᵢ　　d(pc) = 10^[(μ₀ + 5)/5]</code><p className="cl-result">低质量红巨星在点燃核心氦以前沿红巨星支上升；开始氦燃烧后演化离开支尖，使群体亮度分布出现可识别边界。它与造父变星可作为不同恒星物理基础的距离检验，仍各自需要校准。</p><a className="cl-source" href="https://arxiv.org/abs/2106.13337" target="_blank" rel="noreferrer">I 波段标定核验：Hoyt 2021 原始研究</a></details>
  </Panel>;
}
function Broadening() {
  const [velocity, setVelocity] = useState(100);
  const points = (speed: number) => Array.from({length:241},(_,i)=>`${40+i*2.15},${40+175*(1-rotationalLineFlux(499.4+i/240*1.2,speed))}`).join(' ');
  return <Panel title="旋转把一条谱线展开" note="理想刚体旋转、均匀亮度圆盘；未计入边缘昏暗、差异自转、压力与仪器展宽。原始线为固定高斯吸收线，静止中心取示例值500.00 nm；数值为归一化光通量。">
    <Range label="投影视向旋转速度 v sin i" value={velocity} set={setVelocity} min={0} max={250} step={5} unit="km/s"/>
    <div className="cl-readable-plot"><div className="cl-plot-labels"><span>归一化光通量</span><span>连续谱 = 1</span></div><svg viewBox="0 0 600 180" role="img" aria-label="旋转展宽的吸收线两翼变宽，中心保持500纳米"><path d="M40 40H556M40 30V164H556" fill="none" stroke="#899bad" strokeWidth="1.5"/><line x1="298" x2="298" y1="35" y2="164" stroke="#d8bf8d" strokeWidth="1.5" strokeDasharray="5 4"/><polyline points={points(0)} fill="none" stroke="#a3b3c2" strokeWidth="2" strokeDasharray="5 4"/><Line points={points(velocity)} color="#a8d5ed"/></svg><div className="cl-plot-labels"><span>499.4 nm</span><strong>500.00 nm · 中心</strong><span>500.6 nm</span></div></div>
    <div className="cl-legend"><span><i style={{background:'#a8d5ed'}}/>当前旋转谱线</span><span><i style={{background:'#a3b3c2'}}/>虚线：无旋转</span></div>
    <p className="cl-result">可见恒星盘面的一侧朝我们运动，使光蓝移；另一侧远离，使光红移。两侧合在一起拓宽吸收线，<strong>中心不发生整体平移</strong>。当前旋转核的最大波长偏移约为 ±{fmt(500*velocity/299792.458,3)} nm；高斯原始线自身还具有延伸的两翼。</p><code className="cl-formula">Δλ最大 = λ₀(v sin i)/c　　均匀圆盘旋转核 ∝ √[1 − (Δλ/Δλ最大)²]</code>
  </Panel>;
}
function Ecliptic() {
  const [angle, setAngle] = useState(0); const sun = eclipticSolarPosition(angle), rad = angle*Math.PI/180;
  const ex=150+74*Math.cos(rad),ey=110-74*Math.sin(rad);
  return <Panel title="从公转平面到天空中的黄道" note="圆轨道、固定23.44°黄赤交角的教学示意；角度表示轨道相位，不用于指定真实公历日期。天体大小与距离夸张。右图以黄经为横轴，属于坐标展开图，不是天空照片。">
    <Range label="地球轨道角" value={angle} set={setAngle} min={0} max={360} unit="°"/>
    <div className="cl-diagram-pair"><div className="cl-readable-plot"><h5>公转平面 · 俯视</h5><svg viewBox="0 0 300 220" role="img" aria-label="地球绕太阳运行，地球所见太阳位于反方向背景"><circle cx="150" cy="110" r="74" fill="none" stroke="#899bad" strokeWidth="1.5"/><line x1={ex} y1={ey} x2={150-95*Math.cos(rad)} y2={110+95*Math.sin(rad)} stroke="#e5ca91" strokeWidth="2" strokeDasharray="5 3"/><circle cx="150" cy="110" r="10" fill="#e5ca91"/><circle cx={ex} cy={ey} r="6" fill="#a8d5ed"/><path d="M150 12V22M52 110H62M238 110H248M150 198V208" stroke="#899bad" strokeWidth="2"/></svg><div className="cl-legend"><span><i style={{background:'#a8d5ed'}}/>地球</span><span><i style={{background:'#e5ca91'}}/>太阳 / 观测视线</span></div></div>
    <div className="cl-readable-plot"><h5>太阳在天球上的周年路径</h5><div className="cl-plot-labels"><span>赤纬：北为正</span><span>±23.44°</span></div><svg viewBox="0 0 300 180" role="img" aria-label="太阳沿黄道运动，赤纬受黄赤交角限制"><path d="M20 90H280" stroke="#a2b2c2" strokeWidth="1.5" strokeDasharray="5 4"/><Line points={Array.from({length:181},(_,i)=>{const pos=eclipticSolarPosition(i*2-180);return `${20+i/180*260},${90-pos.declination*2.2}`;}).join(' ')} color="#e5ca91"/><circle cx={20+sun.longitude/360*260} cy={90-sun.declination*2.2} r="5" fill="#e5ca91"/>{Array.from({length:13},(_,i)=><line key={i} x1={20+i/12*260} x2={20+i/12*260} y1="151" y2="157" stroke="#899bad"/>)}</svg><div className="cl-plot-labels"><span>黄经0°</span><span>虚线：天赤道</span><span>360°</span></div></div></div>
    <p className="cl-result">地球轨道角为 {fmt(angle)}°，所见太阳黄经为 <strong>{fmt(sun.longitude)}°</strong>，赤纬约 <strong>{fmt(sun.declination,2)}°</strong>。黄道是地球公转平面在天球上的投影，太阳一年中沿它移动；它与天赤道相交而不重合。黄道附近的星座提供背景，图中均分刻度仅为角度尺，星座本身并非等宽区域。</p>
  </Panel>;
}
function RedEclipse() {
  const [atmosphere,setAtmosphere]=useState(true);
  return <Panel title="本影里的月亮为何仍有红光" note="光路与本影为定性示意，天体大小、距离及折射角夸张。真实月食颜色与亮度还受云、气溶胶及月球通过影区的位置影响；没有模拟真实食预报。">
    <button className="cl-action cl-large-control" aria-pressed={atmosphere} onClick={()=>setAtmosphere(!atmosphere)}>{atmosphere?'关闭地球大气':'开启地球大气'}</button>
    <div className="cl-readable-plot"><div className="cl-plot-labels"><span>太阳</span><span>地球</span><span>本影中的月球</span></div><svg viewBox="0 0 600 230" role="img" aria-label={atmosphere?'大气过滤并折射部分红光进入地球本影照亮月球':'没有大气时阳光无法直接进入地球本影，月球很暗'}><path d="M270 91L580 105V135L270 149Z" fill="#02060c" stroke="#77899a" strokeWidth="1.5"/><circle cx="50" cy="120" r="37" fill="#e5ca91"/><line x1="80" y1="94" x2="241" y2="104" stroke="#e5ca91" strokeWidth="2"/><line x1="80" y1="146" x2="241" y2="136" stroke="#e5ca91" strokeWidth="2"/>{atmosphere&&<circle cx="270" cy="120" r="38" fill="#9fcbdf12" stroke="#a8d5ed" strokeWidth="2"/>}<circle cx="270" cy="120" r="27" fill="#59738a" stroke="#bdd1df" strokeWidth="1.5"/>{atmosphere?<><path d="M60 85L270 84Q317 92 510 120M60 155L270 156Q317 148 510 120" fill="none" stroke="#f08e78" strokeWidth="3"/><path d="M265 84L247 54M265 84L290 49M265 156L247 187M265 156L290 191" stroke="#a8d5ed" strokeWidth="2" strokeDasharray="3 3"/></>:<path d="M60 85L270 84L570 82M60 155L270 156L570 158" fill="none" stroke="#91a1b0" strokeWidth="1.5" strokeDasharray="6 4"/>}<circle cx="510" cy="120" r="13" fill={atmosphere?'#bd6954':'#141d28'} stroke={atmosphere?'#f0a58c':'#9eafbf'} strokeWidth="1.5"/></svg></div>
    <div className="cl-legend"><span><i style={{background:'#f08e78'}}/>红：大气滤过并折射的光路</span><span><i style={{background:'#a8d5ed'}}/>蓝虚线：短波散射示意</span></div><p className="cl-result"><strong>{atmosphere?'大气开启：部分红光可以进入本影。':'大气关闭：这个理想本影里没有直达太阳光。'}</strong> {atmosphere?'阳光穿过地球边缘的长段大气，短波蓝光更容易被散射出去；剩下的较红光线被折射进影区，照亮月面。':'月亮仍位于地球后方，影子几何没有改变；去掉大气，便去掉了过滤与折射这条照明途径。'}</p>
  </Panel>;
}
function Kelvin() {
  const [kelvin,setKelvin]=useState(273.15),[kText,setKText]=useState('273.15'),[cText,setCText]=useState('0'),[error,setError]=useState('');
  const kid=useId(),cid=useId();
  const sync=(k:number)=>{setKelvin(k);setKText(String(+k.toFixed(2)));setCText(String(+kelvinToCelsius(k).toFixed(2)));setError('');};
  const update=(text:string,unit:'K'|'C')=>{if(unit==='K')setKText(text);else setCText(text);const number=Number(text);if(text.trim()===''||!Number.isFinite(number)){setError('输入一个温度数值。');return;}const k=unit==='K'?number:celsiusToKelvin(number);if(k<0||k>1000){setError('本实验范围为0–1000 K（−273.15–726.85 °C）。');return;}setKelvin(k);setError('');if(unit==='K')setCText(String(+kelvinToCelsius(k).toFixed(2)));else setKText(String(+k.toFixed(2)));};
  return <Panel title="改变零点，不改变一度的间隔" note="K 表示开尔文，书写时不用度号。摄氏温差1 °C等于开尔文温差1 K；绝对零度为0 K。本实验提供0–1000 K范围，水的常见冰点/沸点示例以约一标准大气压为条件。">
    <div className="cl-number-grid"><label htmlFor={kid}>开尔文 / K<input id={kid} type="number" min="0" max="1000" step=".01" value={kText} aria-invalid={!!error} onChange={e=>update(e.target.value,'K')}/></label><label htmlFor={cid}>摄氏温度 / °C<input id={cid} type="number" min="-273.15" max="726.85" step=".01" value={cText} aria-invalid={!!error} onChange={e=>update(e.target.value,'C')}/></label></div>{error&&<p className="cl-input-error" role="alert">{error}</p>}
    <Range label="绝对温度" value={kelvin} set={sync} min={0} max={1000} step={.01} unit="K"/><div className="cl-options"><button className="cl-action cl-large-control" onClick={()=>sync(0)}>绝对零度</button><button className="cl-action cl-large-control" onClick={()=>sync(273.15)}>水的冰点</button><button className="cl-action cl-large-control" onClick={()=>sync(373.15)}>水的沸点</button></div>
    <div className="cl-temperature-readout" aria-live="polite"><strong>{fmt(kelvin,2)} K</strong><span>=</span><strong>{fmt(kelvinToCelsius(kelvin),2)} °C</strong></div><p className="cl-result">把 {fmt(kelvinToCelsius(kelvin),2)} °C 加上273.15，得到 {fmt(kelvin,2)} K。转换改变的是温标零点：0 °C并不等于没有热运动，0 K才是绝对零度边界。</p><code className="cl-formula">T(K) = t(°C) + 273.15　　ΔT(K) = Δt(°C)</code>
  </Panel>;
}
export default function ConceptLab({ concept }: { concept: LabConcept }) {
  const kind = labKindFor(concept);
  if (kind === 'galaxies') return <Galaxies key={concept.id} initialShape={/galaxy-types|morphology|elliptical/i.test(`${concept.id} ${concept.english}`)}/>;
  const labs = { retrograde: Retrograde, hydrogen: Hydrogen, cepheid: Cepheid, photometry: Photometry, radial: Radial, climate: Climate, galaxies: Galaxies, windows: Windows, hawking: Hawking, origins: BlackHoleOrigins, trgb: Trgb, broadening: Broadening, ecliptic: Ecliptic, 'red-eclipse': RedEclipse, kelvin: Kelvin };
  const Component = kind ? labs[kind] : null;
  return Component ? <Component key={`${kind}-${concept.id}`}/> : null;
}
