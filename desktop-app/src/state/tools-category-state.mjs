export const TOOLS_CATEGORY_ID = '__neolib_tools__';
export const TOOLS_CATEGORY = Object.freeze({id:TOOLS_CATEGORY_ID,name:'Tools',colorId:'amber',system:'tools',logoLabel:'TOOLS'});
const unique = (base, occupied) => {let id=base;while(occupied.has(id))id+=':';occupied.add(id);return id;};
export const isLibraryTool = item => typeof item?.libraryToolId === 'string';
export const canonicalTool = item => { if(!isLibraryTool(item))return item;const {libraryToolId,...tool}=item;return {...tool,id:libraryToolId}; };

// A reversible presentation view: canonical games/tools stay in their original
// stores so utilities never become games or lose their launch/installation data.
export function toolsLibraryView(library) {
  const games=library.games||[],tools=library.tools||[],categories=library.categories||[];
  const itemIds=new Set(games.map(item=>item.id)),catIds=new Set(categories.map(item=>item.id));
  const rootId=unique(TOOLS_CATEGORY_ID,catIds);
  const toolIds=new Map(tools.map(item=>[item.id,unique('__tool__:'+encodeURIComponent(item.id),itemIds)]));
  const toolCats=(library.toolCategories||[]).map(category=>({...category,id:unique('__toolcat__:'+encodeURIComponent(category.id),catIds),libraryToolCategoryId:category.id}));
  const categoryIds=new Map(toolCats.map(category=>[category.libraryToolCategoryId,category.id]));
  const toolRows=tools.map(tool=>({...tool,id:toolIds.get(tool.id),libraryToolId:tool.id,categoryIds:[...new Set([rootId,...(tool.categoryIds||[]).map(id=>categoryIds.get(id)).filter(Boolean),...(tool.libraryCategoryIds||[]).filter(id=>categories.some(category=>category.id===id))])]}));
  const allCategories=[...categories,{...TOOLS_CATEGORY,id:rootId},...toolCats];
  const order=library.unifiedCategoryOrder||[];
  allCategories.sort((a,b)=>{const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return (ai<0?1e9:ai)-(bi<0?1e9:bi);});
  const legacyOrder=Object.fromEntries(Object.entries(library.toolOrderByCategory||{}).filter(([id])=>categoryIds.has(id)).map(([id,ids])=>[categoryIds.get(id),ids.map(itemId=>toolIds.get(itemId)).filter(Boolean)]));
  return {...library,games:[...games,...toolRows],categories:allCategories,gameOrderByCategory:{...legacyOrder,...library.gameOrderByCategory},toolsCategoryId:rootId};
}

export function applyToolsLibraryView(library, change) {
  const initial=toolsLibraryView(library),next=typeof change==='function'?change(initial):change;
  if(next===initial)return library;
  const categories=next.categories||[],toolCats=categories.filter(category=>typeof category.libraryToolCategoryId==='string');
  const catIds=new Map(toolCats.map(category=>[category.id,category.libraryToolCategoryId]));
  const tools=(next.games||[]).filter(isLibraryTool).map(item=>{
    const {libraryToolId,...tool}=item;
    const previous=(library.tools||[]).find(entry=>entry.id===libraryToolId);
    const legacy=(item.categoryIds||[]).filter(id=>catIds.has(id)).map(id=>catIds.get(id));
    const orphan=(previous?.categoryIds||[]).filter(id=>!(library.toolCategories||[]).some(category=>category.id===id));
    return {...tool,id:libraryToolId,categoryIds:[...new Set([...legacy,...orphan])],libraryCategoryIds:(item.categoryIds||[]).filter(id=>id!==initial.toolsCategoryId&&!catIds.has(id))};
  });
  const toolIds=new Map((next.games||[]).filter(isLibraryTool).map(item=>[item.id,item.libraryToolId]));
  const order=next.gameOrderByCategory||{};
  return {...library,
    games:(next.games||[]).filter(item=>!isLibraryTool(item)).map(item=>(item.categoryIds||[]).some(id=>id===initial.toolsCategoryId||catIds.has(id))?{...item,categoryIds:item.categoryIds.filter(id=>id!==initial.toolsCategoryId&&!catIds.has(id))}:item),
    tools,
    categories:categories.filter(category=>category.id!==initial.toolsCategoryId&&!catIds.has(category.id)),
    toolCategories:toolCats.map(category=>{const {libraryToolCategoryId,...original}=category;return {...original,id:libraryToolCategoryId};}),
    gameOrderByCategory:Object.fromEntries(Object.entries(order).filter(([id])=>!catIds.has(id))),
    toolOrderByCategory:Object.fromEntries(Object.entries(order).filter(([id])=>catIds.has(id)).map(([id,ids])=>[catIds.get(id),ids.map(itemId=>toolIds.get(itemId)||itemId)])),
    unifiedCategoryOrder:categories.map(category=>category.id),
  };
}
