import type { ReactNode } from 'react';
import { clusterPopulation, clusterTurnoffMass, transmissionDepth, pulsarSignal, inspiralState, supernovaModulus, syntheticSupernovaModulus, syntheticSupernovae } from '../lib/advancedAstro';
import { transitDepth } from '../lib/astro';
import './Universe.css';
import './AdvancedExperiments.css';

type Props = { scene: string; mode: string; values: Record<string, number>; onChange: (key: string, value: number) => void };
const cyan = '#8dcacb', gold = '#e5be86', muted = '#8c9db3';
const rad = (d: number) => d * Math.PI / 180;
const path = (points: [number, number][]) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
// These two fixed cosmologies never depend on animation time. Integrate once.
const supernovaCurves = [1, .3].map(omegaMatter => ({ omegaMatter, points: Array.from({ length: 150 }, (_, i) => { const z = .02 + i * 1.48 / 149; return { z, mu: supernovaModulus(z, omegaMatter) }; }), residuals: syntheticSupernovae.map(sn => sn.mu - supernovaModulus(sn.z, omegaMatter)) }));
const chirpPoints = Array.from({ length: 1001 }, (_, i) => [555 + i / 1000 * 330, 380 - inspiralState(i / 1000).strain * 16] as [number, number]);
const fullChirp = path(chirpPoints);
function Text({ x, y, children, small = false, essential = false, fill, anchor = 'start' }: { x: number; y: number; children: ReactNode; small?: boolean; essential?: boolean; fill?: string; anchor?: 'start' | 'middle' | 'end' }) {
  return <text x={x} y={y} textAnchor={anchor} className={`ae-text${small ? ' ae-small' : ''}${essential ? ' ae-essential' : ''}`} fill={fill ?? '#cfdae4'}>{children}</text>;
}
function Button({ x, y, selected, label, onClick }: { x: number; y: number; selected: boolean; label: string; onClick: () => void }) {
  return <g className="ae-button" role="button" tabIndex={0} aria-label={label} aria-pressed={selected} onClick={onClick} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }} transform={`translate(${x} ${y})`}><rect width="167" height="36" rx="18" fill={selected ? '#29414b' : '#101e2c'} stroke={selected ? cyan : '#344455'}/><Text x={83.5} y={23} anchor="middle">{label}</Text></g>;
}
function PlotGrid({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <g className="ae-grid">{[0, .25, .5, .75, 1].map(t => <g key={t}><line x1={x + w * t} x2={x + w * t} y1={y} y2={y + h}/><line x1={x} x2={x + w} y1={y + h * t} y2={y + h * t}/></g>)}</g>;
}

function Cluster({ values, onChange }: Props) {
  const age = values.clusterAge ?? 1, turnoff = clusterTurnoffMass(age);
  const population = clusterPopulation(age);
  const x = (t: number) => 135 + 720 * (Math.log10(35000) - Math.log10(t)) / (Math.log10(35000) - Math.log10(2500));
  const y = (l: number) => 510 - (Math.log10(l) + 2) / 8 * 365;
  const turnX = x(5772 * turnoff ** .5), turnY = y(turnoff ** 3.5);
  return <g data-experiment="cluster" data-age={age} data-turnoff-mass={turnoff}>
    <Text x={105} y={75}>同一片星云，同一出生时刻</Text><Text x={105} y={103} small>年龄只前进一项；质量决定哪些恒星已经耗尽核心氢。</Text>
    <PlotGrid x={135} y={145} w={720} h={365}/>
    {[.01, 1, 100, 10000, 1000000].map((l, i) => <Text key={l} x={120} y={y(l) + 4} small essential anchor="end">{['10⁻²', '1', '10²', '10⁴', '10⁶'][i]}</Text>)}
    {[30000, 15000, 7000, 3500].map(t => <Text key={t} x={x(t)} y={540} small essential anchor="middle">{t.toLocaleString()}</Text>)}
    <Text x={135} y={132} small>光度 / L☉ · 对数</Text><Text x={855} y={566} small anchor="end">表面温度 ← 更热</Text>
    <path d={path(clusterPopulation(.001).map(s => [x(s.temperature), y(s.luminosity)]))} stroke="#536274" strokeWidth="9" opacity=".2" fill="none"/>
    {population.map((s, i) => <g key={i} data-stage={s.stage} data-mass={s.mass} data-lifetime={s.lifetime} data-temperature={s.temperature} data-luminosity={s.luminosity}>
      {s.stage !== 'remnant' && <circle cx={x(s.temperature)} cy={y(s.luminosity)} r={s.stage === 'giant' ? 8 : 3.5 + s.mass ** .3} fill={s.stage === 'giant' ? gold : s.temperature > 7000 ? '#b3d8ff' : '#f2dbc1'} opacity=".85"/>}
      <title>{`${s.mass.toFixed(2)} M☉ · 主序寿命 ${s.lifetime.toFixed(3)} Gyr · ${s.stage}`}</title>
    </g>)}
    <circle data-testid="cluster-turnoff" cx={turnX} cy={turnY} r="17" fill="none" stroke={cyan} strokeWidth="2"/>
    <path d={`M${turnX + 20} ${turnY}H${Math.min(820, turnX + 115)}`} stroke={cyan}/>
    <Text x={Math.min(725, turnX + 40)} y={turnY - 19} essential fill={cyan}>主序转折</Text>
    <Text x={135} y={572} small>已演化离开主序：{population.filter(s => s.stage !== 'main-sequence').length} / {population.length} 颗 · 遗迹不在本图定位</Text>
    <Text x={105} y={603}>年龄 {age.toFixed(2)} Gyr　·　转折质量 {turnoff.toFixed(2)} M☉</Text>
    <Text x={105} y={630} small>tMS ≈ 10 Gyr × (M/M☉)^−2.5；巨星与遗迹位置为示意，非精确演化轨迹。</Text>
    <Button x={674} y={63} selected={age === .1} label="年轻星团 0.1 Gyr" onClick={() => onChange('clusterAge', .1)}/>
    <Button x={674} y={105} selected={age === 10} label="年老星团 10 Gyr" onClick={() => onChange('clusterAge', 10)}/>
  </g>;
}

function Transmission({ values, onChange }: Props) {
  const r = values.radiusEarth ?? 4, atmosphere = (values.atmosphere ?? 1) === 1, strength = values.bandStrength ?? 1, wavelength = values.wavelength ?? 589;
  const continuum = transitDepth(r) * 1e6;
  const top = transmissionDepth(940, r, true, 1) * 1e6;
  const span = Math.max(40, (top - continuum) * 1.5), min = continuum - span * .12;
  const x = (nm: number) => 120 + (nm - 400) / 600 * 760;
  const y = (ppm: number) => 490 - (ppm - min) / span * 315;
  const depth = transmissionDepth(wavelength, r, atmosphere, strength) * 1e6;
  const points = Array.from({ length: 301 }, (_, i) => { const nm = 400 + i * 2; return [x(nm), y(transmissionDepth(nm, r, atmosphere, strength) * 1e6)] as [number, number]; });
  return <g data-experiment="transmission" data-wavelength={wavelength} data-depth-ppm={depth} data-atmosphere={atmosphere ? 1 : 0}>
    <Text x={105} y={75}>让行星大气留下波长指纹</Text><Text x={105} y={103} small>吸收更强 → 有效遮挡半径更大 → 同一波长的凌日更深。</Text>
    <Button x={700} y={64} selected={atmosphere} label={atmosphere ? '大气：开启' : '大气：关闭'} onClick={() => onChange('atmosphere', atmosphere ? 0 : 1)}/>
    <PlotGrid x={120} y={175} w={760} h={315}/>
    {[0, .25, .5, .75, 1].map(t => { const ppm = min + span * t; return <Text key={t} x={105} y={490 - 315 * t + 4} small essential anchor="end">{ppm >= 1000 ? `${(ppm / 1000).toFixed(1)}k` : ppm.toFixed(0)}</Text>; })}
    {[400, 500, 600, 700, 800, 900, 1000].map(nm => <Text key={nm} x={x(nm)} y={517} small essential anchor="middle">{nm}</Text>)}
    <Text x={120} y={155} small>凌日深度 δλ / ppm · 物理数值轴</Text><Text x={880} y={543} small anchor="end">波长 / nm</Text>
    <line x1={120} x2={880} y1={y(continuum)} y2={y(continuum)} stroke={muted} strokeDasharray="5 6"/>
    <path data-testid="transmission-curve" d={path(points)} fill="none" stroke={cyan} strokeWidth="3"/>
    {[{ nm: 589, label: 'Na' }, { nm: 770, label: 'K' }, { nm: 940, label: 'H₂O' }].map(b => <g key={b.nm}><line x1={x(b.nm)} x2={x(b.nm)} y1={185} y2={480} stroke={gold} opacity=".35"/><Text x={x(b.nm)} y={174} essential anchor="middle" fill={gold}>{b.label}</Text></g>)}
    <line x1={x(wavelength)} x2={x(wavelength)} y1={170} y2={495} stroke="#e4edf4" opacity=".4"/>
    <circle data-testid="transmission-selected" cx={x(wavelength)} cy={y(depth)} r="7" fill={gold}/>
    <rect x={120} y={175} width={760} height={315} fill="transparent" className="ae-interactive" role="slider" tabIndex={0} aria-label="选择透射光谱波长" aria-valuemin={400} aria-valuemax={1000} aria-valuenow={wavelength} onKeyDown={e => { if (e.key.startsWith('Arrow')) { e.preventDefault(); onChange('wavelength', Math.max(400, Math.min(1000, wavelength + (e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 5 : -5)))); } }} onPointerDown={e => { const box = e.currentTarget.getBoundingClientRect(); onChange('wavelength', Math.round(400 + Math.max(0, Math.min(1, (e.clientX - box.left) / box.width)) * 600)); }}/>
    <Text x={105} y={585}>{wavelength.toFixed(0)} nm　·　δλ = {depth.toFixed(1)} ppm　·　连续谱 {continuum.toFixed(1)} ppm</Text>
    <Text x={105} y={614} small>δλ = [R有效(λ)/R☉]²；恒星半径固定 1 R☉。同一行星的纵轴在开关/强度改变时保持固定。</Text>
    <Text x={105} y={638} small>合成代表性吸收带：位置近似、强度与大气厚度为教学示意；并非某颗行星的实测光谱。</Text>
  </g>;
}

function Remnants({ values, onChange }: Props) {
  const gw = (values.remnantKind ?? 0) === 1;
  const phase = values.spinPhase ?? 0, view = values.viewAngle ?? 45, tilt = values.beamTilt ?? 45;
  const p = values.inspiral ?? .2, state = inspiralState(p);
  const intensity = pulsarSignal(phase, view, tilt);
  const bx = 165 * Math.sin(rad(tilt)) * Math.cos(rad(phase)), by = -165 * Math.cos(rad(tilt));
  const vx = 190 * Math.sin(rad(view)), vy = -190 * Math.cos(rad(view));
  return <g data-experiment="remnants" data-kind={gw ? 'gw' : 'pulsar'}>
    <Text x={105} y={75}>{gw ? '靠近的双星，升高的音调' : '光束扫过你时，才看见脉冲'}</Text>
    <Text x={105} y={104} small>{gw ? '圆轨道、固定质量教学缩放；改变进程观察分离、频率和振幅一起变化。' : '自转轴固定；磁轴倾斜的两束光绕轴扫动。发光并非恒星整体忽明忽暗。'}</Text>
    <Button x={654} y={126} selected={!gw} label="脉冲星 Pulsar" onClick={() => onChange('remnantKind', 0)}/>
    <Button x={654} y={170} selected={gw} label="引力波 Inspiral" onClick={() => onChange('remnantKind', 1)}/>
    {!gw ? <>
      <g transform="translate(300 330)" data-testid="pulsar-geometry" data-beam-phase={phase} data-intensity={intensity} data-view-angle={view}>
        <ellipse rx="160" ry="45" fill="none" stroke="#8298b4" opacity=".25" strokeDasharray="4 5"/>
        <line x1={0} x2={0} y1={-192} y2={192} stroke={muted} strokeDasharray="5 5"/>
        <path d={`M0 0L${bx - 20} ${by - 10}L${bx + 20} ${by + 10}Z M0 0L${-bx - 20} ${-by - 10}L${-bx + 20} ${-by + 10}Z`} fill={cyan} opacity=".28"/>
        <line x1={-bx} x2={bx} y1={-by} y2={by} stroke={cyan} strokeWidth="3"/>
        <line x1={0} x2={vx} y1={0} y2={vy} stroke={gold} strokeDasharray="7 5" strokeWidth="2"/>
        <circle cx={vx} cy={vy} r="13" fill={gold} opacity={.35 + .65 * intensity}/><circle r="29" fill="#cae0ed"/><circle r="18" fill="#7295ac"/>
        <Text x={18} y={-178} small>自转轴</Text>
        <Text x={-190} y={199} fill={gold}>金色虚线：固定观测视线</Text>
        <Text x={-190} y={226} small>投影图；光束宽度与星体尺寸均已夸张。</Text>
      </g>
      <Text x={570} y={255}>一个自转周期的光变</Text>
      <PlotGrid x={570} y={290} w={310} h={175}/>
      <path data-testid="pulsar-lightcurve" d={path(Array.from({ length: 361 }, (_, i) => [570 + i / 360 * 310, 465 - 170 * pulsarSignal(i, view, tilt)] as [number, number]))} stroke={cyan} strokeWidth="2.5" fill="none"/>
      <line x1={570 + phase / 360 * 310} x2={570 + phase / 360 * 310} y1={285} y2={470} stroke={gold}/>
      <circle cx={570 + phase / 360 * 310} cy={465 - 170 * intensity} r="6" fill={gold}/>
      <Text x={570} y={490} small essential>0°</Text><Text x={880} y={490} small essential anchor="end">360°</Text>
      <Text x={105} y={600}>当前相对信号 {intensity.toFixed(3)}　·　视线 {view.toFixed(0)}°　·　磁轴 {tilt.toFixed(0)}°</Text>
      <Text x={105} y={630} small>改变视线可让脉冲出现或消失；窄光束轮廓为示意，未模拟真实磁层辐射。</Text>
    </> : <>
      <g transform="translate(300 315)" data-testid="inspiral-binary" data-separation={state.separation} data-wave-frequency={state.waveFrequency} data-amplitude={state.amplitude}>
        {[1, -1].map(sign => <g key={sign}><circle r={130 * state.separation} fill="none" stroke={cyan} opacity=".15"/><circle cx={sign * 130 * state.separation * Math.cos(state.phase)} cy={sign * 72 * state.separation * Math.sin(state.phase)} r="20" fill={sign > 0 ? '#d7e9f0' : gold}/></g>)}
        {[75, 110, 150, 190].map(r => <ellipse key={r} rx={r} ry={r * .62} fill="none" stroke={cyan} opacity={.04 + .03 * state.amplitude}/>)}
        <Text x={0} y={196} anchor="middle">分离 {state.separation.toFixed(2)} a₀</Text>
      </g>
      <Text x={555} y={258}>Chirp · 归一化引力波应变</Text>
      <PlotGrid x={555} y={285} w={330} h={190}/>
      <path d={fullChirp} fill="none" stroke={muted} opacity=".22" strokeWidth="1.3"/>
      <path data-testid="chirp-waveform" d={path(chirpPoints.slice(0, Math.max(2, Math.round(p * 1000) + 1)))} fill="none" stroke={cyan} strokeWidth="1.8"/>
      <line x1={555 + p * 330} x2={555 + p * 330} y1={280} y2={480} stroke={gold}/>
      <Text x={555} y={502} small>时间进程 →　频率与振幅一起增加</Text>
      <Text x={105} y={583}>fGW / f轨道,₀ = {state.waveFrequency.toFixed(2)}　·　振幅 / A₀ = {state.amplitude.toFixed(2)}</Text>
      <Text x={105} y={611} small>f轨道 ∝ a^−3/2；fGW = 2 f轨道；A ∝ 1/a（固定质量和距离）。</Text>
      <Text x={105} y={637} small>时间与距离均经压缩；曲线为合成教学模型，不含合并和铃宕阶段，不是实测事件。</Text>
    </>}
  </g>;
}

function Evidence({ values, onChange }: Props) {
  const accelerating = (values.accelerating ?? 1) === 1, om = accelerating ? .3 : 1, z = values.snRedshift ?? .65;
  const x = (redshift: number) => 125 + redshift / 1.5 * 750;
  const y = (mu: number) => 414 - (mu - 34) / 12 * 250;
  const residualY = (r: number) => 530 - r * 85;
  const obs = syntheticSupernovaModulus(z), model = supernovaModulus(z, om), residual = obs - model;
  return <g data-experiment="evidence" data-model={accelerating ? 'accelerating' : 'decelerating'} data-selected-z={z} data-selected-residual={residual}>
    <Text x={105} y={65}>从标准烛光，到膨胀的历史</Text><Text x={105} y={93} small>观测量是红移与校准后亮度；曲线是供比较的宇宙学模型。</Text>
    <Button x={510} y={112} selected={!accelerating} label="减速 Ωm=1" onClick={() => onChange('accelerating', 0)}/>
    <Button x={694} y={112} selected={accelerating} label="加速 Ωm=0.3" onClick={() => onChange('accelerating', 1)}/>
    <PlotGrid x={125} y={164} w={750} h={250}/>
    {[34, 38, 42, 46].map(mu => <Text key={mu} x={110} y={y(mu) + 4} small essential anchor="end">{mu}</Text>)}
    <Text x={125} y={142} small>距离模数 μ / mag</Text>
    {supernovaCurves.map(({ omegaMatter: m, points }) => <path key={m} data-testid={m === 1 ? 'sn-decelerating' : 'sn-accelerating'} d={path(points.map(point => [x(point.z), y(point.mu)]))} fill="none" stroke={m === .3 ? cyan : gold} strokeWidth={om === m ? 3 : 1.5} strokeDasharray={om === m ? undefined : '6 5'} opacity={om === m ? 1 : .55}/>)}
    {syntheticSupernovae.map((sn, i) => <g key={i} className="ae-point" role="button" tabIndex={0} aria-label={`选择合成超新星 红移 ${sn.z.toFixed(2)}`} onClick={() => onChange('snRedshift', sn.z)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange('snRedshift', sn.z); } }}>
      <line x1={x(sn.z)} x2={x(sn.z)} y1={y(sn.mu - sn.uncertainty)} y2={y(sn.mu + sn.uncertainty)} stroke="#c7d4df" opacity=".5"/>
      <circle cx={x(sn.z)} cy={y(sn.mu)} r="5" fill="#c7d4df"/><circle cx={x(sn.z)} cy={y(sn.mu)} r="12" fill="transparent"/>
    </g>)}
    {[0, .5, 1, 1.5].map(r => <Text key={r} x={x(r)} y={439} small essential anchor="middle">{r.toFixed(1)}</Text>)}
    <Text x={875} y={460} small anchor="end">红移 z</Text>
    <Text x={125} y={470} small>合成数据 − 所选模型 / mag</Text>
    <line x1={125} x2={875} y1={530} y2={530} stroke={muted} strokeDasharray="4 5"/>
    {[0, .5].map(r => <Text key={r} x={110} y={residualY(r) + 4} small essential anchor="end">{r.toFixed(1)}</Text>)}
    {syntheticSupernovae.map((sn, i) => { const r = supernovaCurves[accelerating ? 1 : 0].residuals[i]; return <circle key={i} data-testid="sn-residual" data-residual={r} cx={x(sn.z)} cy={residualY(r)} r="4" fill={om === .3 ? cyan : gold}/>; })}
    <line x1={x(z)} x2={x(z)} y1={164} y2={555} stroke="#e2e9ed" opacity=".25"/>
    <circle cx={x(z)} cy={y(obs)} r="9" fill="none" stroke="#fff" strokeWidth="2"/>
    <circle data-testid="sn-selected-residual" cx={x(z)} cy={residualY(residual)} r="6" fill="#fff"/>
    <Text x={105} y={583}>z = {z.toFixed(2)}　·　模型 μ = {model.toFixed(2)} mag　·　残差 {residual.toFixed(2)} mag</Text>
    <Text x={105} y={610} small>合成教学数据围绕 Ωm=0.3、ΩΛ=0.7 生成；用于展示比较方法，不能作为独立观测证据。</Text>
    <Text x={105} y={636} small>平直模型，H₀=70 km/s/Mpc；dL=(c/H₀)(1+z)∫dz/E(z)，μ=5log₁₀[dL/Mpc]+25。</Text>
  </g>;
}

