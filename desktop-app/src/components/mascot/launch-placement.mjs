export function launchButtonOrigin(rect) {
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2,bounds:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom}};
}

// Reserve space for the cheer, maximum bounce and sparkles as well as the body.
// Positions are translations of the fixed right:18 / bottom:116 mascot dock.
export function launchMascotOffset(origin, viewport, scale=1) {
  if(!Number.isFinite(origin?.x)||!Number.isFinite(origin?.y))return {x:-190,y:-210};
  const width=Math.max(220,160*scale)+64,height=172*scale+128,gap=16,pad=12;
  const rect=origin.bounds||{left:origin.x-40,right:origin.x+40,top:origin.y-20,bottom:origin.y+20};
  const clamp=(value,min,max)=>Math.max(min,Math.min(Math.max(min,max),value));
  const candidates=[
    {left:rect.right+gap,top:origin.y-height/2},
    {left:rect.left-gap-width,top:origin.y-height/2},
    {left:origin.x-width/2,top:rect.top-gap-height},
    {left:origin.x-width/2,top:rect.bottom+gap},
  ].map(box=>({...box,left:clamp(box.left,pad,viewport.width-width-pad),top:clamp(box.top,pad,viewport.height-height-pad)}));
  const overlap=box=>Math.max(0,Math.min(box.left+width,rect.right+gap)-Math.max(box.left,rect.left-gap))*Math.max(0,Math.min(box.top+height,rect.bottom+gap)-Math.max(box.top,rect.top-gap));
  const placement=candidates.reduce((best,box)=>overlap(box)<overlap(best)?box:best);
  return {x:Math.round(placement.left+width-32-(viewport.width-18)),y:Math.round(placement.top+height-32-(viewport.height-116))};
}
