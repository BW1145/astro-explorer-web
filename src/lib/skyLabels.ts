export type SkyLabel={id:string;text:string;x:number;y:number;priority:number;radius?:number};
export type PlacedSkyLabel=SkyLabel&{labelX:number;labelY:number;width:number;height:number};
type Rect={x:number;y:number;width:number;height:number};
const lineEnd=(point:{x:number;y:number},rect:Rect)=>({x:Math.max(rect.x,Math.min(rect.x+rect.width,point.x)),y:Math.max(rect.y,Math.min(rect.y+rect.height,point.y))});
function crossesLabel(a:{x:number;y:number},b:{x:number;y:number},rect:Rect){
 let lo=0,hi=1;
 for(const [start,delta,min,max] of [[a.x,b.x-a.x,rect.x-4,rect.x+rect.width+4],[a.y,b.y-a.y,rect.y-4,rect.y+rect.height+4]]){
  if(delta===0){if(start<min||start>max)return false;}
  else{const u=(min-start)/delta,v=(max-start)/delta;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return false;}
 }
 return true;
}

/** Declutter labels only: celestial point coordinates never change. */
export function placeSkyLabels(labels:SkyLabel[],points:{x:number;y:number;radius?:number}[],font:number):PlacedSkyLabel[]{
 const placed:PlacedSkyLabel[]=[],left=125,right=925,top=125,bottom=503,gap=8;
 const overlaps=(a:{x:number;y:number;width:number;height:number},b:{x:number;y:number;width:number;height:number})=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
 for(const label of [...labels].sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id))){
  const width=[...label.text].reduce((sum,char)=>sum+font*(/[\u2e80-\uffff]/.test(char)?1:/[ilIjtfr]/.test(char)?.4:/[mwMW]/.test(char)?.94:/[ .·]/.test(char)?.34:.67),0)+6;
  const height=font*1.5;
  const candidates:{x:number;y:number}[]=[];
  for(const offset of [10,10+height,10+height*2,10+height*3]){
   candidates.push({x:label.x+10,y:label.y-offset-height},{x:label.x-width-10,y:label.y-offset-height},{x:label.x+10,y:label.y+offset},{x:label.x-width-10,y:label.y+offset});
  }
  // A crowded asterism can use a nearby free callout instead of dropping every name.
  const positions=function*(){
   yield* candidates;
   const free:{x:number;y:number}[]=[];
   for(let y=top;y<=bottom-height;y+=height+gap)for(let x=left;x<=right-width;x+=Math.max(45,font*1.5))free.push({x,y});
   free.sort((a,b)=>Math.hypot(a.x+width/2-label.x,a.y+height/2-label.y)-Math.hypot(b.x+width/2-label.x,b.y+height/2-label.y));
   yield* free;
  };
  for(const candidate of positions()){
   const rect={x:Math.max(left,Math.min(right-width,candidate.x)),y:Math.max(top,Math.min(bottom-height,candidate.y)),width,height};
   if(placed.some(p=>{const other={x:p.labelX,y:p.labelY,width:p.width,height:p.height};return overlaps(rect,other)||crossesLabel(label,lineEnd(label,rect),other)||crossesLabel(p,lineEnd(p,other),rect);} ))continue;
   if(points.some(p=>{const dx=p.x-Math.max(rect.x,Math.min(rect.x+width,p.x)),dy=p.y-Math.max(rect.y,Math.min(rect.y+height,p.y));return dx*dx+dy*dy<((p.radius??4)+4)**2;}))continue;
   placed.push({...label,labelX:rect.x,labelY:rect.y,width,height});break;
  }
 }
 return placed;
}
