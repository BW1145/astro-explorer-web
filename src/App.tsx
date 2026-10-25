import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Compass, Expand, List, Pause, Play, RotateCcw, Search, Sparkles, Star, X } from 'lucide-react';
import Universe from './components/Universe';
import ConceptLab from './components/ConceptLab';
import CourseDiagram from './components/CourseDiagram';
import ParameterControls from './components/ParameterControls';
import { concepts } from './data/curriculum';
import type { Concept, SceneId } from './data/curriculum';
import { defaults, scenes, primaryConceptByMode } from './scenes';
import { getReadouts, dateLabel } from './lib/readouts';

const readSaved = ():string[] => { try { return JSON.parse(localStorage.getItem('astro-understood') || '[]'); } catch { return []; } };
const cityOptions = [{name:'奥克兰 Auckland',latitude:-36.85,longitude:174.76},{name:'北京 Beijing',latitude:39.9,longitude:116.4},{name:'伦敦 London',latitude:51.5,longitude:-.12},{name:'赤道 Equator',latitude:0,longitude:0}];
const directSceneConcepts=new Set([...Object.values(primaryConceptByMode),'open-clusters','neutron-stars','gravitational-waves','accelerated-expansion','moon-visibility','eclipse-types','eclipse-alignment','gravity-orbit','mass-lifetime','light-gathering','cosmological-redshift','expansion-centre']);
function trapDialogFocus(event:ReactKeyboardEvent<HTMLDialogElement>) {
 if(event.key!=='Tab')return;
 const elements=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,a[href],[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
 const first=elements[0],last=elements[elements.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
}
function App() {
 const [sceneId,setSceneId] = useState<SceneId>('orbits');
 const scene = scenes.find(s=>s.id===sceneId)!;
 const [modeId,setModeId] = useState('moon');
 const mode = scene.modes.find(m=>m.id===modeId) || scene.modes[0];
 const [values,setValues] = useState<Record<string,number>>({...defaults,clock:0});
 const [playing,setPlaying] = useState(false);
 const [selectedId,setSelectedId] = useState('');
 const [query,setQuery] = useState('');
 const [filter,setFilter] = useState<string>('all');
 const [saved,setSaved] = useState<string[]>(readSaved);
 const [showWhy,setShowWhy] = useState(false);
 const [guided,setGuided] = useState(false);
 const [guideStep,setGuideStep] = useState(0);
 const [goalActive,setGoalActive] = useState(false);
 const [jumpToConcept,setJumpToConcept] = useState(false);
 const [immersive,setImmersive] = useState(false);
 const catalogue = useRef<HTMLDialogElement>(null);
 const sourceDialog = useRef<HTMLDialogElement>(null);
 const stageRef = useRef<HTMLDivElement>(null);
 const sceneConcepts = concepts.filter(c=>c.scene===sceneId);
 const concept = sceneConcepts.find(c=>c.id===selectedId) || sceneConcepts.find(c=>c.id===primaryConceptByMode[mode.id]) || sceneConcepts.find(c=>c.mode===mode.id) || sceneConcepts[0];
 const index = Math.max(0,sceneConcepts.findIndex(c=>c.id===concept?.id));
 const update = (key:string,value:number) => {setPlaying(false);setValues(v=>({...v,[key]:value}));setGoalActive(false);if(key==='remnantKind')setSelectedId(value===1?'gravitational-waves':'pulsars');};
 const chooseConcept = (c:Concept) => {setSelectedId(c.id);if(c.mode)setModeId(c.mode);if(c.mode==='remnants')setValues(v=>({...v,remnantKind:c.id==='gravitational-waves'?1:0}));setPlaying(false);};
 const navigate = (id:SceneId) => {setSceneId(id);setModeId(scenes.find(s=>s.id===id)!.modes[0].id);setPlaying(false);setSelectedId('');setShowWhy(false);setGoalActive(false);setValues({...defaults,temperature:id==='planets'?300:5800,clock:0});};
 const selectConcept = (c:Concept) => { if(c.scene!==sceneId) navigate(c.scene); chooseConcept(c);setShowWhy(true);catalogue.current?.close();setJumpToConcept(true); };
 useLayoutEffect(()=>{document.querySelector('.experiment-panel')?.scrollTo({top:0,behavior:'instant'});},[sceneId,mode.id]);
 useEffect(()=>{localStorage.setItem('astro-understood',JSON.stringify(saved));},[saved]);
 useEffect(()=>{
  if(!jumpToConcept||!showWhy)return;
  const frame=requestAnimationFrame(()=>{
   const lab=document.querySelector<HTMLElement>('#concept-lab .cl-lab');
   const mainExperiment=!lab&&directSceneConcepts.has(concept.id);
   const target=lab??(mainExperiment?document.querySelector<HTMLElement>('.observatory'):document.getElementById('concept-title'));
   if(target){
    target.scrollIntoView({block:'start',behavior:'instant'});
    const focus=lab?.querySelector<HTMLElement>('select,input,button')??(mainExperiment?document.querySelector<HTMLElement>('.experiment-panel input,.experiment-panel select'):null)??target;
    focus.focus({preventScroll:true});
    const rect=focus.getBoundingClientRect();
    if(rect.bottom>innerHeight-24||rect.top<0)focus.scrollIntoView({block:'center',behavior:'instant'});
   }
   setJumpToConcept(false);
  });
  return()=>cancelAnimationFrame(frame);
 },[jumpToConcept,showWhy,concept?.id]);
 useEffect(()=>{
  if(!playing) return;
  let frame=0,last=0;
  const animate=(time:number)=>{if(!last)last=time;const dt=Math.min((time-last)/1000,.1);if(dt>=1/60-.001){last=time;setValues(v=>{const n:Record<string,number>={...v,clock:v.clock+dt};if(sceneId==='sky')n.hour=(v.hour+dt*.25)%24;else if(mode.id==='moon')n.phase=(v.phase+dt*12)%360;else if(mode.id==='seasons')n.day=(v.day+dt*12-1)%365+1;else if(mode.id==='cluster')n.clusterAge=.01+((v.clusterAge-.01)+dt*.4)%9.99;else if(mode.id==='remnants'){if(v.remnantKind===0)n.spinPhase=(v.spinPhase+dt*90)%360;else n.inspiral=(v.inspiral+dt*.06)%1;}else if(mode.id==='transmission')n.wavelength=400+((v.wavelength-400)+dt*40)%600;else if(sceneId==='stars')n.age=(v.age+dt*.035)%1;else if(mode.id==='collision')n.collision=(v.collision+dt*.06)%1;else if(mode.id==='spectrum')n.temperature=2500+(v.clock*350)%17500;else if(mode.id==='doppler')n.velocity=Math.sin(v.clock*.3)*10000;else if(mode.id==='telescope')n.aperture=25+(v.clock*25)%975;else if(mode.id==='evidence')n.snRedshift=.02+((v.snRedshift-.02)+dt*.08)%1.48;else if(sceneId==='cosmos'&&mode.id!=='relativity')n.scale=.3+(v.clock*.04)%1.7;return n;});}frame=requestAnimationFrame(animate);};
  frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
 },[playing,sceneId,mode.id]);
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(e.code==='Space'&&!e.defaultPrevented&&!(e.target as HTMLElement).closest('input,button,select,textarea,summary,a,[role="button"],[role="slider"],[contenteditable="true"]')&&!catalogue.current?.open&&!sourceDialog.current?.open){e.preventDefault();setPlaying(p=>!p);}if(e.key==='Escape')setImmersive(false);};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
 const metrics = () => getReadouts(sceneId,mode.id,values);
 const filtered=concepts.filter(c=>(filter==='all'||c.scene===filter||filter==='saved'&&saved.includes(c.id))&&`${c.title} ${c.english} ${c.summary} ${c.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
 return <div className={`app ${immersive?'immersive':''}`}>
  <header className="masthead"><a href="#" className="brand" onClick={e=>{e.preventDefault();navigate('orbits');}} aria-label="观星之间首页"><span className="brand-mark">✳</span><span>观星之间<small>ASTRO EXPLORER</small></span></a><div className="header-actions"><button onClick={()=>catalogue.current?.showModal()}><Search size={16}/><span>知识星图</span></button><button className="icon-button" aria-label="关于观星之间" onClick={()=>sourceDialog.current?.showModal()}><BookOpen size={18}/></button></div></header>
  <main>
   <div className="workspace-toolbar"><h1>{scene.name}</h1><button className={`quiet-button ${guided?'selected':''}`} onClick={()=>{setGuided(!guided);setGuideStep(0);setShowWhy(false);}}><Compass size={16}/>{guided?'自由探索':'3 分钟回顾'}</button></div>
   {guided&&<div className="guided-strip">
    <div className="guide-steps">{['观察','解释','复述'].map((s,i)=><span key={s} className={i===guideStep?'active':''}>0{i+1} {s}</span>)}</div>
    <p>{guideStep===0?`先试试「${mode.goal}」，预测画面会怎样变化。`:guideStep===1?`现在用自己的话解释：${concept?.title}。可以展开「为什么」核对。`:`${concept?.experiment} 不看解释，把因果关系再说一遍。`}</p>
    <button onClick={()=>{
     if(guideStep===2){setGuideStep(0);chooseConcept(sceneConcepts[(index+1)%sceneConcepts.length]);setShowWhy(false);}
     else{setGuideStep(guideStep+1);if(guideStep===0){setValues(v=>({...v,...mode.preset}));setGoalActive(true);}if(guideStep===1)setShowWhy(true);}
    }}>{guideStep===2?'下一个概念':'下一步'}<ArrowRight size={14}/></button>
   </div>}
   <nav className="scene-nav" aria-label="七个复习入口">{scenes.map((s,i)=><button key={s.id} onClick={()=>navigate(s.id)} aria-current={sceneId===s.id?'page':undefined}><span className="nav-number">0{i+1}</span><span className="scene-icon">{s.icon}</span><span>{s.name}</span><i/></button>)}</nav>
   <section className="observatory" aria-label={`${scene.name}互动实验台`}>
    <div className="stage" ref={stageRef}>
     <div className="stage-heading"><span><span className="tiny-cross">+</span> {mode.label}</span><span className="stage-tag">{sceneId==='sky'?'坐标计算 · 低精度':'教学模型 · 尺度夸张'}<button className="icon-button" aria-label={immersive?'退出专注视图':'专注视图'} onClick={()=>setImmersive(!immersive)}><Expand size={14}/></button></span></div>
     <div className="universe-wrap" key={`${sceneId}-${mode.id}`}><Universe scene={sceneId} mode={mode.id} values={values} onChange={update}/></div>
     <div className="stage-foot"><span>空格：播放 / 暂停</span></div>
    </div>
    <aside className="experiment-panel"><div className="panel-fixed"><div className="panel-title"><span>实验台</span></div>     <div className="transport"><button className="play-button" onClick={()=>setPlaying(!playing)} aria-label={playing?'暂停模拟':'播放模拟'}>{playing?<Pause size={16} fill="currentColor"/>:<Play size={16} fill="currentColor"/>}{playing?'暂停':'播放'}</button><button className="reset-button" onClick={()=>{setValues({...defaults,temperature:sceneId==='planets'?300:5800,clock:0});setPlaying(false);setGoalActive(false);}}><RotateCcw size={15}/>重置</button></div><div className="mode-tabs" role="group" aria-label="选择实验">{scene.modes.map(m=><button key={m.id} aria-pressed={mode.id===m.id} onClick={()=>{setModeId(m.id);setPlaying(false);setGoalActive(false);setSelectedId(primaryConceptByMode[m.id]||sceneConcepts.find(c=>c.mode===m.id)?.id||sceneConcepts[0].id);if(m.id==='remnants')setValues(v=>({...v,remnantKind:0}));if(m.id==='atmosphere')setValues(v=>({...v,temperature:300,mass:1}));}}>{m.label}</button>)}</div>
     </div>
     {sceneId==='sky'&&<label className="city-select">观测地点<select aria-label="观测地点" value={cityOptions.find(c=>Math.abs(c.latitude-values.latitude)<.01 && Math.abs(c.longitude-values.longitude)<.01)?.name||'自定义纬度'} onChange={e=>{const city=cityOptions.find(c=>c.name===e.target.value);if(city){setPlaying(false);setGoalActive(false);setValues(v=>({...v,latitude:city.latitude,longitude:city.longitude}));}}}><option value="自定义纬度">自定义纬度</option>{cityOptions.map(c=><option key={c.name}>{c.name}</option>)}</select></label>}
     <ParameterControls controls={mode.controls} values={values} onChange={update}/>
     {sceneId==='light'&&mode.id==='spectrum'&&<div className="spectrum-options"><label className="city-select">光谱类型<select aria-label="光谱类型" value={values.spectrumType} onChange={e=>update('spectrumType',+e.target.value)}><option value={0}>吸收光谱 · 连续谱背景</option><option value={1}>发射光谱 · 稀薄气体</option></select></label><label className="city-select">元素指纹<select aria-label="元素指纹" value={values.element} onChange={e=>update('element',+e.target.value)}><option value={0}>氢 Hydrogen</option><option value={1}>氦 Helium</option></select></label></div>}
     <div className="readouts" aria-live={playing?'off':'polite'}>{metrics().map(m=><div key={m.label}><span>{m.label}</span><strong>{m.value}<small>{m.unit}</small></strong></div>)}</div>

     <button className={`goal ${goalActive?'goal-active':''}`} onClick={()=>{setPlaying(false);setValues(v=>({...v,...mode.preset}));setGoalActive(true);}}><span className="goal-icon">{goalActive?<Check size={17}/>:<Sparkles size={17}/>}</span><span><small>{goalActive?'已调出 · 观察变化':'不妨试试'}</small>{mode.goal}</span><ArrowRight size={15}/></button>
     {mode.id==='moon'&&<div className="quick-presets" role="group" aria-label="月相与食预设"><button onClick={()=>{setPlaying(false);setValues(v=>({...v,phase:180,node:0,inclination:5.14}));}}>调出月食对齐</button><button onClick={()=>{setPlaying(false);setValues(v=>({...v,phase:0,node:90,inclination:5.14}));}}>调出普通新月</button></div>}
     <p className="lab-hint">{mode.hint}</p>
    </aside>
   </section>

   {concept&&<section className="knowledge"><div className="knowledge-top"><div><span className="subtle-count">{index+1} / {sceneConcepts.length}</span><h2 id="concept-title" tabIndex={-1}>{concept.title}<span>{concept.english}</span></h2></div><div className="knowledge-actions"><button className="icon-button" aria-label="上一个知识点" onClick={()=>{chooseConcept(sceneConcepts[(index-1+sceneConcepts.length)%sceneConcepts.length]);}}><ArrowLeft size={17}/></button><button className="icon-button" aria-label="下一个知识点" onClick={()=>{chooseConcept(sceneConcepts[(index+1)%sceneConcepts.length]);}}><ArrowRight size={17}/></button></div></div><p className="concept-summary">{concept.summary}</p><div className="concept-toolbar"><button onClick={()=>setShowWhy(!showWhy)} aria-expanded={showWhy}><span>{showWhy?'收起解释':'为什么？'}</span><ChevronDown size={15} className={showWhy?'rotated':''}/></button><button onClick={()=>{setSaved(s=>s.includes(concept.id)?s.filter(id=>id!==concept.id):[...s,concept.id]);}}><Star size={15} fill={saved.includes(concept.id)?'currentColor':'none'}/>{saved.includes(concept.id)?'已理解':'记为已理解'}</button><button onClick={()=>{setFilter(sceneId);catalogue.current?.showModal();}}><List size={15}/>全部 {sceneConcepts.length} 个知识点</button></div>
    {showWhy&&<><div className="explanation"><div><p>{concept.explanation}</p>{concept.formula&&<div className="formula">{concept.formula}</div>}<div className="explain-note"><span>想一想</span><p>{concept.experiment}</p></div></div><div className="misconception"><span>容易混淆的地方</span><p>{concept.misconception}</p>{concept.externalReferences&&<ul className="source-links">{concept.externalReferences.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></li>)}</ul>}</div></div><div id="concept-lab" tabIndex={-1}><ConceptLab key={concept.id} concept={concept}/><CourseDiagram concept={concept}/></div></>}
    <div className="concept-trail" aria-label="当前场景知识点">{sceneConcepts.map(c=><button key={c.id} className={c.id===concept.id?'active':''} onClick={()=>{chooseConcept(c);}}>{saved.includes(c.id)&&<Check size={12}/>} {c.title}</button>)}</div>
   </section>}
  </main>
  <footer><span className="brand-footer">✳ 观星之间</span><button onClick={()=>sourceDialog.current?.showModal()}>{concepts.length} 个知识点 · 7 个互动场景<ArrowDown size={12}/></button></footer>
  <dialog ref={catalogue} className="catalogue-dialog" onKeyDown={trapDialogFocus} aria-labelledby="catalogue-title"><div className="dialog-head"><div><h2 id="catalogue-title">知识星图</h2></div><button className="icon-button" aria-label="关闭知识星图" onClick={()=>catalogue.current?.close()}><X/></button></div><label className="search-field"><Search size={18}/><input placeholder="搜索月相、暗物质、Cepheid…" aria-label="搜索知识点" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="catalogue-filters"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>全部 {concepts.length}</button>{scenes.map(s=><button key={s.id} className={filter===s.id?'active':''} onClick={()=>setFilter(s.id)}>{s.name}</button>)}<button className={filter==='saved'?'active':''} onClick={()=>setFilter('saved')}>已理解 {saved.length}</button></div><div className="catalogue-results">{filtered.length===0?<div className="empty-state">还没有匹配的知识点。试试另一个关键词，或先标记一个已理解的概念。</div>:filtered.map(c=><button key={c.id} onClick={()=>selectConcept(c)}><span className="result-icon">{scenes.find(s=>s.id===c.scene)?.icon}</span><span><strong>{c.title}<small>{c.english}</small></strong><p>{c.summary}</p></span>{saved.includes(c.id)?<Check size={17}/>:<ArrowRight size={17}/>}</button>)}</div><div className="dialog-footer">{filtered.length} 个知识点 · 点选后直接进入对应场景</div></dialog>
  <dialog ref={sourceDialog} className="source-dialog" onKeyDown={trapDialogFocus} aria-labelledby="source-title"><div className="dialog-head"><div><h2 id="source-title">关于观星之间</h2></div><button className="icon-button" aria-label="关闭介绍" onClick={()=>sourceDialog.current?.close()}><X/></button></div><p>通过七个可操作的宇宙场景，探索天空、轨道、光、恒星、行星、银河与宇宙。调节参数、观察变化，再结合中英双语讲解理解背后的天文学原理。</p><div className="coverage-stats"><strong>{concepts.length}<span>知识点</span></strong><strong>7<span>互动场景</span></strong></div><p className="source-disclaimer">示意实验用于概念理解；恒星演化、银河与宇宙学图像采用简化模型。理解标记保存在当前浏览器。</p></dialog>
 </div>;
}
export default App;
