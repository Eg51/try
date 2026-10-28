// lib/gamification.ts
import { COMMODITIES } from "./trading-data";

// ==========================================
// 1. EXISTING TASKS & TIERS
// ==========================================
export type Task = {
  id: string;
  title: string;
  description: string;
  xp: number;
  coins: number;
  type: 'daily' | 'onboarding' | 'trading';
};

export const TASKS: Task[] = [
  { id: "profile", title: "Complete your profile", description: "Add a display name and set your currency.", xp: 100, coins: 50, type: "onboarding" },
  { id: "first_trade", title: "Execute your first trade", description: "Buy or sell any asset in the terminal.", xp: 250, coins: 100, type: "onboarding" },
  { id: "wallet_check", title: "Check your wallet", description: "Visit the wallet page to view your balances.", xp: 50, coins: 20, type: "onboarding" },
  { id: "first_deposit", title: "Fund your account", description: "Receive your first deposit via the ledger.", xp: 150, coins: 75, type: "trading" },
  { id: "web_authn", title: "Enable Biometrics", description: "Set up FaceID/TouchID for secure login.", xp: 300, coins: 150, type: "onboarding" },
];

export const TIER_THRESHOLDS = {
  1: 0,      
  2: 500,    
  3: 1500,   
};

// ==========================================
// 2. THE 1000-BADGE GENERATOR
// ==========================================
export type Badge = {
  id: string;
  cat: string;
  tier: string;
  icon: string;
  title: string;
  desc: string;
  reward: { xp: number; coins: number };
  check: (s: any) => boolean;
  progress: (s: any) => number;
  goal: number;
  format?: (x: number) => string;
};

export const BADGE_CATEGORIES = [
  {id:'all',name:'All',icon:'✦'},
  {id:'trading',name:'Trading',icon:'📈'},
  {id:'volume',name:'Volume',icon:'💰'},
  {id:'xp',name:'XP',icon:'⚡'},
  {id:'commodity',name:'Commodity',icon:'🌾'},
  {id:'risk',name:'Risk',icon:'🛡️'},
  {id:'profit',name:'Profit',icon:'💎'},
  {id:'streak',name:'Streak',icon:'🔥'},
  {id:'time',name:'Time',icon:'⏰'},
  {id:'explorer',name:'Explorer',icon:'🧭'},
  {id:'mastery',name:'Mastery',icon:'👑'},
];

