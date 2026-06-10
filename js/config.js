/* ─── Canvas & Viewport ────────────────────────────────────────── */
var CANVAS_WIDTH  = 900;
var CANVAS_HEIGHT = 560;  /* 480 game + 80 HUD */
var VIEWPORT_H    = 480;
var HUD_Y         = 480;
var HUD_H         = 80;

/* ─── Tile System ──────────────────────────────────────────────── */
var TILE_SIZE  = 32;
var WORLD_COLS = 48;
var WORLD_ROWS = 28;

var T_GRASS    = 0;
var T_FARMLAND = 1;  /* untilled dirt – can be hoed */
var T_TILLED   = 2;  /* hoed soil – can plant */
var T_WATERED  = 3;  /* watered tilled soil */
var T_WATER    = 4;  /* pond */
var T_PATH     = 5;  /* stone path */
var T_TREE     = 6;  /* impassable */
var T_ROCK     = 7;  /* impassable */
var T_FENCE_H  = 8;
var T_FENCE_V  = 9;
var T_FLOWER   = 10;
var T_BUILDING = 11; /* impassable building footprint */
var T_SAND     = 12;
var T_STUMP    = 13;
var T_TALL_GRASS = 14;

var PASSABLE = [T_GRASS, T_FARMLAND, T_TILLED, T_WATERED, T_PATH, T_FLOWER, T_SAND, T_TALL_GRASS];

/* ─── Seasons ──────────────────────────────────────────────────── */
var SEASON_SPRING = 0;
var SEASON_SUMMER = 1;
var SEASON_FALL   = 2;
var SEASON_WINTER = 3;
var SEASON_NAMES  = ['Primavera', 'Verão', 'Outono', 'Inverno'];
var SEASON_ICONS  = ['🌸', '☀️', '🍂', '❄️'];
var DAYS_PER_SEASON = 28;

var SEASON_GRASS_COLOR = ['#4a8c2a', '#2e7a18', '#8a7a2a', '#b8ccd8'];
var SEASON_GRASS_DARK  = ['#3a7020', '#22660e', '#7a6a18', '#a0b8c4'];
var SEASON_FARMLAND    = ['#6b5a3a', '#5a4a2a', '#7a6038', '#7888a0'];

/* ─── Crop System ──────────────────────────────────────────────── */
var CROP_SOY        = 'soja';
var CROP_STRAWBERRY = 'morango';
var CROP_PUMPKIN    = 'abobora';

var CROP_SEED    = 0;
var CROP_SPROUT  = 1;
var CROP_GROWING = 2;
var CROP_READY   = 3;

var CROP_DATA = {
  soja:    { stages: [6000, 7000, 8000], sell: 80,  ecology: -8, seedCost: 20, color: '#86efac', seasons: [0,1,2] },
  morango: { stages: [5000, 6000, 8000], sell: 50,  ecology:  5, seedCost: 30, color: '#f87171', seasons: [0,1]   },
  abobora: { stages: [7000, 8000, 9000], sell: 120, ecology:  3, seedCost: 40, color: '#fb923c', seasons: [2,3]   }
};

/* ─── Tools ────────────────────────────────────────────────────── */
var TOOL_HOE      = 0;
var TOOL_WATER    = 1;
var TOOL_SOY      = 2;
var TOOL_BERRY    = 3;
var TOOL_PUMPKIN  = 4;
var TOOL_SCYTHE   = 5;
var TOOL_NONE     = 6;

var TOOL_LABEL    = ['Enxada', 'Regador', 'Soja', 'Morango', 'Abóbora', 'Foice', '—'];
var TOOL_ENERGY   = [4, 2, 1, 1, 1, 2, 0];
var TOOL_SLOTS    = 9;

/* ─── Player ───────────────────────────────────────────────────── */
var PLAYER_W     = 20;
var PLAYER_H     = 32;
var PLAYER_SPEED = 2.6;

var DIR_DOWN  = 0;
var DIR_LEFT  = 1;
var DIR_RIGHT = 2;
var DIR_UP    = 3;

/* ─── Economy ──────────────────────────────────────────────────── */
var INITIAL_MONEY   = 500;
var INITIAL_ECOLOGY = 75;
var MAX_ENERGY      = 100;
var INITIAL_ENERGY  = 100;

var FERTILIZER_COST  = 80;
var SOIL_REPAIR_COST = 150;

/* ─── Weather ──────────────────────────────────────────────────── */
var WEATHER_SUNNY  = 'sol';
var WEATHER_CLOUDY = 'nublado';
var WEATHER_RAINY  = 'chuva';
var WEATHER_INTERVAL = 40000;

/* ─── World Layout ─────────────────────────────────────────────── */
var FARM_C0 = 10;  var FARM_C1 = 37;
var FARM_R0 = 4;   var FARM_R1 = 13;

var HOUSE_C  = 2;  var HOUSE_R  = 2;
var HOUSE_CW = 7;  var HOUSE_RH = 9;

var SHOP_C  = 40; var SHOP_R  = 2;
var SHOP_CW = 6;  var SHOP_RH = 9;

var POND_C  = 2;  var POND_R  = 17;
var POND_CW = 8;  var POND_RH = 6;

var PLAYER_START_COL = 23;
var PLAYER_START_ROW = 8;
