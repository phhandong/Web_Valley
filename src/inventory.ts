import { ITEMS } from './content';
import type { Inventory, Stack } from './types';
export const quantity=(bag:Inventory,id:string)=>bag.slots.filter(s=>s.id===id).reduce((n,s)=>n+s.count,0);
export const cloneBag=(bag:Inventory):Inventory=>({capacity:bag.capacity,slots:bag.slots.map(s=>({...s}))});
export function add(bag:Inventory,id:string,count:number):boolean {
  if(!ITEMS[id]||!Number.isSafeInteger(count)||count<=0) return false;
  const draft=cloneBag(bag); let left=count;
  for(const slot of draft.slots) if(slot.id===id){const amount=Math.min(99-slot.count,left);slot.count+=amount;left-=amount;}
  while(left>0&&draft.slots.length<draft.capacity){const amount=Math.min(99,left);draft.slots.push({id,count:amount});left-=amount;}
  if(left) return false;
  bag.slots=draft.slots;return true;
}
export function remove(bag:Inventory,id:string,count:number):boolean {
  if(!Number.isSafeInteger(count)||count<=0||quantity(bag,id)<count)return false;
  let left=count;
  for(const slot of bag.slots)if(slot.id===id){const amount=Math.min(slot.count,left);slot.count-=amount;left-=amount;}
  bag.slots=bag.slots.filter(s=>s.count>0);return true;
}
export function exchange(bag:Inventory,cost:Stack[],gain:Stack[]):boolean {
  const draft=cloneBag(bag);
  for(const item of cost)if(!remove(draft,item.id,item.count))return false;
  for(const item of gain)if(!add(draft,item.id,item.count))return false;
  bag.slots=draft.slots;return true;
}
export function transfer(from:Inventory,to:Inventory,id:string,count:number):boolean {
  if(quantity(from,id)<count)return false;
  if(!add(to,id,count))return false;
  remove(from,id,count);return true;
}
