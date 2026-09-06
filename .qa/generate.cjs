"use strict";

// src/content.ts
var SEASONS = ["spring", "summer", "autumn", "winter"];
var SEASON_NAMES = { spring: "\u6625", summer: "\u590F", autumn: "\u79CB", winter: "\u51AC" };
var WEATHER_NAMES = { sun: "\u6674", rain: "\u96E8", snow: "\u96EA" };
var ALL_SEASONS = [...SEASONS];
var CROPS = [
  { id: "radish", name: "\u841D\u535C", seasons: ALL_SEASONS, days: 2, regrow: 0, seedPrice: 10, sell: 25, color: "#edb3a0" },
  { id: "potato", name: "\u571F\u8C46", seasons: ["spring", "summer"], days: 3, regrow: 0, seedPrice: 18, sell: 55, color: "#bd934e" },
  { id: "strawberry", name: "\u8349\u8393", seasons: ["spring"], days: 4, regrow: 2, seedPrice: 65, sell: 38, color: "#df5f62" },
  { id: "tomato", name: "\u756A\u8304", seasons: ["summer", "autumn"], days: 4, regrow: 2, seedPrice: 50, sell: 32, color: "#e76c49" },
  { id: "corn", name: "\u7389\u7C73", seasons: ["summer", "autumn"], days: 5, regrow: 2, seedPrice: 60, sell: 42, color: "#efc455" },
  { id: "pumpkin", name: "\u5357\u74DC", seasons: ["autumn"], days: 5, regrow: 0, seedPrice: 65, sell: 190, color: "#db903d" },
  { id: "wheat", name: "\u5C0F\u9EA6", seasons: ["spring", "summer", "autumn"], days: 3, regrow: 0, seedPrice: 15, sell: 40, color: "#dac070" },
  { id: "cabbage", name: "\u51AC\u767D\u83DC", seasons: ["winter"], days: 3, regrow: 0, seedPrice: 20, sell: 65, color: "#b9d59b" }
];
var FISH = [
  { id: "crucian", name: "\u9CAB\u9C7C", rarity: 1, seasons: ALL_SEASONS, weather: ["sun", "rain", "snow"], hours: [6, 26], scenes: ["farm", "lake"], sell: 30, color: "#b1bdae" },
  { id: "carp", name: "\u9CA4\u9C7C", rarity: 1, seasons: ALL_SEASONS, weather: ["sun", "rain", "snow"], hours: [6, 26], scenes: ["lake"], sell: 40, color: "#d8a568" },
  { id: "perch", name: "\u6CB3\u9C88", rarity: 1, seasons: ["spring", "autumn"], weather: ["sun", "rain"], hours: [6, 18], scenes: ["lake"], sell: 45, color: "#93af74" },
  { id: "catfish", name: "\u9CB6\u9C7C", rarity: 2, seasons: ["spring", "summer", "autumn"], weather: ["rain"], hours: [6, 26], scenes: ["lake"], sell: 100, color: "#7e96ab" },
  { id: "trout", name: "\u8679\u9CDF", rarity: 2, seasons: ["spring", "summer"], weather: ["sun", "rain"], hours: [6, 18], scenes: ["lake"], sell: 85, color: "#c7a2b0" },
  { id: "eel", name: "\u9CD7\u9C7C", rarity: 2, seasons: ["spring", "autumn"], weather: ["rain"], hours: [18, 26], scenes: ["lake"], sell: 120, color: "#a3b38b" },
  { id: "sunfish", name: "\u592A\u9633\u9C7C", rarity: 1, seasons: ["spring", "summer"], weather: ["sun"], hours: [6, 18], scenes: ["farm", "lake"], sell: 50, color: "#edc262" },
  { id: "koi", name: "\u9526\u9CA4", rarity: 2, seasons: ["summer", "autumn"], weather: ["sun", "rain"], hours: [6, 26], scenes: ["farm"], sell: 110, color: "#e99877" },
  { id: "salmon", name: "\u79CB\u9C91", rarity: 2, seasons: ["autumn"], weather: ["sun", "rain"], hours: [6, 18], scenes: ["lake"], sell: 95, color: "#e0a195" },
  { id: "icefish", name: "\u94F6\u51B0\u9C7C", rarity: 2, seasons: ["winter"], weather: ["sun", "snow"], hours: [6, 26], scenes: ["lake"], sell: 90, color: "#c7e3ec" },
  { id: "moonfish", name: "\u6708\u5149\u9C7C", rarity: 3, seasons: ALL_SEASONS, weather: ["sun", "rain", "snow"], hours: [20, 26], scenes: ["lake"], sell: 230, color: "#aab7ed" },
  { id: "goldfish", name: "\u91D1\u9CDE\u9C7C", rarity: 3, seasons: ["summer"], weather: ["sun"], hours: [12, 18], scenes: ["lake"], sell: 260, color: "#efd37e" }
];
FISH.push(
  { id: "sardine", name: "\u94F6\u6C99\u4E01\u9C7C", rarity: 1, seasons: ALL_SEASONS, weather: ["sun", "rain", "snow"], hours: [6, 26], scenes: ["coast"], sell: 35, color: "#afd5d3" },
  { id: "seabass", name: "\u6D77\u9C88\u9C7C", rarity: 2, seasons: ALL_SEASONS, weather: ["sun", "rain", "snow"], hours: [16, 26], scenes: ["coast"], sell: 100, color: "#739fae" }
);
for (const fish of FISH) if (["crucian", "trout", "icefish"].includes(fish.id)) fish.scenes.push("ridge");
var FORAGE = [
  { id: "berry", name: "\u8393\u679C", color: "#b75c76", sell: 8, food: { health: 0, stamina: 15, hunger: 20 }, seasons: ALL_SEASONS },
  { id: "mushroom", name: "\u8611\u83C7", color: "#c8a27c", sell: 14, food: { health: 3, stamina: 12, hunger: 12 }, seasons: ["spring", "autumn"] },
  { id: "greens", name: "\u91CE\u83DC", color: "#87ab5e", sell: 10, food: { health: 2, stamina: 12, hunger: 15 }, seasons: ["spring", "summer"] },
  { id: "nuts", name: "\u575A\u679C", color: "#bd8b59", sell: 12, food: { health: 0, stamina: 20, hunger: 22 }, seasons: ["autumn", "winter"] },
  { id: "apple", name: "\u91CE\u82F9\u679C", color: "#de8b61", sell: 15, food: { health: 5, stamina: 18, hunger: 25 }, seasons: ["summer", "autumn"] },
  { id: "herb", name: "\u8349\u836F", color: "#80b399", sell: 16, food: { health: 20, stamina: 3, hunger: 3 }, seasons: ALL_SEASONS }
];
var RECIPES = [
  { id: "salad", name: "\u7530\u56ED\u6C99\u62C9", ingredients: [{ id: "radish", count: 1 }, { id: "berry", count: 1 }], food: { health: 12, stamina: 35, hunger: 40 }, sell: 50 },
  { id: "berry_bowl", name: "\u8393\u679C\u679C\u7897", ingredients: [{ id: "berry", count: 3 }], food: { health: 10, stamina: 50, hunger: 65 }, sell: 35 },
  { id: "grilled_fish", name: "\u9999\u70E4\u9C9C\u9C7C", ingredients: [{ id: "crucian", count: 1 }, { id: "herb", count: 1 }], food: { health: 25, stamina: 55, hunger: 55 }, sell: 70 },
  { id: "mushroom_soup", name: "\u83CC\u83C7\u6C64", ingredients: [{ id: "mushroom", count: 2 }, { id: "herb", count: 1 }], food: { health: 35, stamina: 40, hunger: 45 }, sell: 65 },
  { id: "bread", name: "\u575A\u679C\u9762\u5305", ingredients: [{ id: "wheat", count: 2 }, { id: "nuts", count: 1 }], food: { health: 10, stamina: 65, hunger: 80 }, sell: 120 },
  { id: "pumpkin_soup", name: "\u5357\u74DC\u6D53\u6C64", ingredients: [{ id: "pumpkin", count: 1 }, { id: "corn", count: 1 }], food: { health: 45, stamina: 80, hunger: 85 }, sell: 290 },
  { id: "fruit_pie", name: "\u91CE\u679C\u6D3E", ingredients: [{ id: "apple", count: 1 }, { id: "strawberry", count: 1 }, { id: "wheat", count: 1 }], food: { health: 30, stamina: 70, hunger: 70 }, sell: 130 },
  { id: "winter_stew", name: "\u51AC\u65E5\u7096\u83DC", ingredients: [{ id: "cabbage", count: 1 }, { id: "potato", count: 1 }, { id: "tomato", count: 1 }], food: { health: 60, stamina: 90, hunger: 90 }, sell: 210 }
];
var ITEMS = {};
for (const crop of CROPS) {
  ITEMS[crop.id] = { id: crop.id, name: crop.name, kind: "crop", sell: crop.sell, color: crop.color, food: { health: 3, stamina: 10, hunger: 15 }, description: "\u65B0\u9C9C\u6536\u83B7\u7684\u519C\u4EA7\u54C1\uFF0C\u53EF\u98DF\u7528\u3001\u70F9\u996A\u6216\u51FA\u552E\u3002" };
  ITEMS[`seed_${crop.id}`] = { id: `seed_${crop.id}`, name: `${crop.name}\u79CD\u5B50`, kind: "seed", buy: crop.seedPrice, sell: Math.floor(crop.seedPrice * 0.4), color: crop.color, description: `${crop.seasons.map((s) => SEASON_NAMES[s]).join("\uFF0F")}\u5B63 \xB7 ${crop.days} \u4E2A\u6D47\u6C34\u65E5\u6210\u719F${crop.regrow ? ` \xB7 \u6BCF ${crop.regrow} \u65E5\u518D\u6536\u83B7` : ""} \xB7 \u552E\u4EF7 ${crop.sell} G` };
}
for (const fish of FISH) ITEMS[fish.id] = { id: fish.id, name: fish.name, kind: "fish", sell: fish.sell, color: fish.color, description: `${["", "\u5E38\u89C1", "\u5C11\u89C1", "\u7A00\u6709"][fish.rarity]}\u9C7C \xB7 ${fish.scenes.map((s) => ({ farm: "\u519C\u573A\u6C60\u5858", lake: "\u6E56\u7554", coast: "\u6D77\u6E7E", ridge: "\u5C71\u810A\u6E56" })[s]).join("\uFF0F")} \xB7 ${fish.seasons.map((s) => SEASON_NAMES[s]).join("\uFF0F")} \xB7 ${fish.hours[0]}:00\u2013${fish.hours[1]}:00 \xB7 ${fish.weather.map((w) => WEATHER_NAMES[w]).join("\uFF0F")}` };
for (const item of FORAGE) ITEMS[item.id] = { ...item, kind: "forage", description: "\u53EF\u514D\u8D39\u91C7\u96C6\uFF0C\u98DF\u7528\u6062\u590D\u72B6\u6001\uFF1B\u4E5F\u662F\u53A8\u623F\u7684\u597D\u98DF\u6750\u3002" };
for (const meal of RECIPES) ITEMS[meal.id] = { id: meal.id, name: meal.name, kind: "meal", sell: meal.sell, color: "#e6b975", food: meal.food, description: "\u5728\u81EA\u5BB6\u53A8\u623F\u5236\u4F5C\u7684\u6E29\u6696\u6599\u7406\u3002" };
ITEMS.ration = { id: "ration", name: "\u4FBF\u643A\u53E3\u7CAE", kind: "meal", buy: 35, sell: 10, color: "#d8b077", food: { health: 5, stamina: 35, hunger: 45 }, description: "\u968F\u8EAB\u5E26\u4E0A\u4E00\u4EFD\uFF0C\u5FD9\u788C\u65F6\u4E5F\u8BB0\u5F97\u597D\u597D\u5403\u996D\u3002" };
ITEMS.wood = { id: "wood", name: "\u6728\u6750", kind: "material", sell: 5, color: "#a77b4c", description: "\u68EE\u6797\u4E2D\u83B7\u53D6\uFF0C\u7528\u4E8E\u5DE5\u5177\u5347\u7EA7\u548C\u519C\u573A\u6269\u5EFA\u3002" };
ITEMS.stone = { id: "stone", name: "\u77F3\u6599", kind: "material", sell: 6, color: "#a0aaa4", description: "\u7528\u9550\u91C7\u96C6\uFF0C\u7528\u4E8E\u5DE5\u5177\u5347\u7EA7\u548C\u519C\u573A\u6269\u5EFA\u3002" };
ITEMS.fiber = { id: "fiber", name: "\u690D\u7269\u7EA4\u7EF4", kind: "material", sell: 3, color: "#829553", description: "\u6E05\u7406\u519C\u7530\u6742\u8349\u83B7\u5F97\u7684\u7EA4\u7EF4\uFF0C\u53EF\u5B58\u5165\u50A8\u7269\u7BB1\u6216\u51FA\u552E\u3002" };