export function generateBadges(): Badge[] {
  const out: Badge[] = [];
  const tiers = ['bronze','silver','gold','platinum','diamond'];
  const tier = (i: number) => tiers[Math.min(4, Math.floor(i / 20))];

  // 1. TRADING — 100 badges
  for(let i=1;i<=100;i++){
    out.push({
      id:`trade-${i}`, cat:'trading', tier:tier(i-1), 
      icon:i<5?'🌱':i<20?'📈':i<50?'🔥':i<80?'💪':'🏆',
      title:`${i} trade${i>1?'s':''}`, desc:`Place ${i} order${i>1?'s':''}`,
      reward:{xp:10+i*3, coins:20+i*8},
      check:(s: any)=>s.orders>=i, progress:(s: any)=>Math.min(s.orders||0, i), goal:i
    });
  }

  // 2. VOLUME — 100 badges
  for(let i=1;i<=100;i++){
    const v = i * 100;
    out.push({
      id:`vol-${v}`, cat:'volume', tier:tier(i-1),
      icon:i<10?'💰':i<40?'💵':i<70?'💸':'👑',
      title:`₦${v.toLocaleString()}`, desc:`Reach ₦${v.toLocaleString()} total volume`,
      reward:{xp:15+i*5, coins:30+i*10},
      check:(s: any)=>s.volume>=v, progress:(s: any)=>Math.min(s.volume||0, v), goal:v,
      format:(x: number)=>'₦'+Math.round(x).toLocaleString()
    });
  }

  // 3. XP — 100 badges
  for(let i=1;i<=100;i++){
    const v = i * 100;
    out.push({
      id:`xp-${v}`, cat:'xp', tier:tier(i-1), icon:'⚡',
      title:`${v} XP`, desc:`Earn ${v} total XP`,
      reward:{xp:0, coins:30+i*15},
      check:(s: any)=>s.xp>=v, progress:(s: any)=>Math.min(s.xp||0, v), goal:v
    });
  }

  // 4. COMMODITY — 100 badges
  const commList = ['CHR','BLF','SCN','ENO','PLM','GRI','COC','YAM','KOL','GND'];
  const commTiers = [1,5,10,25,50,75,100,150,200,250];
  commList.forEach((code, ci) => {
    commTiers.forEach((n, ti) => {
      const idx = ci * 10 + ti;
      out.push({
        id:`comm-${code}-${n}`, cat:'commodity', tier:tier(idx), icon:'🌾',
        title:`${n}× ${COMMODITIES[code]?.name || code}`, desc:`Trade ${n} time${n>1?'s':''} in ${COMMODITIES[code]?.name || code}`,
        reward:{xp:10+ti*5+ci*2, coins:25+ti*12+ci*5},
        check:(s: any)=>(s.commodityCounts?.[code]||0)>=n,
        progress:(s: any)=>Math.min(s.commodityCounts?.[code]||0, n), goal:n
      });
    });
  });

  // 5. RISK — 100 badges
  for(let i=1;i<=50;i++){
    out.push({
      id:`sl-${i}`, cat:'risk', tier:tier((i-1)*2), icon:'🛡️',
      title:`${i} stop loss${i>1?'es':''}`, desc:`Set ${i} stop loss${i>1?'es':''}`,
      reward:{xp:15+i*4, coins:35+i*10},
      check:(s: any)=>s.stopLossSet>=i, progress:(s: any)=>Math.min(s.stopLossSet||0, i), goal:i
    });
    out.push({
      id:`tp-${i}`, cat:'risk', tier:tier((i-1)*2), icon:'🎯',
      title:`${i} take profit${i>1?'s':''}`, desc:`Set ${i} take profit${i>1?'s':''}`,
      reward:{xp:15+i*4, coins:35+i*10},
      check:(s: any)=>s.takeProfitSet>=i, progress:(s: any)=>Math.min(s.takeProfitSet||0, i), goal:i
    });
  }

  // 6. PROFIT — 100 badges
  for(let i=1;i<=100;i++){
    out.push({
      id:`profit-${i}`, cat:'profit', tier:tier(i-1), icon:i<10?'💵':i<40?'💎':i<70?'👑':'🏆',
      title:`${i} winner${i>1?'s':''}`, desc:`Close ${i} profitable position${i>1?'s':''}`,
      reward:{xp:20+i*5, coins:40+i*12},
      check:(s: any)=>s.profitableCloses>=i, progress:(s: any)=>Math.min(s.profitableCloses||0, i), goal:i
    });
  }

  // 7. STREAK — 100 badges
  for(let i=1;i<=100;i++){
    out.push({
      id:`streak-${i}`, cat:'streak', tier:tier(i-1), icon:i<5?'🔥':i<20?'⚡':i<50?'💫':'🌟',
      title:`${i}-day streak`, desc:`Trade ${i} consecutive day${i>1?'s':''}`,
      reward:{xp:30+i*8, coins:50+i*15},
      check:(s: any)=>(s.currentStreak||0)>=i, progress:(s: any)=>Math.min(s.currentStreak||0, i), goal:i
    });
  }

  // 8. TIME — exactly 100 badges
  const timeCfg: [string, string, string, (s: any)=>boolean, string][] = [
    ['early-5','Before 05:00','Trade before 5am',(s: any)=>s.tradedBefore6,'🌌'],
    ['early-6','Before 06:00','Trade before 6am',(s: any)=>s.tradedBefore6,'🌅'],
    ['early-7','Before 07:00','Trade before 7am',(s: any)=>s.tradedBefore7,'🌅'],
    ['early-8','Before 08:00','Trade before 8am',(s: any)=>s.tradedBefore8,'☀️'],
    ['early-9','Before 09:00','Trade before 9am',(s: any)=>s.tradedBefore9,'☀️'],
    ['early-10','Before 10:00','Trade before 10am',(s: any)=>s.tradedBefore9,'☀️'],
    ['late-15','After 15:00','Trade after 3pm',(s: any)=>s.tradedAfter16,'🌇'],
    ['late-16','After 16:00','Trade after 4pm',(s: any)=>s.tradedAfter16,'🌆'],
    ['late-17','After 17:00','Trade after 5pm',(s: any)=>s.tradedAfter17,'🌆'],
    ['late-18','After 18:00','Trade after 6pm',(s: any)=>s.tradedAfter18,'🌙'],
    ['late-19','After 19:00','Trade after 7pm',(s: any)=>s.tradedAfter18,'🌙'],
    ['late-20','After 20:00','Trade after 8pm',(s: any)=>s.tradedAfter20,'🌙'],
    ['late-21','After 21:00','Trade after 9pm',(s: any)=>s.tradedAfter20,'🌌'],
    ['late-22','After 22:00','Trade after 10pm',(s: any)=>s.tradedAfter22,'🌌'],
    ['late-23','After 23:00','Trade after 11pm',(s: any)=>s.tradedAfter22,'🌌'],
  ];
  timeCfg.forEach(([id,title,desc,check,icon], i) => {
    out.push({
      id, cat:'time', tier:tier(i*10), icon, title, desc,
      reward:{xp:50+i*20, coins:100+i*30}, 
      check, progress:(s: any)=>check(s)?1:0, goal:1
    });
  });

  const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  weekdays.forEach((day, i) => {
    out.push({
      id:`day-${day}`, cat:'time', tier:tier(50+i*5), icon:'📅', title:`${day} trade`, desc:`Trade on a ${day}`,
      reward:{xp:80, coins:150},
      check:(s: any)=>(s.daysTraded||[]).includes(i+1),
      progress:(s: any)=>((s.daysTraded||[]).includes(i+1)?1:0), goal:1
    });
  });

  const hourCounts = [1,2,3,5,8,12,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140,145,150,155,160,165,170,175,180,185,190,195,200,205,210,215,220,225,230,235,240,245,250,255,260,265,270,275,280,285,290,295,300,305,310,315,320,325,330,335,340,345,350,355,360,365,370];
  hourCounts.forEach((h, i) => {
    out.push({
      id:`hours-${h}`, cat:'time', tier:tier(60+i%40), icon:'⏰', title:`${h} trading hours`, desc:`Log ${h} total trading hours`,
      reward:{xp:100+i*10, coins:200+i*20},
      check:(s: any)=>(s.hoursTraded||0)>=h, progress:(s: any)=>Math.min(s.hoursTraded||0, h), goal:h
    });
  });

  // 9. EXPLORER — 100 badges
  const modes = ['histogram','bar','donut','graph'];
  modes.forEach(mode => {
    for(let i=1;i<=25;i++){
      out.push({
        id:`exp-${mode}-${i}`, cat:'explorer', tier:tier((i-1)*4),
        icon:mode==='histogram'?'▥':mode==='bar'?'▤':mode==='donut'?'◎':'⬡',
        title:`${mode} × ${i}`, desc:`View ${mode} ${i} time${i>1?'s':''}`,
        reward:{xp:5+i*3, coins:10+i*6},
        check:(s: any)=>(s.modeViews?.[mode]||0)>=i, progress:(s: any)=>Math.min(s.modeViews?.[mode]||0, i), goal:i
      });
    }
  });

  // 10. MASTERY — 100 badges
  for(let i=1;i<=100;i++){
    out.push({
      id:`mastery-${i}`, cat:'mastery', tier:tier(i-1),
      icon:i<20?'🥉':i<40?'🥈':i<60?'🥇':i<80?'💎':'👑',
      title:`Mastery ${i}`, desc:`Complete ${i*10} combined actions`,
      reward:{xp:50+i*10, coins:100+i*20},
      check:(s: any)=>((s.orders||0)+(s.paletteUses||0)+Object.values(s.modeViews||{}).reduce((a: any, b: any)=>a+b,0))>=i*10,
      progress:(s: any)=>Math.min(((s.orders||0)+(s.paletteUses||0)+Object.values(s.modeViews||{}).reduce((a: any, b: any)=>a+b,0)), i*10),
      goal:i*10
    });
  }

  return out;
}

export const ALL_BADGES = generateBadges();