export default function AdvancedExperiments(props: Props) {
  const label = props.mode === 'cluster' ? '同龄星团年龄与赫罗图主序转折实验' : props.mode === 'transmission' ? '合成行星大气透射光谱实验' : props.mode === 'remnants' ? '脉冲星与双致密星引力波实验' : '合成超新星数据与宇宙加速模型对比实验';
  const viewBox=props.mode==='remnants'?'50 165 900 385':props.mode==='evidence'?'50 120 900 440':props.mode==='cluster'?'50 100 900 465':'50 130 900 435';
  return <div className={`universe ae-universe ae-mode-${props.mode}`}><svg className="ae-main-plot" viewBox={viewBox} role="img" aria-label={label}><g className="u-content ae-content">{props.mode === 'cluster' ? <Cluster {...props}/> : props.mode === 'transmission' ? <Transmission {...props}/> : props.mode === 'remnants' ? <Remnants {...props}/> : <Evidence {...props}/>}</g></svg><ExperimentGuide {...props}/></div>;
}

function Reading({ label, children }: { label: string; children: ReactNode }) { return <div><dt>{label}</dt><dd>{children}</dd></div>; }
function GuideButton({ selected, children, onClick }: { selected: boolean; children: ReactNode; onClick: () => void }) { return <button type="button" aria-pressed={selected} onClick={onClick}>{children}</button>; }
function Detector({ progress }: { progress: number }) {
  const state = inspiralState(progress), h = state.strain * .025;
  const horizontal = 82 * (1 + h / 2), vertical = 82 * (1 - h / 2);
  return <figure className="ae-detector"><svg viewBox="0 0 240 165" role="img" aria-label="激光干涉探测器两条垂直臂随引力波一伸一缩" data-testid="gw-detector" data-strain={h} data-horizontal-arm={horizontal} data-vertical-arm={vertical}>
    <path d="M22 127H65" stroke="#e8c596" strokeWidth="3"/>
    <path d={`M65 127H${65 + horizontal}M65 127V${127 - vertical}`} stroke="#a9dddd" strokeWidth="4" fill="none"/>
    <path d="M65 127H147M65 127V45" stroke="#dce4ec" strokeWidth="1.5" strokeDasharray="3 4" opacity=".55" fill="none"/>
    <rect x={65 + horizontal - 3} y={115} width="6" height="24" rx="2" fill="#e3eaf0"/>
    <rect x={53} y={127 - vertical - 3} width="24" height="6" rx="2" fill="#e3eaf0"/>
    <path d="M55 137L75 117" stroke="#e8c596" strokeWidth="4"/>
    <path d="M65 127V151" stroke="#e8c596" strokeWidth="3"/><circle cx={65} cy={154} r="7" fill={gold}/>
    <circle cx={20} cy={127} r="6" fill={gold}/>
  </svg><figcaption>激光 → 分光镜 → 两臂往返 → 干涉信号</figcaption></figure>;
}
function ExperimentGuide({ mode, values: v, onChange }: Props) {
  if (mode === 'cluster') {
    const age = v.clusterAge ?? 1, population = clusterPopulation(age);
    return <section className="ae-guide" aria-label="星团图例与读数"><p className="ae-guide-title">同龄星团：谁还留在主序？</p><dl className="ae-readings"><Reading label="年龄">{age.toFixed(2)} Gyr</Reading><Reading label="转折质量">{clusterTurnoffMass(age).toFixed(2)} M☉</Reading><Reading label="仍在主序">{population.filter(s => s.stage === 'main-sequence').length} / {population.length} 颗</Reading></dl><p><span className="ae-key ae-key-cyan"/>蓝环是主序转折；金色点已变成巨星。横轴是温度（K，左热右冷），纵轴是光度（L☉，对数）。</p><p>把星团变老，寿命较短的大质量星先离开主序，转折点向低质量移动。已演化的遗迹另计，不混在主序坐标中。</p><div className="ae-guide-actions"><GuideButton selected={age === .1} onClick={() => onChange('clusterAge', .1)}>年轻 · 0.1 Gyr</GuideButton><GuideButton selected={age === 10} onClick={() => onChange('clusterAge', 10)}>年老 · 10 Gyr</GuideButton></div><details><summary>寿命关系与模型</summary><p>tMS ≈ 10 Gyr × (M/M☉)⁻²·⁵。恒星同一时刻形成；巨星位置为示意，未加入金属丰度和双星差异。</p></details></section>;
  }
  if (mode === 'transmission') {
    const wavelength = v.wavelength ?? 589, radius = v.radiusEarth ?? 4, atmosphere = (v.atmosphere ?? 1) === 1;
    return <section className="ae-guide" aria-label="透射光谱图例与读数"><p className="ae-guide-title">吸收越强，凌日越深</p><dl className="ae-readings"><Reading label="所选波长">{wavelength.toFixed(0)} nm</Reading><Reading label="凌日深度">{(transmissionDepth(wavelength, radius, atmosphere, v.bandStrength ?? 1) * 1e6).toFixed(1)} ppm</Reading><Reading label="连续谱">{(transitDepth(radius) * 1e6).toFixed(1)} ppm</Reading></dl><p><span className="ae-key ae-key-cyan"/>横轴波长（nm），纵轴凌日深度（ppm，k=1000）；虚线是无大气的遮挡深度。对同一半径，开关大气和调整吸收强度时纵轴固定。</p><p>589 nm（钠）、770 nm（钾）、940 nm（水）是合成代表带。吸收让有效半径增加，曲线向上意味着遮挡更深。</p><div className="ae-guide-actions"><GuideButton selected={atmosphere} onClick={() => onChange('atmosphere', atmosphere ? 0 : 1)}>{atmosphere ? '关闭大气作比较' : '开启大气作比较'}</GuideButton><GuideButton selected={wavelength === 589} onClick={() => onChange('wavelength', 589)}>看钠吸收带</GuideButton><GuideButton selected={wavelength === 700} onClick={() => onChange('wavelength', 700)}>看连续谱</GuideButton></div><details><summary>公式与数据说明</summary><p>δλ = [R有效(λ)/R☉]²，恒星半径固定 1 R☉。吸收强度和大气厚度为教学示意，并非某颗行星的实测数据。</p></details></section>;
  }
  if (mode === 'remnants') {
    const gw = (v.remnantKind ?? 0) === 1, progress = v.inspiral ?? .2, state = inspiralState(progress);
    const phase = v.spinPhase ?? 0, view = v.viewAngle ?? 45, tilt = v.beamTilt ?? 45;
    return <section className="ae-guide" aria-label="致密星观测机制与读数"><div className="ae-guide-actions"><GuideButton selected={!gw} onClick={() => onChange('remnantKind', 0)}>脉冲星</GuideButton><GuideButton selected={gw} onClick={() => onChange('remnantKind', 1)}>引力波</GuideButton></div>{gw ? <><p className="ae-guide-title">双星靠近，波形变密，振幅增大</p><dl className="ae-readings"><Reading label="分离">{state.separation.toFixed(2)} a₀</Reading><Reading label="引力波频率">{state.waveFrequency.toFixed(2)} f轨道,₀</Reading><Reading label="相对振幅">{state.amplitude.toFixed(2)} A₀</Reading></dl><p>左图是双致密星，右图是归一化应变随时间进程变化。金线标出当前时刻；亮色波形是已经走过的过程。</p><div className="ae-detector-explanation"><Detector progress={progress}/><div><p className="ae-guide-title">怎样测到这阵波？</p><p>引力波让两条垂直探测臂一伸一缩。激光往返光程随之改变，在分光镜重合时产生变化的干涉信号。</p><p>下方两臂与当前 chirp 同步；白色虚线标出原臂长。图中伸缩幅度大幅放大。</p></div></div><details><summary>频率、应变与尺度</summary><p>固定质量和距离：f轨道 ∝ a⁻³ᐟ²，fGW = 2f轨道，A ∝ 1/a。探测器示意 Lx=L₀(1+h/2)、Ly=L₀(1−h/2)，h对应两臂相对长度差。本图时间、距离和应变均经缩放，未模拟合并与铃宕，非实测事件。</p></details></> : <><p className="ae-guide-title">旋转的灯塔，固定的视线</p><dl className="ae-readings"><Reading label="相对信号">{pulsarSignal(phase, view, tilt).toFixed(3)}</Reading><Reading label="自转相位">{phase.toFixed(0)}°</Reading><Reading label="视线 / 磁轴">{view.toFixed(0)}° / {tilt.toFixed(0)}°</Reading></dl><p><span className="ae-key ae-key-gold"/>金色虚线是固定观测视线；蓝色磁轴光束随恒星旋转。光束扫中视线，右图就出现脉冲峰。</p><p>改变视线角度，让光束始终扫不到你，脉冲会消失；恒星并未停止发光。两图都是投影与归一化示意。</p><div className="ae-guide-actions"><GuideButton selected={view === 45 && tilt === 45} onClick={() => { onChange('viewAngle', 45); onChange('beamTilt', 45); }}>让视线扫到光束</GuideButton><GuideButton selected={view === 85 && tilt === 15} onClick={() => { onChange('viewAngle', 85); onChange('beamTilt', 15); }}>让视线错开光束</GuideButton></div></>}</section>;
  }
  const accelerating = (v.accelerating ?? 1) === 1, om = accelerating ? .3 : 1, z = v.snRedshift ?? .65;
  const model = supernovaModulus(z, om), residual = syntheticSupernovaModulus(z) - model;
  return <section className="ae-guide" aria-label="超新星比较图例与读数"><p className="ae-guide-title">比较亮度观测与两种膨胀历史</p><dl className="ae-readings"><Reading label="红移 z">{z.toFixed(2)}</Reading><Reading label="模型距离模数">{model.toFixed(2)} mag</Reading><Reading label="数据减模型">{residual.toFixed(2)} mag</Reading></dl><p><span className="ae-key ae-key-cyan"/>蓝线：Ωm=0.3、ΩΛ=0.7 的加速模型。<span className="ae-key ae-key-gold"/>金线：Ωm=1、ΩΛ=0 的减速模型。上图横轴红移 z、纵轴距离模数 μ（mag）。下图是数据减去所选模型的残差（mag）。</p><p>白点是合成超新星亮度；它们围绕加速模型生成。切换模型，观察高红移处残差怎样改变。真实观测约束来自红移和校准后的亮度，并非先假定某个成分就等于发现它。</p><div className="ae-guide-actions"><GuideButton selected={!accelerating} onClick={() => onChange('accelerating', 0)}>比较减速模型</GuideButton><GuideButton selected={accelerating} onClick={() => onChange('accelerating', 1)}>比较加速模型</GuideButton></div><details><summary>合成数据与距离计算</summary><p>教学数据只展示比较方法，不能作为独立观测证据。固定平直模型与 H₀=70 km/s/Mpc：dL=(c/H₀)(1+z)∫dz/E(z)，μ=5log₁₀[dL/Mpc]+25。</p></details></section>;
}