// src/balance.ts
var LEVEL_THRESHOLDS = [0, 120, 300, 540, 840, 1260, 1800, 2460, 3240, 4200];
var ECOLOGY = { forageDays: 3, materialDays: 5, eventDays: 3, smallTreeDay: 3, matureTreeDay: 6 };

// src/world.ts
var COLS = 32;
var ROWS = 20;
var initialWeeds = () => Array.from({ length: 120 }, (_, i) => i).filter((i) => (i * 7 + Math.floor(i / 12) * 3) % 10 < 8);
var tree = (id, x, y) => ({ id, kind: "tree", x, y, w: 2, h: 2, solid: true });
var SCENES = {
  farm: { id: "farm", name: "\u6EAA\u8C37\u519C\u573A", subtitle: "\u628A\u65E5\u5B50\u79CD\u8FDB\u6CE5\u571F\u91CC", objects: [
    { id: "farmhouse", kind: "house", x: 3, y: 2, w: 5, h: 4, label: "\u6A61\u679C\u5C0F\u5C4B", solid: true },
    { id: "shipping", kind: "shipping", x: 9, y: 5, w: 1, h: 1, label: "\u51FA\u8D27\u7BB1", action: "shipping", solid: true },
    { id: "farmchest", kind: "chest", x: 3, y: 7, w: 1, h: 1, label: "\u50A8\u7269\u7BB1", action: "chest", solid: true },
    { id: "pond", kind: "water", x: 3, y: 11, w: 6, h: 4 },
    { id: "farmrock1", kind: "rock", x: 8, y: 8, w: 1, h: 1, solid: true },
    { id: "farmrock2", kind: "rock", x: 25, y: 12, w: 2, h: 2, solid: true },
    tree("f1", 1, 2),
    tree("f2", 10, 2),
    tree("f3", 15, 2),
    tree("f4", 20, 2),
    tree("f5", 25, 3),
    tree("f6", 27, 14),
    tree("f7", 8, 17),
    { id: "lamp", kind: "lamp", x: 9, y: 7, w: 1, h: 1 }
  ], exits: [{ id: "home", x: 5, y: 6, label: "\u8FDB\u5165\u5C0F\u5C4B", to: "home", spawn: [16, 16] }, { id: "town", x: 30, y: 7, label: "\u5C0F\u9547 \u2192", to: "town", spawn: [2, 10] }, { id: "forest", x: 4, y: 18, label: "\u68EE\u6797 \u2193", to: "forest", spawn: [4, 2] }], nodes: [0, 1, 2, 3, 4, 5].map((i) => ({ id: `food${i}`, x: 2 + i, y: 9, kind: "forage", index: 0 })), thorns: [], fishing: [[5, 10], [6, 10]] },
  home: { id: "home", name: "\u6A61\u679C\u5C0F\u5C4B", subtitle: "\u706F\u4EAE\u7740\uFF0C\u5BB6\u5C31\u5728\u8FD9\u91CC", objects: [
    { id: "bed", kind: "bed", x: 7, y: 5, w: 3, h: 3, label: "\u4F11\u606F", action: "sleep", solid: true },
    { id: "wardrobe", kind: "wardrobe", x: 12, y: 4, w: 2, h: 3, label: "\u8863\u67DC", action: "wardrobe", solid: true },
    { id: "kitchen", kind: "kitchen", x: 21, y: 4, w: 4, h: 3, label: "\u53A8\u623F", action: "kitchen", solid: true },
    { id: "homechest", kind: "chest", x: 7, y: 12, w: 2, h: 1, label: "\u50A8\u7269\u7BB1", action: "chest", solid: true },
    { id: "table", kind: "bench", x: 17, y: 10, w: 3, h: 2, solid: true, label: "\u8D77\u5C45\u533A" },
    { id: "homelamp", kind: "lamp", x: 24, y: 12, w: 1, h: 1 }
  ], exits: [{ id: "out", x: 16, y: 17, label: "\u56DE\u5230\u519C\u573A \u2193", to: "farm", spawn: [5, 7] }], nodes: [], thorns: [], fishing: [] },
  town: { id: "town", name: "\u6EAA\u8C37\u5C0F\u9547", subtitle: "\u6765\u4E70\u70B9\u79CD\u5B50\uFF0C\u4E5F\u542C\u542C\u65B0\u7684\u6545\u4E8B", objects: [
    { id: "grocer", kind: "shop", x: 5, y: 3, w: 6, h: 4, label: "\u963F\u79BE \xB7 \u6742\u8D27", action: "grocer", solid: true },
    { id: "fisher", kind: "shop", x: 15, y: 3, w: 5, h: 4, label: "\u8001\u821F \xB7 \u6E14\u5177", action: "fisher", solid: true },
    { id: "smith", kind: "shop", x: 23, y: 3, w: 6, h: 4, label: "\u77F3\u53D4 \xB7 \u5DE5\u574A", action: "smith", solid: true },
    { id: "board", kind: "board", x: 12, y: 12, w: 2, h: 2, label: "\u6BCF\u65E5\u8BA2\u5355", action: "orders", solid: true },
    { id: "fountain", kind: "water", x: 20, y: 13, w: 4, h: 3 },
    tree("t1", 3, 14),
    tree("t2", 7, 16),
    tree("t3", 27, 15),
    { id: "lamp1", kind: "lamp", x: 9, y: 10, w: 1, h: 1 },
    { id: "lamp2", kind: "lamp", x: 24, y: 10, w: 1, h: 1 }
  ], exits: [{ id: "farm", x: 1, y: 10, label: "\u2190 \u519C\u573A", to: "farm", spawn: [29, 7] }, { id: "lake", x: 30, y: 10, label: "\u6E56\u7554 \u2192", to: "lake", spawn: [2, 10] }], nodes: [], thorns: [], fishing: [] },
  forest: { id: "forest", name: "\u677E\u5F71\u68EE\u6797", subtitle: "\u6CBF\u7740\u5C0F\u5F84\uFF0C\u5BFB\u627E\u56DB\u5B63\u7684\u9988\u8D60", objects: [
    ...[[1, 5], [7, 3], [11, 2], [16, 3], [21, 2], [27, 3], [2, 12], [8, 14], [13, 13], [18, 16], [25, 15], [28, 10]].map(([x, y], i) => tree(`tree${i}`, x, y)),
    { id: "pool", kind: "water", x: 19, y: 8, w: 5, h: 4 },
    { id: "trail1", kind: "board", x: 9, y: 5, w: 1, h: 1, label: "\u8DB3\u5370", action: "event:trail1", solid: true },
    { id: "trail2", kind: "board", x: 26, y: 12, w: 1, h: 1, label: "\u7FBD\u6BDB", action: "event:trail2", solid: true },
    { id: "trail3", kind: "board", x: 12, y: 16, w: 1, h: 1, label: "\u6811\u523B", action: "event:trail3", solid: true },
    { id: "cache", kind: "chest", x: 6, y: 3, w: 1, h: 1, label: "\u5BFB\u8FF9\u5B9D\u7BB1", action: "event:cache", solid: true },
    { id: "fox", kind: "bench", x: 10, y: 7, w: 1, h: 1, label: "\u5C0F\u72D0\u72F8 \xB7 \u8393\u679C\u4EA4\u6362", action: "event:fox", solid: true },
    { id: "spring", kind: "rock", x: 18, y: 8, w: 1, h: 1, label: "\u6E05\u6CC9\u4F11\u61A9", action: "event:spring", solid: true }
  ], exits: [{ id: "farm", x: 4, y: 1, label: "\u2191 \u519C\u573A", to: "farm", spawn: [4, 17] }, { id: "grove", x: 30, y: 6, label: "\u79D8\u6797 \u2192", to: "grove", spawn: [2, 10] }, { id: "quarry", x: 30, y: 17, label: "\u77F3\u8C37 \u2192", to: "quarry", spawn: [2, 10] }], nodes: [
    ...[[5, 6], [9, 8], [13, 5], [17, 7], [25, 7], [27, 13], [6, 16], [16, 17]].map(([x, y], i) => ({ id: `forage${i}`, x, y, kind: "forage", index: i % 6 })),
    ...[[11, 10], [7, 11], [26, 17], [15, 10]].map(([x, y], i) => ({ id: `wood${i}`, x, y, kind: "wood", index: 0 })),
    ...[[3, 16], [16, 13], [26, 10], [11, 17]].map(([x, y], i) => ({ id: `stone${i}`, x, y, kind: "stone", index: 0 }))
  ], thorns: [[17, 10], [17, 11], [18, 11], [25, 13]], fishing: [] },
  lake: { id: "lake", name: "\u5FAE\u5149\u6E56\u7554", subtitle: "\u628A\u5FC3\u4E8B\u4EA4\u7ED9\u6E56\u9762\uFF0C\u628A\u8010\u5FC3\u4EA4\u7ED9\u9C7C", objects: [
    { id: "lakewater", kind: "water", x: 13, y: 3, w: 17, h: 15 },
    tree("l1", 3, 3),
    tree("l2", 7, 2),
    tree("l3", 4, 15),
    tree("l4", 9, 16),
    { id: "seat", kind: "bench", x: 6, y: 12, w: 2, h: 1, solid: true },
    { id: "llamp", kind: "lamp", x: 10, y: 10, w: 1, h: 1 }
  ], exits: [{ id: "town", x: 1, y: 10, label: "\u2190 \u5C0F\u9547", to: "town", spawn: [29, 10] }, { id: "coast", x: 6, y: 18, label: "\u6D77\u6E7E \u2193", to: "coast", spawn: [6, 2] }], nodes: [], thorns: [], fishing: [[12, 6], [12, 8], [12, 10], [12, 12], [12, 14]] },
  grove: { id: "grove", name: "\u8424\u706B\u79D8\u6797", subtitle: "\u66AE\u8272\u4E2D\u7684\u5149\u70B9\uFF0C\u85CF\u7740\u6797\u95F4\u7684\u79D8\u5BC6", objects: [
    ...[[4, 3], [9, 2], [15, 3], [22, 2], [27, 5], [4, 15], [11, 16], [19, 15], [26, 15]].map(([x, y], i) => tree(`g${i}`, x, y)),
    { id: "grovepool", kind: "water", x: 18, y: 7, w: 7, h: 5 },
    { id: "gift", kind: "chest", x: 13, y: 6, w: 1, h: 1, label: "\u6797\u95F4\u8865\u7ED9 \xB7 \u4E09\u65E5", action: "event:groveGift", solid: true }
  ], exits: [{ id: "forest", x: 1, y: 10, label: "\u2190 \u68EE\u6797", to: "forest", spawn: [29, 6] }], nodes: [
    ...[[6, 6], [9, 7], [12, 10], [15, 13], [8, 13], [26, 12], [28, 8], [16, 6]].map(([x, y], i) => ({ id: `fruit${i}`, x, y, kind: "forage", index: i % 2 ? 4 : 0 })),
    ...[[8, 10], [14, 15], [27, 11]].map(([x, y], i) => ({ id: `wood${i}`, x, y, kind: "wood", index: 0 }))
  ], thorns: [], fishing: [] },
  quarry: { id: "quarry", name: "\u56DE\u58F0\u77F3\u8C37", subtitle: "\u77F3\u58C1\u8BB0\u5F97\u96E8\u58F0\uFF0C\u4E5F\u8BB0\u5F97\u6BCF\u4E00\u6B21\u56DE\u54CD", objects: [
    ...[[5, 3], [11, 4], [18, 2], [25, 4], [7, 15], [17, 15], [26, 15]].map(([x, y], i) => ({ id: `rock${i}`, kind: "rock", x, y, w: 3, h: 2, solid: true })),
    { id: "relic", kind: "board", x: 21, y: 9, w: 2, h: 2, label: "\u53E4\u7891\u77FF\u85CF \xB7 \u4E09\u65E5", action: "event:quarryGift", solid: true }
  ], exits: [{ id: "forest", x: 1, y: 10, label: "\u2190 \u68EE\u6797", to: "forest", spawn: [29, 17] }, { id: "ridge", x: 30, y: 10, label: "\u5C71\u810A \u2192", to: "ridge", spawn: [2, 10] }], nodes: [
    ...[[5, 7], [9, 9], [12, 7], [15, 11], [18, 7], [25, 8], [27, 12], [12, 14]].map(([x, y], i) => ({ id: `ore${i}`, x, y, kind: "stone", index: 0 }))
  ], thorns: [[16, 8], [16, 9], [24, 13]], fishing: [] },
  coast: { id: "coast", name: "\u6F6E\u58F0\u6D77\u6E7E", subtitle: "\u6CBF\u7740\u6C99\u6EE9\uFF0C\u7B49\u4E00\u5C3E\u8FDC\u6D77\u7684\u6765\u5BA2", objects: [
    { id: "sea", kind: "water", x: 13, y: 3, w: 18, h: 15 },
    tree("c1", 3, 4),
    tree("c2", 8, 3),
    { id: "coastseat", kind: "bench", x: 4, y: 13, w: 3, h: 1, solid: true },
    { id: "tidal", kind: "chest", x: 9, y: 7, w: 1, h: 1, label: "\u6F6E\u6C50\u6F02\u6D41\u7BB1", action: "event:coastGift", solid: true },
    { id: "lighthouse", kind: "lamp", x: 10, y: 15, w: 1, h: 1 }
  ], exits: [{ id: "lake", x: 6, y: 1, label: "\u2191 \u6E56\u7554", to: "lake", spawn: [6, 17] }], nodes: [
    { id: "driftwood", x: 5, y: 9, kind: "wood", index: 0 },
    { id: "pebbles", x: 9, y: 12, kind: "stone", index: 0 },
    { id: "herbs", x: 3, y: 16, kind: "forage", index: 5 }
  ], thorns: [], fishing: [[12, 6], [12, 9], [12, 12], [12, 15]] },
  ridge: { id: "ridge", name: "\u4E91\u6749\u5C71\u810A", subtitle: "\u8D8A\u8FC7\u77F3\u8C37\uFF0C\u5728\u4E91\u5F71\u4E0E\u677E\u98CE\u95F4\u6B47\u811A", objects: [
    ...[[5, 3], [11, 2], [18, 3], [25, 4], [6, 15], [22, 15]].map(([x, y], i) => tree(`pine${i}`, x, y)),
    { id: "alpine", kind: "water", x: 18, y: 9, w: 8, h: 4 },
    { id: "outlook", kind: "board", x: 11, y: 7, w: 2, h: 2, label: "\u4E91\u7AEF\u89C2\u666F\u53F0", action: "event:ridgeView", solid: true },
    { id: "ore", kind: "rock", x: 27, y: 15, w: 2, h: 2, solid: true }
  ], exits: [{ id: "quarry", x: 1, y: 10, label: "\u2190 \u77F3\u8C37", to: "quarry", spawn: [29, 10] }], nodes: [
    { id: "nuts", x: 8, y: 6, kind: "forage", index: 3 },
    { id: "herb", x: 14, y: 13, kind: "forage", index: 5 },
    { id: "stone1", x: 7, y: 12, kind: "stone", index: 0 },
    { id: "stone2", x: 28, y: 9, kind: "stone", index: 0 }
  ], thorns: [[16, 15], [17, 15]], fishing: [[20, 8], [23, 8]] }
};
var harvestable = (o) => !o.action && (o.kind === "tree" || o.kind === "rock");
var objectKey = (scene, o) => `${scene}:${o.id}`;
function passable(scene, x, y, cleared = [], trees = {}) {
  if (x < 1 || y < 1 || x >= COLS - 1 || y >= ROWS - 1) return false;
  if (scene === "home" && (x < 5 || x > 26 || y < 3 || y > 17)) return false;
  return !SCENES[scene].objects.some((o) => !(harvestable(o) && cleared.includes(objectKey(scene, o))) && !(o.kind === "tree" && (trees[objectKey(scene, o)] ?? 6) < ECOLOGY.matureTreeDay) && (o.solid || o.kind === "water") && x >= o.x && y >= o.y && x < o.x + o.w && y < o.y + o.h);
}

