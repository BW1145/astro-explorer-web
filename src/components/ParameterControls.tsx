import type { Control } from '../scenes';
import { dateLabel } from '../lib/readouts';

export default function ParameterControls({controls,values,onChange}:{controls:Control[];values:Record<string,number>;onChange:(key:string,value:number)=>void}) {
 return <div className="control-list">{controls.filter(control=>!control.when||values[control.when.key]===control.when.value).map(control=><label className="control" key={control.key} htmlFor={control.key}>
  <span>{control.label}<output htmlFor={control.key}>{control.choices?.find(c=>c.value===values[control.key])?.label??(control.key==='day'?dateLabel(values.day):values[control.key].toFixed(control.step<1?(control.step===.01?2:1):0))}<small>{control.key==='day'?'':control.unit}</small></output></span>
  {control.choices?<select id={control.key} value={values[control.key]} onChange={e=>onChange(control.key,+e.target.value)}>{control.choices.map(choice=><option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>:<><input id={control.key} type="range" min={control.min} max={control.max} step={control.step} value={values[control.key]} onChange={e=>onChange(control.key,+e.target.value)}/><span className="range-ends"><span>{control.min}{control.unit}</span><span>{control.max}{control.unit}</span></span></>}
 </label>)}</div>;
}
