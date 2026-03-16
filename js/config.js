// config.js — Koi Pond constants
export const FISH_COUNT = 7;

export const KOI_VARIETIES = [
  // Kohaku family (white + red)
  { name: '红白', nameEn: 'Kohaku', body: '#F5F0E8', spots: '#CC2222', belly: '#FFFFFF', desc: '白底红花纹' },
  // Taisho Sanshoku (white + red + black)
  { name: '大正三色', nameEn: 'Taisho Sanshoku', body: '#F5F0E8', spots: '#CC2222', belly: '#FFFFFF', accent: '#1A1A1A', desc: '白底红黑三色' },
  // Showa Sanshoku (black + red + white)
  { name: '昭和三色', nameEn: 'Showa', body: '#1A1A1A', spots: '#CC2222', belly: '#2A2A2A', accent: '#F5F0E8', desc: '黑底红白三色' },
  // Bekko (white/red/yellow + black spots)
  { name: '白别甲', nameEn: 'Shiro Bekko', body: '#F5F0E8', spots: '#1A1A1A', belly: '#FFFFFF', desc: '白底黑斑' },
  { name: '赤别甲', nameEn: 'Aka Bekko', body: '#CC2222', spots: '#1A1A1A', belly: '#E8A090', desc: '红底黑斑' },
  // Utsuri (black + one color)
  { name: '白写', nameEn: 'Shiro Utsuri', body: '#1A1A1A', spots: '#F5F0E8', belly: '#2A2A2A', desc: '黑白双色' },
  { name: '绯写', nameEn: 'Hi Utsuri', body: '#1A1A1A', spots: '#CC2222', belly: '#2A2A2A', desc: '黑红双色' },
  { name: '黄写', nameEn: 'Ki Utsuri', body: '#1A1A1A', spots: '#D4920B', belly: '#2A2A2A', desc: '黑黄双色' },
  // Asagi (blue-grey + red belly)
  { name: '浅黄', nameEn: 'Asagi', body: '#6B8BA4', spots: '#8AA0B5', belly: '#CC5533', desc: '蓝灰背红腹' },
  // Ogon (metallic single color)
  { name: '黄金', nameEn: 'Yamabuki Ogon', body: '#D4A017', spots: '#E8C040', belly: '#F0D870', desc: '全身金色' },
  { name: '白金', nameEn: 'Gin Matsuba', body: '#D0D0D0', spots: '#B8B8B8', belly: '#E8E8E8', desc: '银白色' },
  // Goshiki (5 colors)
  { name: '五色', nameEn: 'Goshiki', body: '#4A6070', spots: '#CC2222', belly: '#8090A0', desc: '五色杂陈' },
  // Tancho (white + single red dot on head)
  { name: '丹顶', nameEn: 'Tancho', body: '#F5F0E8', spots: '#CC2222', belly: '#FFFFFF', tancho: true, desc: '白底头顶红圆' },
  // Benigoi (solid red)
  { name: '红鲤', nameEn: 'Benigoi', body: '#CC2222', spots: '#DD3333', belly: '#E8A090', desc: '全身红色' },
  // Karashigoi (solid yellow-cream)
  { name: '芥子鲤', nameEn: 'Karashigoi', body: '#E8C860', spots: '#D4B850', belly: '#F0E0A0', desc: '全身淡黄' },
  // Kumonryu (black + white, pattern changes)
  { name: '九纹龙', nameEn: 'Kumonryu', body: '#1A1A1A', spots: '#F5F0E8', belly: '#3A3A3A', desc: '黑白变化龙纹' },
  // Chagoi (brown/olive)
  { name: '茶鲤', nameEn: 'Chagoi', body: '#8B7355', spots: '#9A8265', belly: '#A89575', desc: '全身茶色' },
  // Karasugoi (solid black)
  { name: '乌鲤', nameEn: 'Karasugoi', body: '#1A1A1A', spots: '#2A2A2A', belly: '#333333', desc: '全身墨黑' },
];
export const FEAR_RADIUS = 150;
export const FEAR_FORCE = 3.5;
export const FEAR_DECAY = 0.98;
export const WANDER_SPEED = 0.8;
export const MAX_SPEED = 4;
export const TURN_RATE = 0.02;
export const TAIL_SPEED = 0.08;
export const RIPPLE_MAX_RADIUS = 120;
export const RIPPLE_DURATION = 60; // frames
// Keep for backward compat (initial fish)
export const FISH_COLORS = [
  { body: '#E8611A', spots: '#FFFFFF', belly: '#F5D6B8' }, // orange/white
  { body: '#C41E1E', spots: '#FFFFFF', belly: '#F0C8C8' }, // red/white
  { body: '#D4920B', spots: '#F5E6A3', belly: '#FFF5D6' }, // gold
  { body: '#1A1A1A', spots: '#E8611A', belly: '#4A3A2A' }, // black/orange
  { body: '#E85A1A', spots: '#D4920B', belly: '#FFFFFF' }, // orange/gold
  { body: '#C41E1E', spots: '#D4920B', belly: '#F5D6B8' }, // red/gold
  { body: '#F5F5F5', spots: '#C41E1E', belly: '#FFFFFF' }, // white/red
];