// src/progression.ts
var LEVEL_XP = LEVEL_THRESHOLDS;
var AREAS = [
  { id: "grove", name: "\u8424\u706B\u79D8\u6797", level: 3, price: 180, description: "\u6210\u7247\u91CE\u679C\u3001\u66AE\u8272\u8424\u706B\u4E0E\u6797\u95F4\u8865\u7ED9\u3002" },
  { id: "quarry", name: "\u56DE\u58F0\u77F3\u8C37", level: 5, price: 400, description: "\u5BC6\u96C6\u77FF\u77F3\u3001\u53E4\u8001\u77F3\u7891\u4E0E\u77FF\u85CF\u3002" },
  { id: "coast", name: "\u6F6E\u58F0\u6D77\u6E7E", level: 4, price: 350, description: "\u4ECE\u6E56\u7554\u5357\u7AEF\u51FA\u53D1\uFF0C\u5BFB\u627E\u6D77\u9C7C\u3001\u6F02\u6D41\u6728\u4E0E\u6F6E\u6C50\u5B9D\u7BB1\u3002" },
  { id: "ridge", name: "\u4E91\u6749\u5C71\u810A", level: 6, price: 650, description: "\u4ECE\u77F3\u8C37\u4E1C\u4FA7\u51FA\u53D1\uFF0C\u53D1\u73B0\u9AD8\u5C71\u6E56\u3001\u8349\u836F\u4E0E\u89C2\u666F\u53F0\u3002" }
];

