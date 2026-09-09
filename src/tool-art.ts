// Shared pixel shapes for the toolbar and the tool held by the character.
type Pixel=[number,number,number,number,string];
export const TOOL_PIXELS:Record<'axe'|'pick',Pixel[]>={
  axe:[[5,25,5,5,'#553f2c'],[8,20,5,7,'#9d6b3f'],[11,15,5,7,'#af804b'],[14,10,5,7,'#c89759'],[17,6,4,8,'#bd8b50'],[15,5,8,6,'#58696b'],[21,4,7,3,'#d9e5db'],[20,7,10,9,'#94abaa'],[23,16,5,3,'#b9cfcb'],[28,7,3,9,'#ecf4df'],[18,7,3,5,'#405859'],[8,25,2,3,'#e5bc78']],
  pick:[[7,26,4,5,'#64472e'],[9,21,4,7,'#af804c'],[12,16,4,7,'#af804c'],[15,10,4,8,'#c39b60'],[3,12,4,4,'#5d7479'],[6,8,6,4,'#829eaa'],[11,5,11,5,'#b5ccce'],[21,8,6,4,'#829eaa'],[26,12,4,5,'#5d7479'],[12,5,9,2,'#edf0d9'],[16,9,4,4,'#52686f']]
};
export const toolSVG=(tool:'axe'|'pick')=>TOOL_PIXELS[tool].map(([x,y,w,h,color])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`).join('');
export function drawTool(c:CanvasRenderingContext2D,tool:'axe'|'pick'){for(const[x,y,w,h,color]of TOOL_PIXELS[tool]){c.fillStyle=color;c.fillRect(x,y,w,h);}}
