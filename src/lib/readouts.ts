import type { SceneId } from '../data/curriculum';
import { cosmicAge, daylightHours, escapeVelocity, lunarPhase, moonIllumination, orbitalPeriod, parallaxDistance, distanceModulus, rotationSpeed, stellarLifetime, transitDepth, wienPeak } from './astro';
import { clusterTurnoffMass, inspiralState, pulsarSignal, supernovaModulus, syntheticSupernovaModulus, transmissionDepth } from './advancedAstro';
export type Readout = { label:string; value:string; unit:string };
const item = (label:string,value:string,unit=''):Readout=>({label,value,unit});
export const dateLabel = (day:number) => new Date(Date.UTC(2026,0,Math.floor(day))).toLocaleDateString('zh-CN',{month:'long',day:'numeric',timeZone:'UTC'});
export function getReadouts(scene:SceneId,mode:string,v:Record<string,number>):Readout[] {
 if(mode==='cluster')return [item('共同年龄',v.clusterAge.toFixed(2),'Gyr'),item('主序转折质量',clusterTurnoffMass(v.clusterAge).toFixed(2),'M☉ · 寿命幂律模型')];
 if(mode==='transmission')return [item('当前波长',v.wavelength.toFixed(0),'nm'),item('有效凌日深度',(transmissionDepth(v.wavelength,v.radiusEarth,!!v.atmosphere,v.bandStrength)*1e6).toFixed(0),'ppm · 合成谱')];
 if(mode==='remnants'){
  if(v.remnantKind===0)return [item('脉冲信号',(pulsarSignal(v.spinPhase,v.viewAngle,v.beamTilt)*100).toFixed(1),'% · 归一化'),item('自转相位',v.spinPhase.toFixed(0),'°')];
  const state=inspiralState(v.inspiral);
  return [item('双星间距',state.separation.toFixed(2),'相对初始值'),item('引力波频率',state.waveFrequency.toFixed(2),'相对初始轨道频率')];
 }
 if(mode==='evidence')return [item('选中红移',v.snRedshift.toFixed(2),'z'),item('观测 − 模型',(syntheticSupernovaModulus(v.snRedshift)-supernovaModulus(v.snRedshift,v.accelerating?.3:1)).toFixed(3),'mag · 合成观测')];
 if(scene==='sky') {
  const date=new Date(Date.UTC(2026,0,v.day,(v.hour-v.longitude/15)|0,((v.hour-v.longitude/15)%1)*60));
  return mode==='calendar'
   ?[item('日期',dateLabel(v.day),'2026'),item('月面受光比例',(moonIllumination(lunarPhase(date))*100).toFixed(0),'% · 低精度星历')]
   :[item('日照时长',daylightHours(v.latitude,v.day,v.tilt).toFixed(1),'小时 · 几何模型'),item('日期',dateLabel(v.day),'2026')];
 }
 if(mode==='seasons')return [item('日照时长',daylightHours(v.latitude,v.day,v.tilt).toFixed(1),'小时'),item('日期',dateLabel(v.day),'2026')];
 if(mode==='moon')return [item('被照亮比例',(moonIllumination(v.phase)*100).toFixed(0),'%'),item('月球轨道角',v.phase.toFixed(0),'°')];
 if(mode==='gravity')return [item('公转周期',orbitalPeriod(v.a).toFixed(2),'年'),item('近日点距离',(v.a*(1-v.e)).toFixed(2),'AU')];
 if(scene==='light'){
  if(mode==='telescope')return [item('相对集光力',((v.aperture/100)**2).toFixed(1),'× 100mm'),item('分辨角 · 550nm',(138/v.aperture).toFixed(2),'角秒')];
  if(mode==='doppler')return [item('Hα 观测波长',(656.28*Math.sqrt((1+v.velocity/299792.458)/(1-v.velocity/299792.458))).toFixed(1),'nm'),item('运动方向',v.velocity>0?'远离':v.velocity<0?'靠近':'静止')];
  return [item('辐射峰值',wienPeak(v.temperature).toFixed(0),'nm'),item('摄氏温度',(v.temperature-273.15).toFixed(0),'°C')];
 }
 if(scene==='stars')return [item('估算主序寿命',stellarLifetime(v.mass).toPrecision(3),'十亿年 · 幂律近似'),item('初始质量',v.mass.toFixed(1),'M☉')];
 if(scene==='planets'){
  if(mode==='transit')return [item('凌日深度',(transitDepth(v.radius)*100).toFixed(3),'%'),item('轨道周期',v.period.toFixed(0),'日')];
  if(mode==='atmosphere')return [item('逃逸速度',escapeVelocity(v.mass,1).toFixed(1),'km/s · 固定1R⊕'),item('热运动尺度',(Math.sqrt(3*8314*v.temperature/v.gas)/1000).toFixed(2),'km/s · rms')];
  if(mode==='tides'){
   const distance=v.distance*(1-v.e*Math.cos(v.clock*.6));
   return [item('瞬时潮汐强度',(1/distance**3).toFixed(3),'相对单位'),item('此刻距离',distance.toFixed(2),'相对单位')];
  }
  return [item('盘中位置',v.distance.toFixed(1),'AU'),item('霜线位置','2.7','AU · 示意')];
 }
 if(scene==='galaxy'){
  if(mode==='distance')return [item('恒星距离',parallaxDistance(v.parallax).toFixed(1),'pc'),item('距离模数',distanceModulus(parallaxDistance(v.parallax)).toFixed(2),'mag')];
  if(mode==='collision')return [item('碰撞进度',(v.collision*100).toFixed(0),'% · 示意'),item('质量模型',v.dark?'暗物质':'随气体','透镜质量中心')];
  if(mode==='structure')return [item('侧视进度',(v.age*100).toFixed(0),'% · 投影示意'),item('银河盘直径','100,000','光年 · 约数')];
  return [item('模型圆周速度',rotationSpeed(v.distance,!!v.dark).toFixed(0),'km/s'),item('银河中心距离',v.distance.toFixed(1),'kpc')];
 }
 if(mode==='history')return [item('辐射密度 / 今日',(v.scale**-4).toFixed(2),'ρᵣ / ρᵣ₀'),item('物质密度 / 今日',(v.scale**-3).toFixed(2),'ρₘ / ρₘ₀'),item('真空密度 / 今日','1.00','ρΛ / ρΛ₀'),item(v.scale>1?'距今未来时间':'回望时间',Math.abs(cosmicAge(1,v.H0)-cosmicAge(v.scale,v.H0)).toFixed(2),'Gyr · 平直ΛCDM')];
 if(mode==='relativity')return [item('引力源质量',v.mass.toFixed(1),'相对单位'),item('相对光偏折',(v.mass/v.distance).toFixed(2),'∝ M / b · 示意')];
 return [item('尺度因子',v.scale.toFixed(2),'a / a₀'),item('哈勃常数',v.H0.toFixed(0),'km/s/Mpc')];
}