// src/ecology.ts
var newEcology = () => ({ version: 1, trees: { "farm:f3": 3, "farm:f6": 0, "forest:tree2": 1, "forest:tree8": 4 }, nodeReady: {}, eventReady: {} });

// src/engine.ts
var seasonOf = (day) => SEASONS[(2 + Math.floor((day - 1) / 14)) % 4];
function random(state) {
  state.rng = Math.imul(state.rng, 1664525) + 1013904223 >>> 0;
  return state.rng / 4294967296;
}
function initialState(seed = Date.now() >>> 0) {
  const state = {
    version: 2,
    ecology: newEcology(),
    weeds: initialWeeds(),
    clearedObjects: [],
    rng: seed,
    calendar: { day: 1, minute: 360, weather: "sun" },
    player: { scene: "farm", x: 10, y: 9, direction: "right", appearance: { skin: 0, hair: 0, outfit: 0, hat: 0 }, vitals: { health: 100, stamina: 100, hunger: 100 } },
    gold: 50,
    inventory: { capacity: 24, slots: [{ id: "seed_radish", count: 5 }, { id: "ration", count: 3 }] },
    chest: { capacity: 120, slots: [] },
    shipping: [],
    legacyPending: 0,
    plots: Array.from({ length: 120 }, () => ({ tilled: false, crop: null })),
    selectedTool: "hoe",
    selectedSeed: "radish",
    upgrades: { farm: 0, tools: 0, rod: 0, bag: 0 },
    stats: { planted: 0, harvested: 0, shipped: 0, cooked: 0, caught: 0, orders: 0, revenue: 0, reputation: 0, boughtAfterShipping: false },
    discoveries: {},
    gathered: [],
    orders: [],
    unlocked: { outfits: [0, 1, 2], hats: [0] },
    settings: { fishingAssist: false, sound: true, music: true, volume: 35, hud: false, hudWidth: 260 },
    progression: { xp: 0, areas: [], forestEvents: [], fishingRotation: 0 },
    pendingCatch: null,
    lastSettlement: 0
  };
  state.orders = generateOrders(state);
  return state;
}
function generateOrders(state, rng = () => random(state)) {
  const season = seasonOf(state.calendar.day);
  const eligible = ["radish", "berry", "herb", ...Object.keys(state.discoveries).filter((id) => ["crop", "fish", "forage", "meal"].includes(ITEMS[id]?.kind) && (!CROPS.find((c) => c.id === id) || CROPS.find((c) => c.id === id).seasons.includes(season)))];
  const pool = [...new Set(eligible)];
  return Array.from({ length: 3 }, (_, i) => {
    const item = pool.splice(Math.floor(rng() * pool.length), 1)[0] ?? "berry";
    const count = 1 + Math.floor(rng() * 3);
    return { id: `${state.calendar.day}-${i}`, item, count, reward: Math.ceil(ITEMS[item].sell * count * 1.5) + 15, done: false };
  });
}

// src/persistence.ts
var SAVE_KEY = "creekside-farm-save-v2";
var BACKUP_KEY = `${SAVE_KEY}-backup`;
var obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var num = (v, min = 0, max = 1e12) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
var int = (v, min = 0, max = 1e12) => num(v, min, max) && Number.isSafeInteger(v);
var stack = (v, max = 99) => obj(v) && typeof v.id === "string" && Object.hasOwn(ITEMS, v.id) && int(v.count, 1, max);
var uniqueNumbers = (v, max) => Array.isArray(v) && v.length > 0 && v.every((n) => int(n, 0, max)) && new Set(v).size === v.length;
function validSave(raw) {
  if (!obj(raw) || raw.version !== 2) return false;
  const s = raw;
  if (!int(s.rng, 0, 4294967295) || !obj(s.calendar) || !int(s.calendar.day, 1) || !num(s.calendar.minute, 360, 1559.999999) || !["sun", "rain", "snow"].includes(s.calendar.weather)) return false;
  const resourceKeys = new Set(Object.values(SCENES).flatMap((scene) => scene.objects.filter(harvestable).map((o) => objectKey(scene.id, o))));
  if (!Array.isArray(s.clearedObjects) || !s.clearedObjects.every((k) => typeof k === "string" && resourceKeys.has(k)) || new Set(s.clearedObjects).size !== s.clearedObjects.length) return false;
  const treeKeys = new Set(Object.values(SCENES).flatMap((scene) => scene.objects.filter((o) => o.kind === "tree").map((o) => objectKey(scene.id, o))));
  const allNodes = new Set(Object.values(SCENES).flatMap((scene) => scene.nodes.map((n) => `${scene.id}:${n.id}`)));
  const events = new Set(Object.values(SCENES).flatMap((scene) => scene.objects.filter((o) => o.action?.startsWith("event:")).map((o) => o.action.slice(6))));
  if (!obj(s.ecology) || s.ecology.version !== 1 || !obj(s.ecology.trees) || !obj(s.ecology.nodeReady) || !obj(s.ecology.eventReady)) return false;
  if (!Object.entries(s.ecology.trees).every(([key, age]) => treeKeys.has(key) && int(age, 0, 6))) return false;
  if (!Object.entries(s.ecology.nodeReady).every(([key, day]) => allNodes.has(key) && int(day, 1, s.calendar.day + 5))) return false;
  if (!Object.entries(s.ecology.eventReady).every(([key, day]) => events.has(key) && int(day, 1, s.calendar.day + 3))) return false;
  if (s.clearedObjects.some((key) => treeKeys.has(key) && s.ecology.trees[key] === 6)) return false;
  if (!obj(s.player) || !Object.hasOwn(SCENES, s.player.scene) || !int(s.player.x, 1, 30) || !int(s.player.y, 1, 18) || !["up", "down", "left", "right"].includes(s.player.direction) || !passable(s.player.scene, s.player.x, s.player.y, s.clearedObjects, s.ecology.trees)) return false;
  const a = s.player.appearance, v = s.player.vitals;
  if (!obj(a) || !int(a.skin, 0, 5) || !int(a.hair, 0, 5) || !int(a.outfit, 0, 7) || !int(a.hat, -1, 5) || !obj(v) || !["health", "stamina", "hunger"].every((k) => num(v[k], 0, 100))) return false;
  if (!obj(s.upgrades) || !["farm", "tools", "rod", "bag"].every((k) => int(s.upgrades[k], 0, 2))) return false;
  for (const key of ["inventory", "chest"]) {
    const bag = s[key];
    if (!obj(bag) || !int(bag.capacity, 1, 120) || !Array.isArray(bag.slots) || bag.slots.length > bag.capacity || !bag.slots.every((v2) => stack(v2))) return false;
  }
  if (s.inventory.capacity !== 24 + 12 * s.upgrades.bag || s.chest.capacity !== 120) return false;
  if (!Array.isArray(s.plots) || s.plots.length !== 120 || !s.plots.every((p) => {
    if (!obj(p) || typeof p.tilled !== "boolean") return false;
    if (p.crop === null) return true;
    const def = obj(p.crop) ? CROPS.find((c) => c.id === p.crop.id) : void 0;
    return !!def && p.tilled && int(p.crop.growth, 0, def.days) && typeof p.crop.watered === "boolean";
  })) return false;
  if (!["hoe", "seed", "water", "hand", "rod", "axe", "pick"].includes(s.selectedTool) || !CROPS.some((c) => c.id === s.selectedSeed) || !int(s.gold) || !int(s.legacyPending) || !int(s.lastSettlement, 0, s.calendar.day - 1)) return false;
  if (!Array.isArray(s.weeds) || s.weeds.some((i) => !int(i, 0, 119) || s.plots[i].tilled || s.plots[i].crop) || new Set(s.weeds).size !== s.weeds.length) return false;
  if (!Array.isArray(s.shipping) || s.shipping.length > Object.keys(ITEMS).length || !s.shipping.every((v2) => stack(v2, 1e9))) return false;
  if (!obj(s.stats) || !["planted", "harvested", "shipped", "cooked", "caught", "orders", "revenue", "reputation"].every((k) => int(s.stats[k])) || typeof s.stats.boughtAfterShipping !== "boolean") return false;
  if (!obj(s.discoveries) || !Object.entries(s.discoveries).every(([id, d]) => Object.hasOwn(ITEMS, id) && obj(d) && int(d.count) && int(d.firstDay, 1, s.calendar.day))) return false;
  const nodeKeys = new Set(Object.values(SCENES).flatMap((scene) => scene.nodes.map((n) => `${scene.id}:${n.id}`)));
  if (!Array.isArray(s.gathered) || !s.gathered.every((k) => typeof k === "string" && nodeKeys.has(k)) || new Set(s.gathered).size !== s.gathered.length) return false;
  if (!Array.isArray(s.orders) || s.orders.length !== 3 || !s.orders.every((o) => obj(o) && typeof o.id === "string" && Object.hasOwn(ITEMS, o.item) && int(o.count, 1, 3) && int(o.reward, 1) && typeof o.done === "boolean") || new Set(s.orders.map((o) => o.id)).size !== 3) return false;
  if (!obj(s.unlocked) || !uniqueNumbers(s.unlocked.outfits, 7) || !uniqueNumbers(s.unlocked.hats, 5) || !s.unlocked.outfits.includes(a.outfit) || a.hat !== -1 && !s.unlocked.hats.includes(a.hat)) return false;
  if (!obj(s.settings) || typeof s.settings.fishingAssist !== "boolean" || typeof s.settings.sound !== "boolean") return false;
  if (typeof s.settings.music !== "boolean" || !int(s.settings.volume, 0, 100) || typeof s.settings.hud !== "boolean" || !int(s.settings.hudWidth, 220, 360)) return false;
  if (!obj(s.progression) || !int(s.progression.xp) || !int(s.progression.fishingRotation) || !Array.isArray(s.progression.areas) || !s.progression.areas.every((a2) => AREAS.some((area2) => area2.id === a2)) || new Set(s.progression.areas).size !== s.progression.areas.length) return false;
  if (!Array.isArray(s.progression.forestEvents) || !s.progression.forestEvents.every((e) => typeof e === "string" && events.has(e)) || new Set(s.progression.forestEvents).size !== s.progression.forestEvents.length) return false;
  const area = AREAS.find((a2) => a2.id === s.player.scene);
  if (area && !s.progression.areas.includes(area.id) && s.progression.xp < LEVEL_XP[area.level - 1]) return false;
  if (s.pendingCatch !== null && !(typeof s.pendingCatch === "string" && ITEMS[s.pendingCatch]?.kind === "fish")) return false;
  return true;
}

// .qa/generate.ts
var import_node_fs = require("node:fs");
var fixtures = [["fishing", "farm", 5, 10], ["shop", "town", 8, 7], ["home", "home", 16, 14], ["wardrobe", "home", 12, 7], ["sleep", "home", 10, 7], ["coast", "coast", 12, 9], ["ridge", "ridge", 20, 8], ["hud", "farm", 23, 5]];
for (const [name, scene, x, y] of fixtures) {
  const s = initialState(7);
  Object.assign(s.player, { scene, x, y });
  s.calendar.minute = 600;
  s.gold = 500;
  s.progression.xp = 1260;
  s.selectedTool = "rod";
  s.settings.fishingAssist = true;
  s.inventory.slots.push({ id: "radish", count: 5 });
  if (!validSave(s)) throw new Error(name);
  (0, import_node_fs.writeFileSync)(`.qa/${name}.json`, JSON.stringify(s));
}
