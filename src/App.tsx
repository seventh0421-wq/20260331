/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Heart, Sword, Shield, Timer, Trophy, Skull, RefreshCw, ChevronRight, User, Sparkles, Wand2, Leaf, Cat, Star, MessageCircle, LayoutDashboard, Users, Activity, Zap, Lock, Book, X, Globe, ShieldCheck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { rtdb } from './firebase';
import { ref, onValue, set, update, onDisconnect, remove } from 'firebase/database';

// --- Types & Data ---

const INITIAL_BOSS_HP = 3000;
const INITIAL_TEAM_HP = 3;

const DUNGEONS = [
  {
    id: 'force',
    name: '巨石遺跡',
    bossName: '重甲石巨像',
    description: '古老的石像守護著力的祕密。',
    icon: <Sword className="w-12 h-12" />,
    bg: 'https://i.meee.com.tw/rvEQDJc.jpg',
    color: 'from-orange-400 to-red-500',
    accent: 'border-orange-200 text-orange-600'
  },
  {
    id: 'water',
    name: '幽暗水脈',
    bossName: '深淵水精靈王・波波',
    description: '深不見底的水道隱藏著流動的智慧。',
    icon: <Activity className="w-12 h-12" />,
    bg: 'https://i.meee.com.tw/LxUAeLF.jpg',
    color: 'from-blue-400 to-cyan-500',
    accent: 'border-blue-200 text-blue-600'
  }
];

const QUESTIONS_MAP: Record<string, any[]> = {
  force: [
    { 
      id: "f1", 
      type: "choice",
      topic: "力的作用", 
      question: "巨石像對著小隊丟出了各種物品！請問哪一種物品受力變形後，最容易「恢復原狀」？", 
      options: ["折斷的粉筆", "拉長的橡皮筋", "揉捏的黏土", "打破的玻璃杯"], 
      answerIndex: 1, 
      explanation: "橡皮筋具有彈性，受力變形後可以恢復原狀喔！" 
    },
    { 
      id: "f2", 
      type: "boolean",
      topic: "力的三要素", 
      question: "讓靜止的球滾動需要用到力，讓滾動中的球停止也需要用到力。", 
      options: ["正確 (O)", "錯誤 (X)"], 
      answerIndex: 0, 
      explanation: "力可以改變物體的運動狀態，包括啟動和停止！" 
    },
    { 
      id: "f3", 
      type: "boolean",
      topic: "動力傳送", 
      question: "空氣可以傳送動力，但是水無法傳送動力。", 
      options: ["正確 (O)", "錯誤 (X)"], 
      answerIndex: 1, 
      explanation: "水也可以傳送動力，這就是液壓原理！" 
    },
    { 
      id: "f4", 
      type: "choice",
      topic: "力的表示", 
      question: "用箭號表示力的方向 and 大小時，箭號的「長度」通常用來表示什麼？", 
      options: ["力的方向", "力的大小", "力的顏色", "力的速度"], 
      answerIndex: 1, 
      explanation: "箭號愈長，代表施力愈大！" 
    },
    { 
      id: "f6", 
      type: "boolean",
      topic: "力的作用", 
      question: "力除了可以改變物體的形狀和運動狀態外，也可以改變物體的顏色。", 
      options: ["正確 (O)", "錯誤 (X)"], 
      answerIndex: 1, 
      explanation: "力可以改變形狀和運動狀態，但不能直接改變物體的顏色。" 
    },
    { 
      id: "f7", 
      type: "choice",
      topic: "運動狀態", 
      question: "下列哪一個不是力使物體改變「運動情形」的例子？", 
      options: ["接住傳來的球", "把球丟出去", "使滾動中的球停下來", "把球壓扁"], 
      answerIndex: 3, 
      explanation: "把球壓扁是改變「形狀」，不是運動情形。" 
    },
    { 
      id: "f8", 
      type: "choice",
      topic: "施力方向", 
      question: "打掃時，小隊員舉起地上的板凳，此時手對板凳施力的方向是？", 
      options: ["向左", "向右", "向上", "向下"], 
      answerIndex: 2, 
      explanation: "要把地上的東西舉起來，必須向上施力。" 
    },
    { 
      id: "f9", 
      type: "text",
      topic: "力的要素", 
      question: "想要將紙團準確丟入垃圾桶中，除了要注意力的大小，還要注意力的什麼？(兩個字)", 
      correctAnswer: "方向", 
      explanation: "力的大小和方向是決定物體運動軌跡的關鍵要素。" 
    },
    { 
      id: "f10", 
      type: "boolean",
      topic: "彈性", 
      question: "拉橡皮筋時，拉開的距離愈長，表示用的力愈大。", 
      options: ["正確 (O)", "錯誤 (X)"], 
      answerIndex: 0, 
      explanation: "在彈性限度內，拉得愈長代表施力愈大。" 
    },
    {
      id: "f11",
      type: "boolean",
      topic: "動力傳送",
      question: "高壓水柱、水槍、落葉吹風機等物品，都是可以傳送動力的工具。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 0,
      explanation: "這些工具利用空氣或水的流動來傳送動力。"
    },
    {
      id: "f12",
      type: "boolean",
      topic: "形狀變化",
      question: "手按壓海綿後再鬆開，海綿會恢復原來的形狀。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 0,
      explanation: "海綿具有彈性，受力變形後會恢復原狀。"
    },
    {
      id: "f13",
      type: "boolean",
      topic: "運動狀態",
      question: "用力踩扁可樂瓶，表示力可以讓物體改變「運動狀態」。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 1,
      explanation: "踩扁可樂瓶是改變物體的「形狀」，不是運動狀態。"
    },
    {
      id: "f14",
      type: "boolean",
      topic: "力的大小",
      question: "想傳球給距離愈遠的同學時，用的力就要愈大。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 0,
      explanation: "施力愈大，物體獲得的動能愈多，可以移動得愈遠。"
    },
    {
      id: "f15",
      type: "boolean",
      topic: "風力的應用",
      question: "風力可以吹動風車，也可以吹動樹葉或讓旗子擺動。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 0,
      explanation: "風的流動產生力量，可以帶動各種物體運動。"
    },
    {
      id: "f16",
      type: "choice",
      topic: "動力傳送",
      question: "下列哪一種行為是「動力傳送」的應用？",
      options: ["高壓水柱清洗汽車", "玩具水槍收到櫃子", "隨身噴霧瓶倒入酒精", "水管接在水龍頭上"],
      answerIndex: 0,
      explanation: "利用水流的壓力來清洗污垢，是動力傳送的實例。"
    },
    {
      id: "f17",
      type: "choice",
      topic: "形狀變化",
      question: "下列哪一個物體受力後會產生「形狀」的變化？",
      options: ["接住飛行中的躲避球", "擠壓手上的氣球", "拿起桌上的乒乓球", "撿起地上的羽毛球"],
      answerIndex: 1,
      explanation: "擠壓氣球會使其凹陷或變形。"
    },
    {
      id: "f18",
      type: "choice",
      topic: "運動狀態",
      question: "用腳踩住同學踢過來的足球，足球的運動情形會有什麼改變？",
      options: ["滾得更快", "原地轉動", "停止滾動", "沒有任何改變"],
      answerIndex: 2,
      explanation: "踩住球是施加一個反向的力，使球從運動變為靜止。"
    },
    {
      id: "f19",
      type: "choice",
      topic: "受力方向",
      question: "羽球被球拍擊中後會改變飛行方向，根據飛行方向的變化我們可以知道什麼？",
      options: ["羽球受力的方向", "羽球受力的大小", "羽球的重量", "球拍的尺寸"],
      answerIndex: 0,
      explanation: "物體運動方向的改變，代表受到了該方向的力作用。"
    },
    {
      id: "f20",
      type: "text",
      topic: "力的作用",
      question: "從下列哪一個情形「無法」看出物體受到力的作用？(位置移動/顏色改變/形狀改變)",
      correctAnswer: "顏色改變",
      explanation: "力可以改變物體的位置、運動狀態或形狀，但通常不會改變顏色。"
    },
    {
      id: "f21",
      type: "text",
      topic: "受力方向",
      question: "小悅向「右邊」推車子，車子會朝哪個方向移動呢？(請輸入一個字)",
      correctAnswer: "右",
      explanation: "物體受力後，會朝著受力的方向移動。"
    }
  ],
  water: [
    {
      id: "w1",
      type: "choice",
      topic: "連通管原理",
      question: "【絕對水平領域】當水在連通管中靜止時，不論容器形狀如何，各管的水面高度會如何？",
      options: ["完全相同", "左高右低", "中間最高", "隨機變化"],
      answerIndex: 0,
      explanation: "這就是連通管原理，靜止時水面高度會保持一致！"
    },
    {
      id: "w2",
      type: "boolean",
      topic: "虹吸現象",
      question: "發動虹吸現象時，出水口的位置必須「高於」原本容器的水面才能成功。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 1,
      explanation: "出水口必須「低於」水面，利用壓力差才能將水引出。"
    },
    {
      id: "w4",
      type: "choice",
      topic: "連通管應用",
      question: "下列哪一個生活用品「不是」利用連通管原理設計的？",
      options: ["茶壺的壺嘴", "洗手台下方的U型管", "熱水瓶的水位視窗", "吸管吸飲料"],
      answerIndex: 3,
      explanation: "吸管吸飲料是利用大氣壓力，不是連通管原理。"
    },
    {
      id: "w5",
      type: "boolean",
      topic: "虹吸現象",
      question: "在使用虹吸管引水前，管子內部必須先裝滿水且排除空氣。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 0,
      explanation: "管內充滿液體是發動虹吸現象的必要條件。"
    },
    {
      id: "w6",
      type: "boolean",
      topic: "水平面",
      question: "只要水靜止，不論容器如何傾斜，水面永遠會保持水平。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 0,
      explanation: "水的特性之一就是在靜止時會保持水平面。"
    },
    {
      id: "w7",
      type: "boolean",
      topic: "毛細現象",
      question: "毛細現象是指液體在細微縫隙中自動上升或移動的現象。",
      options: ["正確 (O)", "錯誤 (X)"],
      answerIndex: 0,
      explanation: "這是液體分子間的吸引力與管壁吸引力共同作用的結果。"
    },
    {
      id: "w8",
      type: "choice",
      topic: "連通管原理",
      question: "如果連通管的一端管子較細，另一端較粗，靜止時哪一邊的水面會比較高？",
      options: ["粗的比較高", "細的比較高", "兩邊一樣高", "不一定"],
      answerIndex: 2,
      explanation: "連通管原理不受管子粗細影響，靜止時高度必相同。"
    },
    {
      id: "w9",
      type: "choice",
      topic: "虹吸現象",
      question: "下列哪一個物品「不是」利用虹吸現象原理設計的？",
      options: ["自動飲水器", "魚缸換水管", "馬桶沖水系統", "熱水瓶水位視窗"],
      answerIndex: 3,
      explanation: "熱水瓶水位視窗是利用「連通管原理」。"
    },
    {
      id: "w10",
      type: "text",
      topic: "虹吸現象",
      question: "想要成功發動虹吸現象，管子內部必須先裝滿什麼液體？(一個字)",
      correctAnswer: "水",
      explanation: "管內必須充滿液體（通常是水）才能利用壓力差引水。"
    }
  ]
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (state: any) => boolean;
  reward?: string;
}

interface Job {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  quote: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  skillName: string;
  skillDescription: string;
  skillTrigger: 'correct' | 'wrong' | 'low_hp' | 'low_time';
}

const JOBS: Job[] = [
  {
    id: 'knight',
    name: '守護騎士',
    icon: <img src="https://i.meee.com.tw/Nf6iMLO.png" alt="守護騎士" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />,
    description: '高血量，能為小隊抵擋錯誤。',
    quote: '「舉起堅固的盾牌，我會保護大家過關的！」',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    accentColor: 'text-blue-500',
    skillName: '絕對防禦',
    skillDescription: '答錯時可抵擋一次傷害。',
    skillTrigger: 'wrong'
  },
  {
    id: 'fairy',
    name: '魔法精靈',
    icon: <img src="https://i.meee.com.tw/XlGTco5.png" alt="魔法精靈" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />,
    description: '高輸出，答對時攻擊力加倍。',
    quote: '「用科學魔法打敗巨石像吧！轟隆隆～」',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    accentColor: 'text-pink-500',
    skillName: '魔力爆發',
    skillDescription: '答對時可讓攻擊傷害加倍。',
    skillTrigger: 'correct'
  },
  {
    id: 'healer',
    name: '森林療癒師',
    icon: <img src="https://i.meee.com.tw/UmUaWhZ.png" alt="森林療癒師" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />,
    description: '過關時能為小隊恢復體力。',
    quote: '「大家受傷了嗎？交給我來呼呼，馬上就好囉！」',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    accentColor: 'text-green-500',
    skillName: '大地治癒',
    skillDescription: '受傷時可立即恢復 1 點體力。',
    skillTrigger: 'low_hp'
  },
  {
    id: 'cat',
    name: '幻影貓貓',
    icon: <img src="https://i.meee.com.tw/snwNFVP.png" alt="幻影貓貓" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />,
    description: '高靈巧，有一定機率閃避危機。',
    quote: '「我的解題速度，可是連風都追不上喵！」',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    accentColor: 'text-purple-500',
    skillName: '時空閃避',
    skillDescription: '時間快耗盡時可延長 15 秒。',
    skillTrigger: 'low_time'
  }
];

// --- Components ---

export default function App() {
  const [gameState, setGameState] = useState<'login' | 'entering' | 'map' | 'playing' | 'gameover' | 'victory' | 'dashboard' | 'admin_login' | 'certificate'>('login');
  const [playerData, setPlayerData] = useState({
    teamCode: '',
    playerName: '',
    selectedJob: '',
    isSoloMode: false
  });
  const [selectedDungeonId, setSelectedDungeonId] = useState<string>('force');
  const [clearedDungeons, setClearedDungeons] = useState<string[]>([]);
  const [bonusHearts, setBonusHearts] = useState<number>(0);
  const [medals, setMedals] = useState<number>(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<any[]>([]);
  const [hasTakenDamageInCurrentDungeon, setHasTakenDamageInCurrentDungeon] = useState(false);
  const [doubleMedalsNextRun, setDoubleMedalsNextRun] = useState(false);

  // Presence Sync
  useEffect(() => {
    if (!playerData.teamCode || !playerData.playerName || gameState === 'login' || gameState === 'entering') return;

    const playerRef = ref(rtdb, `rooms/${playerData.teamCode}/players/${playerData.playerName}`);
    
    const updatePresence = () => {
      update(playerRef, {
        job: playerData.selectedJob,
        status: gameState === 'playing' ? 'playing' : 'map',
        lastUpdate: Date.now()
      });
    };

    updatePresence();
    const interval = setInterval(updatePresence, 10000); // Update every 10s
    
    onDisconnect(playerRef).remove();

    return () => {
      clearInterval(interval);
      update(playerRef, { lastUpdate: 0 }); // Mark as inactive
    };
  }, [playerData.teamCode, playerData.playerName, gameState, playerData.selectedJob]);

  const handleLogin = (data: typeof playerData) => {
    setPlayerData(data);
    setGameState('entering');
    setTimeout(() => setGameState('map'), 2500);
  };

  const handleSelectDungeon = (id: string) => {
    setSelectedDungeonId(id);
    setGameState('playing');
  };

  const handleMerchantSuccess = () => {
    setBonusHearts(prev => prev + 1);
    checkAchievements('merchant');
  };

  const ACHIEVEMENTS: Achievement[] = [
    {
      id: 'first_clear',
      title: '初試身手',
      description: '首次通關任意一個地圖',
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      condition: (state) => state.clearedDungeons.length >= 1
    },
    {
      id: 'all_clear',
      title: '全域制霸',
      description: '成功通關所有地圖',
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      condition: (state) => state.clearedDungeons.length === DUNGEONS.length
    },
    {
      id: 'medal_collector',
      title: '勳章收藏家',
      description: '累積獲得 1000 枚勳章',
      icon: <Sparkles className="w-6 h-6 text-yellow-500" />,
      condition: (state) => state.medals >= 1000
    },
    {
      id: 'medal_tycoon',
      title: '勳章大富翁',
      description: '累積獲得 5000 枚勳章',
      icon: <Sparkles className="w-6 h-6 text-orange-500" />,
      condition: (state) => state.medals >= 5000
    },
    {
      id: 'no_damage',
      title: '無傷傳說',
      description: '以滿血狀態通關一個地圖',
      icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
      condition: (state) => state.lastClearNoDamage
    },
    {
      id: 'merchant_friend',
      title: '商人的好友',
      description: '正確回答旅行商人的問題',
      icon: <Users className="w-6 h-6 text-orange-400" />,
      condition: (state) => state.merchantAnswered
    }
  ];

  const checkAchievements = (trigger: string, extra?: any) => {
    const state = {
      clearedDungeons,
      medals,
      lastClearNoDamage: trigger === 'victory' && !hasTakenDamageInCurrentDungeon,
      merchantAnswered: trigger === 'merchant'
    };

    const newlyUnlocked: string[] = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && ach.condition(state)) {
        newlyUnlocked.push(ach.id);
      }
    });

    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
      // Show a toast or notification if needed
    }
  };

  const handleGameEnd = (result: 'victory' | 'gameover', details?: { noDamage: boolean }) => {
    if (result === 'victory') {
      if (details?.noDamage) {
        setHasTakenDamageInCurrentDungeon(false);
      } else {
        setHasTakenDamageInCurrentDungeon(true);
      }

      let newCleared = clearedDungeons;
      if (!clearedDungeons.includes(selectedDungeonId)) {
        newCleared = [...clearedDungeons, selectedDungeonId];
        setClearedDungeons(newCleared);
      }
      setMedals(prev => {
        const reward = 500;
        const finalReward = doubleMedalsNextRun ? reward * 2 : reward;
        const newMedals = prev + finalReward;
        // Check achievements after medal update
        setTimeout(() => checkAchievements('victory'), 100);
        return newMedals;
      });
      setBonusHearts(0); // Reset bonus hearts after victory
      setDoubleMedalsNextRun(false); // Reset double medals after victory

      // Check if all dungeons are cleared
      if (newCleared.length === DUNGEONS.length) {
        setGameState('certificate');
      } else {
        setGameState('victory');
      }
    } else {
      setGameState('gameover');
      setHasTakenDamageInCurrentDungeon(false); // Reset for next run
    }
  };

  const resetGame = () => {
    setGameState('login');
    setClearedDungeons([]);
    setBonusHearts(0);
    setMedals(0);
    setWrongQuestions([]);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-gray-800 font-sans selection:bg-pink-200 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {gameState === 'login' && (
          <LoginScreen 
            key="login" 
            onLogin={handleLogin} 
            onAdminClick={() => setGameState('admin_login')}
          />
        )}
        {gameState === 'admin_login' && (
          <AdminLogin 
            key="admin_login" 
            onUnlock={() => setGameState('dashboard')} 
            onBack={() => setGameState('login')}
          />
        )}
        {gameState === 'entering' && (
          <EnteringScreen key="entering" playerName={playerData.playerName} />
        )}
        {gameState === 'map' && (
          <WorldMap 
            key="map"
            clearedDungeons={clearedDungeons}
            onSelectDungeon={handleSelectDungeon}
            onMerchantSuccess={handleMerchantSuccess}
            medals={medals}
            onSpendMedals={(amount, hearts, type) => {
              setMedals(prev => prev - amount);
              if (type === 'heart') {
                setBonusHearts(prev => prev + hearts);
              } else if (type === 'double_medals') {
                setDoubleMedalsNextRun(true);
              }
            }}
            teamCode={playerData.teamCode}
            playerName={playerData.playerName}
            achievements={ACHIEVEMENTS}
            unlockedAchievements={unlockedAchievements}
            onJobChange={(jobId) => {
              setPlayerData(prev => ({ ...prev, selectedJob: jobId }));
            }}
            doubleMedalsActive={doubleMedalsNextRun}
          />
        )}
        {gameState === 'playing' && (
          <BossBattle 
            key="playing" 
            playerData={playerData} 
            dungeonId={selectedDungeonId}
            bonusHearts={bonusHearts}
            isSoloMode={playerData.isSoloMode}
            onEnd={handleGameEnd} 
            onWrongAnswer={(q) => setWrongQuestions(prev => [...prev, q])}
          />
        )}
        {gameState === 'certificate' && (
          <GuildCertificateScreen
            teamName={playerData.isSoloMode ? "個人修行者" : playerData.teamCode}
            playerName={playerData.playerName}
            job={JOBS.find(j => j.id === playerData.selectedJob)?.name || ''}
            wrongQuestions={wrongQuestions}
            clearedDungeons={clearedDungeons}
            onRestart={resetGame}
          />
        )}
        {gameState === 'victory' && (
          <VictoryScreen
            key="victory"
            teamName={playerData.teamCode}
            playerName={playerData.playerName}
            job={JOBS.find(j => j.id === playerData.selectedJob)?.name || ''}
            dungeonId={selectedDungeonId}
            clearedDungeons={clearedDungeons}
            onReturnToMap={() => setGameState('map')}
          />
        )}
        {gameState === 'dashboard' && (
          <TeacherDashboard key="dashboard" />
        )}
        {gameState === 'gameover' && (
          <EndScreen 
            key="end" 
            result="gameover" 
            onRestart={resetGame} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LoginScreen({ onLogin, onAdminClick }: { onLogin: (data: any) => void, onAdminClick: () => void, key?: string }) {
  const [teamCode, setTeamCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isSoloMode, setIsSoloMode] = useState(false);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);

  const selectedJob = JOBS.find(j => j.id === selectedJobId);
  const viewingJob = JOBS.find(j => j.id === viewingJobId);
  const isFormValid = (isSoloMode || teamCode.trim() !== '') && playerName.trim() !== '' && selectedJobId !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      const finalTeamCode = isSoloMode ? `solo_${Date.now()}` : teamCode;
      onLogin({ teamCode: finalTeamCode, playerName, selectedJob: selectedJobId, isSoloMode });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-mint-50 via-cream-50 to-pink-50"
      style={{
        backgroundColor: '#f0fff4', // Mint fallback
        backgroundImage: 'radial-gradient(circle at 20% 20%, #fff5f5 0%, transparent 40%), radial-gradient(circle at 80% 80%, #f0f9ff 0%, transparent 40%)'
      }}
    >
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-md border-4 border-white rounded-[3rem] shadow-2xl p-8 md:p-12 relative">
        
        {/* 裝飾星星 */}
        <Star className="absolute top-8 left-8 text-yellow-400 w-6 h-6 animate-pulse" />
        <Sparkles className="absolute bottom-12 right-12 text-pink-300 w-8 h-8 animate-bounce" />

        <header className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 mb-2">
              奇幻冒險：科學公會
            </h1>
          </motion.div>
          <p className="text-gray-400 font-medium tracking-widest uppercase text-sm">Fantasy Science Adventure</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* 輸入區 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`space-y-3 transition-all duration-300 ${isSoloMode ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <label className="text-lg font-bold text-gray-600 ml-2 flex items-center gap-2">
                <span className="bg-blue-100 p-1 rounded-lg text-blue-500">#</span> 小隊代碼
              </label>
              <input 
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                disabled={isSoloMode}
                placeholder={isSoloMode ? "單人模式已開啟" : "例如：FORCE01"}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="space-y-3">
              <label className="text-lg font-bold text-gray-600 ml-2 flex items-center gap-2">
                <User className="w-5 h-5 text-pink-400" /> 冒險者暱稱
              </label>
              <input 
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="你的超酷名字"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* 單人模式切換 */}
          <div className="flex justify-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isSoloMode}
                  onChange={(e) => setIsSoloMode(e.target.checked)}
                />
                <div className={`w-14 h-8 rounded-full transition-colors duration-300 ${isSoloMode ? 'bg-purple-500' : 'bg-gray-200'}`} />
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${isSoloMode ? 'translate-x-6' : ''} shadow-sm`} />
              </div>
              <span className={`text-lg font-black transition-colors ${isSoloMode ? 'text-purple-600' : 'text-gray-400'}`}>
                單人修行模式 (不需輸入小隊代碼)
              </span>
            </label>
          </div>

          {/* 職業選擇卡片 */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-gray-700 text-center">✨ 選擇你的冒險職業 ✨</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {JOBS.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setViewingJobId(job.id)}
                  className={`flex flex-col items-center p-5 rounded-3xl border-4 transition-all duration-300 hover:-translate-y-2 ${
                    selectedJobId === job.id 
                      ? `${job.borderColor} ${job.bgColor} shadow-xl scale-105` 
                      : 'border-transparent bg-gray-50 text-gray-400 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'
                  }`}
                >
                  <div className={`mb-3 p-3 rounded-2xl ${selectedJobId === job.id ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                    {job.icon}
                  </div>
                  <span className={`font-black text-lg ${selectedJobId === job.id ? job.accentColor : ''}`}>{job.name}</span>
                  <p className="text-[10px] mt-2 leading-tight text-center font-medium">{job.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 動態對話框 */}
          <div className="h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {selectedJob ? (
                <motion.div
                  key={selectedJob.id}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="relative bg-white border-2 border-gray-100 rounded-3xl px-8 py-4 shadow-lg flex items-center gap-4"
                >
                  <MessageCircle className={`w-6 h-6 ${selectedJob.accentColor}`} />
                  <p className="text-lg font-bold text-gray-700 tracking-wide italic">
                    {selectedJob.quote}
                  </p>
                  {/* 對話框小三角形 */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-bottom-[12px] border-b-white" />
                </motion.div>
              ) : (
                <p className="text-gray-300 font-medium italic">點選一個職業來查看詳細資訊並選擇吧！</p>
              )}
            </AnimatePresence>
          </div>

          {/* 開始按鈕 */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`group relative px-12 py-5 rounded-full text-2xl font-black tracking-widest transition-all duration-300 transform active:scale-95 ${
                isFormValid 
                  ? 'bg-gradient-to-r from-pink-400 to-orange-400 text-white shadow-[0_10px_25px_rgba(244,114,182,0.4)] hover:shadow-[0_15px_35px_rgba(244,114,182,0.6)]' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-6 h-6 ${isFormValid ? 'animate-spin' : ''}`} />
                開始冒險
              </div>
            </button>
          </div>
        </form>

        {/* Hidden Entry for Admin */}
        <div className="mt-12 text-center relative z-50">
          <button 
            onClick={onAdminClick}
            className="text-[10px] font-bold text-slate-300 hover:text-slate-500 transition-colors tracking-widest uppercase flex items-center justify-center gap-1 mx-auto opacity-30 hover:opacity-100 cursor-pointer p-2"
          >
            <Lock className="w-3 h-3" /> 公會管理處
          </button>
        </div>

        {/* 職業詳情彈窗 */}
        <AnimatePresence>
          {viewingJob && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[3rem] max-w-lg w-full p-10 relative shadow-2xl overflow-hidden"
              >
                {/* 背景裝飾 */}
                <div className={`absolute top-0 left-0 w-full h-32 opacity-10 ${viewingJob.bgColor}`} />
                
                <button 
                  onClick={() => setViewingJobId(null)}
                  className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="relative flex flex-col items-center text-center space-y-6">
                  <motion.div 
                    layoutId={`job-icon-${viewingJob.id}`}
                    className={`p-8 rounded-[2.5rem] ${viewingJob.bgColor} ${viewingJob.borderColor} border-4 shadow-inner`}
                  >
                    {/* Clone the icon and make it larger */}
                    {React.cloneElement(viewingJob.icon as React.ReactElement, { className: "w-24 h-24 object-contain" })}
                  </motion.div>

                  <div>
                    <h2 className={`text-4xl font-black mb-2 ${viewingJob.accentColor}`}>{viewingJob.name}</h2>
                    <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">職業詳情</p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-3xl w-full border-2 border-gray-100">
                    <p className="text-gray-700 font-bold text-lg leading-relaxed">
                      {viewingJob.description}
                    </p>
                    <div className={`mt-4 pt-4 border-t border-gray-200 flex items-center gap-3 ${viewingJob.accentColor}`}>
                      <Zap className="w-5 h-5" />
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest">特殊技能：{viewingJob.skillName}</p>
                        <p className="text-sm font-bold opacity-80">{viewingJob.skillDescription}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full">
                    <div className="absolute -top-4 left-4 text-4xl text-gray-200 font-serif opacity-50">“</div>
                    <p className="text-xl font-black text-gray-600 italic px-8">
                      {viewingJob.quote}
                    </p>
                    <div className="absolute -bottom-8 right-4 text-4xl text-gray-200 font-serif opacity-50">”</div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedJobId(viewingJob.id);
                      setViewingJobId(null);
                    }}
                    className={`w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 shadow-lg hover:shadow-xl ${
                      viewingJob.id === 'knight' ? 'bg-blue-500 shadow-blue-200' :
                      viewingJob.id === 'fairy' ? 'bg-pink-500 shadow-pink-200' :
                      viewingJob.id === 'healer' ? 'bg-green-500 shadow-green-200' :
                      'bg-purple-500 shadow-purple-200'
                    }`}
                  >
                    就決定是你了！
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function EnteringScreen({ playerName }: { playerName: string, key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-8"
    >
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="mb-8"
      >
        <Star className="w-24 h-24 text-yellow-400 fill-yellow-400" />
      </motion.div>
      <h2 className="text-4xl font-black text-gray-800 mb-4 tracking-tight">
        魔法傳送中...
      </h2>
      <p className="text-xl font-bold text-pink-500 animate-pulse">
        冒險者 {playerName}，準備好出發了嗎？
      </p>
    </motion.div>
  );
}

// --- TeammatesList Component ---
function TeammatesList({ teamCode, currentPlayerName }: { teamCode: string, currentPlayerName: string }) {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!teamCode || teamCode.startsWith('solo_')) return;
    const playersRef = ref(rtdb, `rooms/${teamCode}/players`);
    return onValue(playersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([name, info]: [string, any]) => ({
        name,
        ...info
      })).filter(p => Date.now() - p.lastUpdate < 60000); // Show players active in last minute
      setPlayers(list);
    });
  }, [teamCode]);

  if (players.length <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <div className="flex flex-wrap justify-center gap-2">
        {players.map((p) => {
          const job = JOBS.find(j => j.id === p.job);
          return (
            <motion.div 
              key={p.name}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-3 py-1 rounded-full border-2 ${job?.borderColor || 'border-gray-200'} ${job?.bgColor || 'bg-white'} shadow-sm flex items-center gap-2 relative`}
            >
              <span className={`text-xs font-black ${job?.accentColor || 'text-gray-600'}`}>
                {p.name}
              </span>
              {p.status === 'playing' && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white/50 px-4 py-1 rounded-full border border-gray-100">
        <Users className="w-3 h-3" />
        小隊冒險中
      </div>
    </div>
  );
}

// --- AchievementModal Component ---
function AchievementModal({ isOpen, onClose, achievements, unlockedIds }: { isOpen: boolean, onClose: () => void, achievements: Achievement[], unlockedIds: string[] }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 md:p-8"
        >
          <motion.div 
            initial={{ y: 50, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            className="bg-white max-w-4xl w-full rounded-[3rem] p-8 md:p-12 shadow-2xl border-8 border-yellow-100 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-gray-100 text-gray-500 rounded-full hover:scale-110 transition-transform shadow-sm z-10"
              aria-label="Close"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="text-center mb-10">
              <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
                <Trophy className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-3xl font-black text-gray-800">冒險成就系統</h3>
              <p className="text-gray-400 font-bold mt-2">達成特定目標，證明你的實力！</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((ach) => {
                const isUnlocked = unlockedIds.includes(ach.id);
                return (
                  <div 
                    key={ach.id}
                    className={`p-6 rounded-3xl border-4 transition-all ${
                      isUnlocked 
                        ? 'bg-yellow-50 border-yellow-200 shadow-md' 
                        : 'bg-gray-50 border-gray-100 opacity-60 grayscale'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`p-3 rounded-2xl ${isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-200'}`}>
                        {ach.icon}
                      </div>
                      <div>
                        <h4 className={`font-black ${isUnlocked ? 'text-yellow-800' : 'text-gray-500'}`}>
                          {ach.title}
                        </h4>
                        {isUnlocked && (
                          <span className="text-[10px] font-black text-yellow-600 bg-yellow-200/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            已達成
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs font-bold leading-relaxed ${isUnlocked ? 'text-yellow-700/70' : 'text-gray-400'}`}>
                      {ach.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col items-center gap-4">
              <p className="text-sm font-bold text-gray-400">
                目前進度：{unlockedIds.length} / {achievements.length}
              </p>
              <button
                onClick={onClose}
                className="px-12 py-4 bg-gray-800 text-white text-xl font-black rounded-full shadow-lg hover:bg-gray-700 transition-all active:scale-95"
              >
                關閉視窗
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WorldMap({ clearedDungeons, onSelectDungeon, onMerchantSuccess, medals, onSpendMedals, teamCode, playerName, achievements, unlockedAchievements, onJobChange, doubleMedalsActive }: { clearedDungeons: string[], onSelectDungeon: (id: string) => void, onMerchantSuccess: () => void, medals: number, onSpendMedals: (amount: number, hearts: number, type?: 'heart' | 'job_change' | 'double_medals') => void, teamCode: string, playerName: string, achievements: Achievement[], unlockedAchievements: string[], onJobChange: (jobId: string) => void, doubleMedalsActive?: boolean, key?: string }) {
  const [showMerchant, setShowMerchant] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showJobSelection, setShowJobSelection] = useState(false);
  const [merchantAnswer, setMerchantAnswer] = useState('');
  const [merchantFeedback, setMerchantFeedback] = useState('');
  const [merchantSuccess, setMerchantSuccess] = useState(false);

  const handleMerchantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validKeywords = ['物質', '固體', '液體', '氣體', '水', '空氣', '固態', '液態', '氣態'];
    const isCorrect = validKeywords.some(keyword => merchantAnswer.includes(keyword));

    if (isCorrect) {
      setMerchantFeedback('太聰明了！這個備用愛心（❤️）就交給你們小隊了！');
      setMerchantSuccess(true);
      onMerchantSuccess();
      setMerchantAnswer('');
    } else {
      setMerchantFeedback('嗯...好像不太對喔？再想想看大自然裡有哪些東西？');
    }
  };

  const handleSpendMedals = (amount: number, hearts: number, type?: 'heart' | 'job_change' | 'double_medals') => {
    onSpendMedals(amount, hearts, type);
    if (type === 'job_change') {
      setShowJobSelection(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-6 md:p-12 flex flex-col items-center bg-[#fdfbf7] relative"
      style={{
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      <header className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-tight">冒險地圖</h1>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">World Exploration</p>
        
        <TeammatesList teamCode={teamCode} currentPlayerName={playerName} />

        {/* Medal Display */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {doubleMedalsActive && (
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 rounded-full shadow-lg border-2 border-white flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span className="text-white font-black text-xs">勳章加倍中！</span>
            </motion.div>
          )}
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-yellow-400/30">
            <span className="text-2xl">🌟</span>
            <span className="text-xl font-black text-yellow-700">{medals}</span>
            <span className="text-sm font-bold text-yellow-600/60 uppercase tracking-widest ml-2">榮譽勳章</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        {DUNGEONS.map((dungeon) => {
          const isUnlocked = dungeon.id === 'force' || clearedDungeons.includes('force');
          
          return (
            <motion.button
              key={dungeon.id}
              whileHover={isUnlocked ? { scale: 1.02, y: -5 } : {}}
              whileTap={isUnlocked ? { scale: 0.98 } : {}}
              onClick={() => isUnlocked && onSelectDungeon(dungeon.id)}
              className={`relative h-80 rounded-[3rem] overflow-hidden border-4 bg-white shadow-xl transition-all group ${
                isUnlocked ? 'cursor-pointer border-white' : 'cursor-not-allowed border-gray-200'
              }`}
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={dungeon.bg} 
                  alt={dungeon.name} 
                  className={`w-full h-full object-cover transition-all duration-500 ${isUnlocked ? 'group-hover:scale-110' : 'grayscale opacity-50'}`}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${dungeon.color} opacity-60 mix-blend-multiply`} />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full p-8 flex flex-col justify-end text-white text-left">
                <div className="mb-4 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl inline-flex items-center justify-center border border-white/30 self-start">
                  <span className="text-sm font-black tracking-widest uppercase">BOSS: {dungeon.bossName}</span>
                </div>
                <h3 className="text-3xl font-black mb-2">{dungeon.name}</h3>
                <p className="text-white/80 font-medium leading-tight">{dungeon.description}</p>
                
                {isUnlocked && (
                  <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-white text-gray-800 px-4 py-2 rounded-full self-start shadow-lg">
                    立即前往 <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Lock Overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 z-20 bg-gray-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center">
                  <div className="bg-white/90 p-6 rounded-full shadow-2xl">
                    <Lock className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="mt-4 text-white font-black tracking-widest bg-gray-800/80 px-6 py-2 rounded-full">
                    解鎖條件：通關巨石遺跡
                  </p>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Merchant Easter Egg */}
      <div className="absolute bottom-8 left-8 z-30">
        <div className="relative group">
          <button 
            onClick={() => setShowMerchant(true)}
            className="text-4xl opacity-20 hover:opacity-100 transition-all duration-300 transform hover:scale-125 cursor-pointer"
          >
            🎒
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            旅行商人
          </div>
        </div>
      </div>

      {/* Bestiary Button */}
      <div className="absolute bottom-8 right-8 z-30 flex flex-col gap-4 items-end">
        {/* Achievement Button */}
        <div className="relative group">
          <button 
            onClick={() => setShowAchievements(true)}
            className="bg-white p-4 rounded-full shadow-lg border-2 border-yellow-400/20 text-yellow-600 hover:scale-110 transition-all active:scale-95"
          >
            <Trophy className="w-8 h-8" />
          </button>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 px-3 py-1 bg-yellow-600 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            冒險成就
          </div>
        </div>

        {/* Shop Button */}
        <div className="relative group">
          <button 
            onClick={() => setShowShop(true)}
            className="bg-yellow-400 p-4 rounded-full shadow-lg border-2 border-yellow-600/20 text-yellow-900 hover:scale-110 transition-all active:scale-95"
          >
            <Sparkles className="w-8 h-8" />
          </button>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 px-3 py-1 bg-yellow-600 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            勳章商店
          </div>
        </div>

        <div className="relative group">
          <button 
            onClick={() => setShowBestiary(true)}
            className="bg-white/80 backdrop-blur-md p-4 rounded-full shadow-lg border-2 border-[#8b5e3c]/20 text-[#8b5e3c] hover:scale-110 transition-all active:scale-95"
          >
            <Book className="w-8 h-8" />
          </button>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 px-3 py-1 bg-[#8b5e3c] text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            冒險者圖鑑
          </div>
        </div>
      </div>

      {/* Achievement Modal */}
      <AchievementModal 
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        achievements={achievements}
        unlockedIds={unlockedAchievements}
      />

      {/* Bestiary Modal */}
      <BestiaryModal 
        isOpen={showBestiary} 
        onClose={() => setShowBestiary(false)} 
        clearedDungeons={clearedDungeons} 
      />

      {/* Shop Modal */}
      <ShopModal 
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        medals={medals}
        onPurchase={handleSpendMedals}
      />

      {/* Job Selection Modal */}
      <JobSelectionModal 
        isOpen={showJobSelection}
        onClose={() => setShowJobSelection(false)}
        onSelect={(jobId) => {
          onJobChange(jobId);
          setShowJobSelection(false);
        }}
      />

      {/* Merchant Modal */}
      <AnimatePresence>
        {showMerchant && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              className="bg-white max-w-2xl w-full rounded-[3rem] p-8 md:p-12 shadow-2xl border-8 border-orange-100 relative"
            >
              <button 
                onClick={() => { setShowMerchant(false); setMerchantFeedback(''); setMerchantSuccess(false); }}
                className="absolute top-6 right-6 p-3 bg-gray-100 text-gray-500 rounded-full hover:scale-110 transition-transform shadow-sm z-10"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎒</div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">旅行商人的隨機考驗</h3>
                <div className="bg-orange-50 p-6 rounded-3xl border-2 border-orange-100 relative">
                  <p className="text-orange-800 font-bold leading-relaxed italic">
                    「嘿！年輕的冒險者。如果你能回答我的問題，我就送你一個保命的好東西。告訴我，『什麼可以傳送力？』」
                  </p>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-orange-50" />
                </div>
              </div>

              {!merchantSuccess ? (
                <form onSubmit={handleMerchantSubmit} className="space-y-4">
                  <input 
                    type="text"
                    value={merchantAnswer}
                    onChange={(e) => setMerchantAnswer(e.target.value)}
                    placeholder="輸入你的答案..."
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-bold focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all"
                  />
                  <button 
                    type="submit"
                    className="w-full py-4 bg-orange-500 text-white text-xl font-black rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    回答
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-4">❤️</div>
                  <button 
                    onClick={() => { setShowMerchant(false); setMerchantFeedback(''); setMerchantSuccess(false); }}
                    className="px-8 py-3 bg-gray-800 text-white font-black rounded-full"
                  >
                    收下禮物
                  </button>
                </div>
              )}

              {merchantFeedback && (
                <p className={`mt-6 text-center font-bold ${merchantSuccess ? 'text-green-500' : 'text-red-400'}`}>
                  {merchantFeedback}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BossBattle({ playerData, dungeonId, bonusHearts, isSoloMode, onEnd, onWrongAnswer }: { playerData: any, dungeonId: string, bonusHearts: number, isSoloMode: boolean, onEnd: (res: 'victory' | 'gameover', details?: { noDamage: boolean }) => void, onWrongAnswer?: (q: any) => void, key?: string }) {
  const QUESTION_TIME_LIMIT = 30;
  const currentInitialBossHp = isSoloMode ? 1000 : INITIAL_BOSS_HP;
  const [bossHp, setBossHp] = useState(currentInitialBossHp);
  const [teamHp, setTeamHp] = useState(INITIAL_TEAM_HP + bonusHearts);
  const [hasTakenDamage, setHasTakenDamage] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'timeout', explanation?: string } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [playerCount, setPlayerCount] = useState(1);
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [skillUsed, setSkillUsed] = useState(false);
  const [showSkillConfirm, setShowSkillConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'answer', index: number, isTimeout?: boolean } | null>(null);
  const [lastDamage, setLastDamage] = useState(0);
  const [userInput, setUserInput] = useState('');

  const dungeonQuestions = QUESTIONS_MAP[dungeonId] || QUESTIONS_MAP.force;
  const currentQuestion = dungeonQuestions[currentIdx];
  const jobInfo = JOBS.find(j => j.id === playerData.selectedJob);
  const dungeonInfo = DUNGEONS.find(d => d.id === dungeonId);

  // Update team HP if bonus hearts change
  useEffect(() => {
    setTeamHp(INITIAL_TEAM_HP + bonusHearts);
  }, [bonusHearts]);

  // Timer logic
  useEffect(() => {
    if (feedback || isAnimating || waitingForOthers || showSkillConfirm) return;

    if (timeLeft <= 0) {
      processAnswer(-1, true); // Timeout
      return;
    }

    // Phantom Cat Skill Trigger: Low Time
    if (jobInfo?.id === 'cat' && !skillUsed && timeLeft === 5 && !feedback && !isAnimating && !waitingForOthers) {
      setShowSkillConfirm(true);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, feedback, isAnimating, waitingForOthers]);

  // Reset timer on new question
  useEffect(() => {
    setTimeLeft(QUESTION_TIME_LIMIT);
  }, [currentIdx]);

  // Firebase Sync Logic
  useEffect(() => {
    if (!playerData.teamCode) return;
    
    const roomRef = ref(rtdb, `rooms/${playerData.teamCode}`);
    const votesRef = ref(rtdb, `rooms/${playerData.teamCode}/votes`);
    
    // Initial sync
    update(roomRef, {
      teamCode: playerData.teamCode,
      playerName: playerData.playerName,
      selectedJob: playerData.selectedJob,
      bossHp,
      teamHp,
      currentIdx,
      status: 'playing',
      isSoloMode
    });

    // Listen for votes if not solo
    let unsubscribeVotes: any;
    let unsubscribePlayers: any;
    if (!isSoloMode) {
      unsubscribeVotes = onValue(votesRef, (snapshot) => {
        const data = snapshot.val() || {};
        setVotes(data);
      });

      const playersRef = ref(rtdb, `rooms/${playerData.teamCode}/players`);
      unsubscribePlayers = onValue(playersRef, (snapshot) => {
        const data = snapshot.val() || {};
        const activeCount = Object.values(data).filter((p: any) => Date.now() - p.lastUpdate < 60000).length;
        setPlayerCount(activeCount || 1);
      });
    }

    // Listen for shared state if not solo
    let unsubscribeRoom: any;
    if (!isSoloMode) {
      unsubscribeRoom = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.status === 'playing') {
          // Sync state from other players
          if (data.bossHp !== undefined && data.bossHp !== bossHp) setBossHp(data.bossHp);
          if (data.teamHp !== undefined && data.teamHp !== teamHp) setTeamHp(data.teamHp);
          if (data.currentIdx !== undefined && data.currentIdx !== currentIdx) {
            setCurrentIdx(data.currentIdx);
            setFeedback(null);
            setUserInput('');
            setTimeLeft(QUESTION_TIME_LIMIT);
            setSkillUsed(false);
            setWaitingForOthers(false);
          }
        }
      });
    }

    // Cleanup on disconnect
    onDisconnect(roomRef).update({ status: 'disconnected' });

    return () => {
      if (unsubscribeVotes) unsubscribeVotes();
      if (unsubscribePlayers) unsubscribePlayers();
      if (unsubscribeRoom) unsubscribeRoom();
      update(roomRef, { status: 'finished' });
    };
  }, [playerData.teamCode, isSoloMode]);

  // Sync state changes
  useEffect(() => {
    if (!playerData.teamCode) return;
    const roomRef = ref(rtdb, `rooms/${playerData.teamCode}`);
    update(roomRef, {
      bossHp,
      teamHp,
      currentIdx
    });
  }, [bossHp, teamHp, currentIdx]);

  // Check for unanimous vote
  useEffect(() => {
    if (isSoloMode || !waitingForOthers) return;

    const voteValues = Object.values(votes);
    
    // Wait for ALL players to vote
    if (voteValues.length >= playerCount && playerCount > 0) {
      const allSame = voteValues.every(v => v === voteValues[0]);
      if (allSame) {
        processAnswer(voteValues[0] as number);
        // Clear votes for next question
        const votesRef = ref(rtdb, `rooms/${playerData.teamCode}/votes`);
        set(votesRef, null);
        setWaitingForOthers(false);
      } else {
        // Disagreement: show feedback and reset votes to allow re-voting
        setFeedback({ type: 'wrong', explanation: '小隊意見不一致！請討論後再重新選擇。' });
        const votesRef = ref(rtdb, `rooms/${playerData.teamCode}/votes`);
        set(votesRef, null);
        setWaitingForOthers(false);
        
        // Clear feedback after a short delay
        setTimeout(() => {
          setFeedback(null);
        }, 2000);
      }
    }
  }, [votes, waitingForOthers, isSoloMode, playerCount]);

  const handleAnswer = (index: number) => {
    if (feedback || isAnimating || waitingForOthers) return;

    if (isSoloMode) {
      processAnswer(index);
    } else {
      // Send vote to Firebase
      const playerVoteRef = ref(rtdb, `rooms/${playerData.teamCode}/votes/${playerData.playerName}`);
      set(playerVoteRef, index);
      setWaitingForOthers(true);
    }
  };

  const processAnswer = (index: number, isTimeout = false) => {
    let isCorrect = false;
    
    if (isTimeout) {
      isCorrect = false;
    } else if (currentQuestion.type === 'text') {
      const normalizedInput = userInput.trim().toLowerCase().replace(/\s+/g, '').replace(/[.,!?;:，。！？；：]/g, '');
      const normalizedAnswer = currentQuestion.correctAnswer.trim().toLowerCase().replace(/\s+/g, '').replace(/[.,!?;:，。！？；：]/g, '');
      isCorrect = normalizedInput === normalizedAnswer || 
                  (normalizedInput.length > 0 && normalizedAnswer.includes(normalizedInput)) ||
                  (normalizedAnswer.length > 0 && normalizedInput.includes(normalizedAnswer));
    } else {
      isCorrect = index === currentQuestion.answerIndex;
    }

    // Skill Triggers
    if (!skillUsed && !showSkillConfirm) {
      if (isCorrect && jobInfo?.id === 'fairy') {
        setPendingAction({ type: 'answer', index, isTimeout });
        setShowSkillConfirm(true);
        return;
      }
      if (!isCorrect && jobInfo?.id === 'knight') {
        setPendingAction({ type: 'answer', index, isTimeout });
        setShowSkillConfirm(true);
        return;
      }
      if (!isCorrect && jobInfo?.id === 'healer') {
        setPendingAction({ type: 'answer', index, isTimeout });
        setShowSkillConfirm(true);
        return;
      }
    }

    executeProcessAnswer(index, isTimeout);
  };

  const executeProcessAnswer = (index: number, isTimeout = false, skillActive = false) => {
    let isCorrect = false;
    
    if (isTimeout) {
      isCorrect = false;
    } else if (currentQuestion.type === 'text') {
      const normalizedInput = userInput.trim().toLowerCase().replace(/\s+/g, '').replace(/[.,!?;:，。！？；：]/g, '');
      const normalizedAnswer = currentQuestion.correctAnswer.trim().toLowerCase().replace(/\s+/g, '').replace(/[.,!?;:，。！？；：]/g, '');
      // Flexible matching: exact match or one contains the other (for "差不多" answers)
      isCorrect = normalizedInput === normalizedAnswer || 
                  (normalizedInput.length > 0 && normalizedAnswer.includes(normalizedInput)) ||
                  (normalizedAnswer.length > 0 && normalizedInput.includes(normalizedAnswer));
    } else {
      isCorrect = index === currentQuestion.answerIndex;
    }

    if (isCorrect) {
      setFeedback({ type: 'correct' });
      setIsAnimating(true);
      
      // Damage logic
      let damage = isSoloMode ? 200 : 1000;
      if (skillActive && jobInfo?.id === 'fairy') {
        damage *= 2;
      }
      setLastDamage(damage);
      const newBossHp = Math.max(0, bossHp - damage);
      
      setTimeout(() => {
        setBossHp(newBossHp);
        setIsAnimating(false);
        
        setTimeout(() => {
          setFeedback(null);
          setUserInput('');
          if (newBossHp <= 0) {
            onEnd('victory', { noDamage: !hasTakenDamage });
          } else {
            setCurrentIdx(prev => (prev + 1) % dungeonQuestions.length);
          }
        }, 1500);
      }, 500);

    } else {
      setFeedback({ 
        type: isTimeout ? 'timeout' : 'wrong', 
        explanation: currentQuestion.explanation 
      });

      if (!(skillActive && jobInfo?.id === 'knight')) {
        setTeamHp(prev => {
          const newHp = Math.max(0, prev - 1);
          if (newHp < prev) setHasTakenDamage(true);
          if (skillActive && jobInfo?.id === 'healer') {
            return Math.min(INITIAL_TEAM_HP + bonusHearts, newHp + 1);
          }
          return newHp;
        });
      }

      // Record wrong answer
      if (onWrongAnswer) {
        onWrongAnswer({
          topic: currentQuestion.topic,
          question: currentQuestion.question,
          selectedWrong: isTimeout ? "時間耗盡" : (currentQuestion.type === 'text' ? userInput : currentQuestion.options[index]),
          correctAnswer: currentQuestion.type === 'text' ? currentQuestion.correctAnswer : currentQuestion.options[currentQuestion.answerIndex],
          explanation: currentQuestion.explanation
        });
      }
    }
  };

  const handleUseSkill = () => {
    setSkillUsed(true);
    setShowSkillConfirm(false);

    if (jobInfo?.id === 'cat') {
      setTimeLeft(prev => prev + 15);
    } else if (pendingAction) {
      executeProcessAnswer(pendingAction.index, pendingAction.isTimeout, true);
      setPendingAction(null);
    }
  };

  const handleSkipSkill = () => {
    setShowSkillConfirm(false);
    if (pendingAction) {
      executeProcessAnswer(pendingAction.index, pendingAction.isTimeout, false);
      setPendingAction(null);
    }
  };

  const handleConfirmWrong = () => {
    setFeedback(null);
    setUserInput('');
    if (teamHp <= 0) {
      onEnd('gameover', { noDamage: false });
    } else {
      setCurrentIdx(prev => (prev + 1) % dungeonQuestions.length);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 flex flex-col items-center relative overflow-hidden"
      style={{
        backgroundImage: 'url("https://i.meee.com.tw/vJ0zBuF.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Subtle overlay for better UI contrast */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] -z-10" />

      {/* Top Bar: Player Stats */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-white/90 backdrop-blur-sm p-4 rounded-3xl shadow-lg border-2 border-white z-10">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${jobInfo?.bgColor} ${jobInfo?.accentColor} shadow-inner`}>
            {jobInfo?.icon}
          </div>
          <div>
            {!isSoloMode && <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">小隊：{playerData.teamCode}</p>}
            <h2 className="text-xl font-black text-gray-700">{playerData.playerName} <span className="text-sm font-medium opacity-60">({jobInfo?.name})</span></h2>
            <TeammatesList teamCode={playerData.teamCode} currentPlayerName={playerData.playerName} />
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex flex-col items-center">
          <div className={`flex items-center gap-2 px-6 py-2 rounded-2xl border-2 transition-colors ${timeLeft <= 5 ? 'bg-red-50 border-red-200 text-red-500 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-500'}`}>
            <Timer className={`w-5 h-5 ${timeLeft <= 5 ? 'animate-spin' : ''}`} />
            <span className="text-2xl font-black font-mono">{timeLeft}s</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">剩餘時間</p>
        </div>

        <div className="flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-2xl border-2 border-pink-100">
          {[...Array(INITIAL_TEAM_HP)].map((_, i) => (
            <Heart 
              key={i} 
              className={`w-6 h-6 transition-all duration-500 ${i < teamHp ? 'text-pink-500 fill-pink-500' : 'text-gray-200 fill-gray-100 scale-90'}`} 
            />
          ))}
        </div>
      </div>

      {/* Main Battle Section: Boss (Left) and Question (Right) */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-12 z-10">
        
        {/* Boss Area */}
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="relative">
            {dungeonId === 'water' ? (
              <WaterSpirit isHurt={isAnimating} isDefeated={bossHp <= 0} />
            ) : (
              <StoneGolem isHurt={isAnimating} isDefeated={bossHp <= 0} />
            )}
            
            {/* Cute Damage Text Effect */}
            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.5, rotate: -10 }}
                  animate={{ 
                    opacity: 1, 
                    y: -120, 
                    scale: [1, 1.8, 1.5],
                    rotate: [0, 10, -5, 0]
                  }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center"
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-spin" />
                    <span className="text-6xl font-black text-pink-500 drop-shadow-[0_4px_0_rgba(255,255,255,1)] filter drop-shadow(0 4px 10px rgba(244,114,182,0.5))">
                      -{lastDamage}
                    </span>
                    <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-spin" />
                  </div>
                  <span className="text-xl font-black text-orange-400 uppercase tracking-widest mt-2 bg-white/80 px-4 py-1 rounded-full shadow-sm">
                    Perfect Hit!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Boss HP Bar */}
          <div className="w-full mt-8 bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border-2 border-white/50 shadow-sm">
            <div className="flex justify-between items-end mb-2 px-2">
              <span className="text-sm font-black text-red-500 uppercase tracking-tighter flex items-center gap-2">
                <Skull className="w-4 h-4" /> {dungeonId === 'water' ? '深淵水精靈王・波波' : '重甲石巨像'}
              </span>
              <span className="text-xs font-mono font-bold text-gray-500">HP: {bossHp} / {currentInitialBossHp}</span>
            </div>
            <div className="h-8 w-full bg-gray-200/50 rounded-2xl border-4 border-white shadow-inner overflow-hidden">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: `${(bossHp / currentInitialBossHp) * 100}%` }}
                className="h-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400"
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="w-full lg:flex-1 max-w-3xl relative">
          <motion.div 
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[3rem] shadow-xl p-8 md:p-12 border-4 border-white relative overflow-hidden"
          >
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-400" />
          
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              {currentQuestion.topic}
            </span>
            <span className="text-gray-300 font-bold"># {currentIdx + 1}</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold text-gray-700 mb-10 leading-relaxed">
            {currentQuestion.question}
          </h3>

          {currentQuestion.type === 'text' ? (
            <div className="space-y-6">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && userInput.trim() && handleAnswer(-1)}
                placeholder="請輸入答案..."
                disabled={!!feedback}
                className="w-full p-6 rounded-3xl border-4 border-blue-100 focus:border-blue-400 outline-none text-2xl font-bold text-blue-700 placeholder:text-gray-300 transition-all"
                autoFocus
              />
              <button
                onClick={() => handleAnswer(-1)}
                disabled={!!feedback || !userInput.trim()}
                className="w-full py-6 bg-blue-500 text-white text-2xl font-black rounded-3xl shadow-lg hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交答案
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={!!feedback}
                  className={`group relative p-6 rounded-3xl text-left text-lg font-bold transition-all duration-200 transform active:scale-95 border-b-4
                    ${feedback 
                      ? i === currentQuestion.answerIndex 
                        ? 'bg-green-400 border-green-600 text-white' 
                        : 'bg-gray-100 border-gray-200 text-gray-400 opacity-50'
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black
                      ${feedback && i === currentQuestion.answerIndex ? 'bg-white text-green-500' : 'bg-white/50 text-blue-400'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Skill Confirmation Modal */}
      <AnimatePresence>
        {showSkillConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] max-w-md w-full p-10 shadow-2xl border-8 border-blue-50 relative text-center"
            >
              <div className={`w-24 h-24 mx-auto mb-6 p-4 rounded-3xl ${jobInfo?.bgColor} ${jobInfo?.accentColor} shadow-inner flex items-center justify-center`}>
                {jobInfo?.icon && React.cloneElement(jobInfo.icon as React.ReactElement, { className: "w-16 h-16 object-contain" })}
              </div>
              
              <h3 className="text-3xl font-black text-gray-800 mb-2">發動特殊技能？</h3>
              <p className={`text-xl font-bold mb-6 ${jobInfo?.accentColor}`}>
                {jobInfo?.skillName}：{jobInfo?.skillDescription}
              </p>
              
              <div className="bg-gray-50 p-4 rounded-2xl mb-8 text-gray-500 font-bold">
                每場戰鬥只能使用一次，現在要發動嗎？
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSkipSkill}
                  className="py-4 bg-gray-100 text-gray-400 text-xl font-black rounded-full hover:bg-gray-200 transition-all"
                >
                  先不用
                </button>
                <button
                  onClick={handleUseSkill}
                  className={`py-4 text-white text-xl font-black rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 ${
                    jobInfo?.id === 'knight' ? 'bg-blue-500' :
                    jobInfo?.id === 'fairy' ? 'bg-pink-500' :
                    jobInfo?.id === 'healer' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}
                >
                  發動技能！
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modals */}
        <AnimatePresence>
          {waitingForOthers && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-[3rem]"
            >
              <div className="flex gap-2 mb-4">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-3 h-3 bg-blue-500 rounded-full" />
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-3 h-3 bg-blue-500 rounded-full" />
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-3 h-3 bg-blue-500 rounded-full" />
              </div>
              <p className="text-blue-600 font-black tracking-widest animate-pulse">等待隊友投票中...</p>
              <p className="text-gray-400 text-xs mt-2 uppercase font-bold">Waiting for Guild Members</p>
            </motion.div>
          )}

          {feedback?.type === 'correct' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              <div className="bg-green-500 text-white px-12 py-6 rounded-full shadow-2xl flex items-center gap-4">
                <Trophy className="w-10 h-10 animate-bounce" />
                <span className="text-3xl font-black tracking-widest">完美打擊！</span>
              </div>
            </motion.div>
          )}

          {feedback?.type === 'wrong' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ y: 50, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                className="bg-white max-w-md w-full rounded-[3rem] p-8 shadow-2xl border-8 border-pink-100 text-center"
              >
                <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Skull className="w-10 h-10 text-pink-400" />
                </div>
                <h4 className="text-2xl font-black text-gray-700 mb-4">哎呀！被反擊了</h4>
                <div className="bg-gray-50 p-6 rounded-3xl mb-8 text-left border-2 border-gray-100">
                  <p className="text-gray-500 font-medium leading-relaxed">
                    <span className="text-pink-500 font-black">💡 科學小知識：</span><br />
                    {feedback.explanation}
                  </p>
                </div>
                <button
                  onClick={handleConfirmWrong}
                  className="w-full py-5 bg-gradient-to-r from-pink-400 to-orange-400 text-white text-xl font-black rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  我知道了！
                </button>
              </motion.div>
            </motion.div>
          )}

          {feedback?.type === 'timeout' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ y: 50, scale: 0.9 }}
                animate={{ y: 0, scale: 1 }}
                className="bg-white max-w-md w-full rounded-[3rem] p-8 shadow-2xl border-8 border-red-100 text-center"
              >
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Timer className="w-10 h-10 text-red-400 animate-pulse" />
                </div>
                <h4 className="text-2xl font-black text-gray-700 mb-4">時間耗盡！</h4>
                <p className="text-red-500 font-bold mb-6">Boss 趁機發動了猛烈攻擊！</p>
                <div className="bg-gray-50 p-6 rounded-3xl mb-8 text-left border-2 border-gray-100">
                  <p className="text-gray-500 font-medium leading-relaxed">
                    <span className="text-red-500 font-black">💡 複習重點：</span><br />
                    {feedback.explanation}
                  </p>
                </div>
                <button
                  onClick={handleConfirmWrong}
                  className="w-full py-5 bg-gradient-to-r from-red-400 to-orange-400 text-white text-xl font-black rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  下次會快一點！
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- CSS Drawn Stone Golem ---

function StoneGolem({ isHurt, isDefeated }: { isHurt: boolean, isDefeated: boolean }) {
  return (
    <motion.div 
      animate={isHurt ? { 
        x: [0, -10, 10, -10, 10, 0],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
      } : isDefeated ? {
        y: 100,
        opacity: 0,
        rotate: 45
      } : {
        y: [0, -10, 0]
      }}
      transition={isHurt ? { duration: 0.4 } : isDefeated ? { duration: 1 } : { repeat: Infinity, duration: 3 }}
      className="w-48 h-48 md:w-64 md:h-64 relative"
    >
      {/* Body */}
      <div className="absolute inset-0 bg-gray-400 rounded-[3rem] shadow-xl border-b-8 border-gray-500 overflow-hidden">
        {/* Stone Texture */}
        <div className="absolute top-4 left-4 w-8 h-8 bg-gray-500/20 rounded-full" />
        <div className="absolute bottom-8 right-4 w-12 h-12 bg-gray-500/20 rounded-full" />
      </div>
      
      {/* Armor Plates */}
      <div className="absolute -top-4 -left-4 w-20 h-20 bg-gray-500 rounded-2xl rotate-12 border-b-4 border-gray-600 shadow-lg" />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-gray-500 rounded-2xl -rotate-12 border-b-4 border-gray-600 shadow-lg" />
      
      {/* Eyes */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full flex justify-center gap-8">
        <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]" 
          />
        </div>
        <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]" 
          />
        </div>
      </div>

      {/* Mouth/Crack */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-800 rounded-full opacity-50" />
      
      {/* Arms */}
      <div className="absolute top-1/2 -left-12 w-16 h-24 bg-gray-400 rounded-3xl border-b-4 border-gray-500 shadow-lg" />
      <div className="absolute top-1/2 -right-12 w-16 h-24 bg-gray-400 rounded-3xl border-b-4 border-gray-500 shadow-lg" />
    </motion.div>
  );
}

function WaterSpirit({ isHurt, isDefeated }: { isHurt: boolean, isDefeated: boolean }) {
  return (
    <motion.div 
      animate={isHurt ? { 
        x: [0, -10, 10, -10, 10, 0],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
      } : isDefeated ? {
        y: 100,
        opacity: 0,
        scale: 0.5
      } : {
        y: [0, -15, 0],
        scale: [1, 1.05, 1]
      }}
      transition={isHurt ? { duration: 0.4 } : isDefeated ? { duration: 1 } : { repeat: Infinity, duration: 2.5 }}
      className="w-48 h-48 md:w-64 md:h-64 relative flex items-center justify-center"
    >
      {/* Water Body */}
      <div className="absolute inset-0 bg-blue-400/60 rounded-full blur-xl animate-pulse" />
      <div className="w-40 h-40 md:w-56 md:h-56 bg-blue-400 rounded-full relative overflow-hidden border-4 border-white/30 shadow-2xl">
        {/* Bubbles */}
        <motion.div 
          animate={{ y: [-20, -100], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-0 left-1/4 w-4 h-4 bg-white/40 rounded-full" 
        />
        <motion.div 
          animate={{ y: [-10, -80], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
          className="absolute bottom-0 right-1/3 w-6 h-6 bg-white/30 rounded-full" 
        />
      </div>

      {/* Eyes */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center gap-10">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
          <div className="w-4 h-4 bg-blue-600 rounded-full" />
        </div>
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
          <div className="w-4 h-4 bg-blue-600 rounded-full" />
        </div>
      </div>

      {/* Crown */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">👑</div>
    </motion.div>
  );
}

function AdminLogin({ onUnlock, onBack }: { onUnlock: () => void, onBack: () => void, key?: string }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '8888') {
      onUnlock();
    } else {
      setError('結界發出紅光：密碼錯誤，請退下！');
      setPassword('');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]"
    >
      <div className="w-full max-w-md bg-slate-900 rounded-[3rem] p-10 border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 relative overflow-hidden">
        {/* Magic circle background effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-purple-500/10 rounded-full animate-pulse" />
        
        <div className="text-center mb-10 relative">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/50">
            <Lock className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter mb-2">公會會長專屬密碼</h1>
          <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Restricted Area • Admin Only</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6 relative">
          <div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入解鎖密碼"
              className="w-full px-6 py-5 bg-slate-800 border-2 border-purple-500/20 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-2xl outline-none transition-all font-bold text-white text-center tracking-[1em] placeholder:tracking-normal placeholder:text-slate-600"
            />
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs font-bold mt-4 text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-3xl shadow-lg shadow-purple-900/50 hover:shadow-purple-500/30 hover:-translate-y-1 active:scale-95 transition-all"
            >
              解除結界
            </button>
            <button 
              type="button"
              onClick={onBack}
              className="w-full py-4 text-slate-500 font-bold text-sm hover:text-slate-300 transition-colors"
            >
              返回大廳
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// --- Teacher Dashboard Component ---

function TeacherDashboard() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleDeleteRoom = async (roomId: string) => {
    try {
      setDeletingId(roomId);
      const roomRef = ref(rtdb, `rooms/${roomId}`);
      await remove(roomRef);
      setConfirmingId(null);
    } catch (error) {
      console.error("Delete failed:", error);
      // We'll show an error state instead of alert
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const roomsRef = ref(rtdb, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Object to Array
        const roomList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setRooms(roomList);
      } else {
        setRooms([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-12"
    >
      {/* Header: Crystal Ball Monitoring Center */}
      <header className="max-w-7xl mx-auto mb-12 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -z-10" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-500/20 rounded-full -z-10"
        />
        
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 mb-4">
          水晶球監控中心
        </h1>
        <p className="text-slate-500 font-mono tracking-widest uppercase text-xs">Teacher Dashboard • Real-time Monitoring</p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-400 font-bold animate-pulse">正在連結魔法陣...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="max-w-md mx-auto bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-[2rem] p-12 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-6" />
          <p className="text-slate-400 font-bold text-xl">目前沒有小隊正在冒險中</p>
          <p className="text-slate-500 text-sm mt-2">請等待冒險者們加入房間...</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room) => {
            const isCritical = room.teamHp < 1;
            const jobInfo = JOBS.find(j => j.id === room.selectedJob);
            
            return (
              <motion.div
                key={room.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative bg-slate-800/80 backdrop-blur-md rounded-[2.5rem] p-8 border-2 transition-all duration-500 shadow-xl
                  ${isCritical ? 'border-red-500/50 shadow-red-500/10 animate-pulse' : 'border-slate-700/50 hover:border-blue-500/50'}
                `}
              >
                {/* Team Code Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">{room.id}</h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest
                      ${room.status === 'playing' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}
                    `}>
                      {room.status === 'playing' ? '冒險中' : '已斷線'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {confirmingId === room.id ? (
                      <div className="flex items-center gap-2 bg-red-500/20 p-1 rounded-xl border border-red-500/30">
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          disabled={deletingId === room.id}
                          className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg hover:bg-red-600 transition-all"
                        >
                          {deletingId === room.id ? '刪除中...' : '確定'}
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-black rounded-lg hover:bg-slate-600 transition-all"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(room.id)}
                        className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="刪除此小隊資料"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <div className={`p-3 rounded-2xl bg-slate-700/50 ${jobInfo?.accentColor}`}>
                      {jobInfo?.icon}
                    </div>
                  </div>
                </div>

                {/* Player Info */}
                <div className="space-y-4 mb-8">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                      <Users className="w-3 h-3" />
                      小隊成員
                    </div>
                    {room.players ? Object.entries(room.players).map(([name, info]: [string, any]) => {
                      const pJob = JOBS.find(j => j.id === info.job);
                      const isActive = Date.now() - info.lastUpdate < 60000;
                      return (
                        <div key={name} className={`flex items-center justify-between p-2 rounded-xl border ${isActive ? 'bg-slate-700/30 border-slate-600/50' : 'bg-slate-900/30 border-transparent opacity-40'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{pJob?.icon}</span>
                            <span className={`text-sm font-bold ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{name}</span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-500">{pJob?.name}</span>
                        </div>
                      );
                    }) : (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-blue-400" />
                        <p className="text-lg font-bold text-slate-200">
                          {room.playerName} <span className="text-sm font-medium text-slate-500">({jobInfo?.name})</span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <p className="text-sm font-bold text-slate-400">
                      戰況進度：<span className="text-slate-200">第 {room.currentIdx + 1} 題</span>
                    </p>
                  </div>
                </div>

                {/* Boss Status */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Boss HP</span>
                    <span className="text-[10px] font-mono text-slate-500">{room.bossHp} / {INITIAL_BOSS_HP}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(room.bossHp / INITIAL_BOSS_HP) * 100}%` }}
                      className="h-full bg-gradient-to-r from-red-500 to-orange-400"
                    />
                  </div>
                </div>

                {/* Team HP (Hearts) */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">小隊生命</span>
                  <div className="flex gap-1">
                    {[...Array(INITIAL_TEAM_HP)].map((_, i) => (
                      <Heart 
                        key={i} 
                        className={`w-5 h-5 ${i < room.teamHp ? 'text-pink-500 fill-pink-500' : 'text-slate-700 fill-slate-800'}`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Warning Glow for Critical State */}
                {isCritical && (
                  <div className="absolute inset-0 rounded-[2.5rem] ring-4 ring-red-500/20 pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center">
        <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
          Crystal Ball Monitoring System v1.0.4 • Connected to Magic Grid
        </p>
      </footer>
    </motion.div>
  );
}

// --- End Screen (Victory / GameOver) ---

function VictoryScreen({ teamName, playerName, job, dungeonId, clearedDungeons, onReturnToMap }: { teamName: string, playerName: string, job: string, dungeonId: string, clearedDungeons: string[], onReturnToMap: () => void, key?: string }) {
  const [showBestiary, setShowBestiary] = useState(false);
  const loot = dungeonId === 'force' 
    ? { icon: '🛡️', name: '巨像的動力核心 x 1' }
    : { icon: '💧', name: '波波的純淨水滴 x 1' };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15)_0%,transparent_70%)]" />

      {/* Falling Stars/Coins */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute animate-fall text-2xl"
            style={{ 
              left: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 5}s`,
              // @ts-ignore
              '--fall-duration': `${3 + Math.random() * 4}s`
            }}
          >
            {i % 2 === 0 ? '⭐' : '💰'}
          </div>
        ))}
      </div>

      <div className="relative flex flex-col items-center max-w-2xl w-full p-6">
        {/* Banner - Animated Pop-up and Disappear */}
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 0 }}
          animate={{ 
            scale: [0, 1.5, 1, 1, 0.5], 
            opacity: [0, 1, 1, 1, 0],
            y: [0, 0, 0, 0, -100]
          }}
          transition={{ 
            duration: 3, 
            times: [0, 0.1, 0.2, 0.8, 1],
            ease: "easeOut"
          }}
          className="absolute top-1/2 -translate-y-1/2 z-50 text-center pointer-events-none w-full"
        >
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 drop-shadow-[0_10px_30px_rgba(255,215,0,0.8)] filter drop-shadow(0 0 20px rgba(255,255,255,0.5))">
            討伐成功！
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3, times: [0, 0.2, 0.8, 1] }}
            className="text-2xl md:text-3xl font-black text-yellow-500 tracking-[0.4em] uppercase mt-4 drop-shadow-md"
          >
            DUTY COMPLETE
          </motion.p>
        </motion.div>

        {/* Parchment Card - Appears after banner */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 2.5, duration: 0.8, type: "spring", damping: 15 }}
          className="w-full bg-[#f4e4bc] rounded-[2rem] p-8 md:p-12 border-8 border-yellow-600 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-yellow-700/30 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-yellow-700/30 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-yellow-700/30 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-yellow-700/30 rounded-br-xl" />

          <div className="text-center space-y-8">
            <div className="space-y-2">
              <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-black text-yellow-900">冒險者表揚</h2>
              <p className="text-lg md:text-xl font-bold text-yellow-800/80 leading-relaxed">
                恭喜！<span className="text-yellow-900 underline decoration-yellow-600/30 underline-offset-4">{job} {playerName}</span> 與 <span className="text-yellow-900">{teamName}</span> 的夥伴們成功生還！
              </p>
            </div>

            <div className="h-px bg-yellow-700/20 w-full" />

            <div className="space-y-4">
              <h3 className="text-sm font-black text-yellow-700 uppercase tracking-widest">戰利品展示</h3>
              <div className="bg-white/40 rounded-2xl p-4 border-2 border-yellow-700/10 flex items-center justify-center gap-4 shadow-inner">
                <span className="text-4xl">{loot.icon}</span>
                <span className="text-xl font-black text-yellow-900">{loot.name}</span>
              </div>
            </div>

            <div className="bg-yellow-900/5 rounded-2xl p-4 border border-yellow-700/10">
              <p className="text-lg font-black text-yellow-800 flex items-center justify-center gap-2">
                獲得 <span className="text-yellow-600">冒險者公會榮譽徽章 500 枚！</span> 🌟
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => setShowBestiary(true)}
                className="flex-1 py-5 bg-white text-yellow-700 text-xl font-black rounded-full shadow-lg border-2 border-yellow-600/20 hover:bg-yellow-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Book className="w-6 h-6" />
                重點複習
              </button>
              <button
                onClick={onReturnToMap}
                className="flex-[2] py-5 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-white text-xl font-black rounded-full shadow-[0_10px_20px_rgba(202,138,4,0.3)] hover:shadow-[0_15px_30px_rgba(202,138,4,0.5)] hover:-translate-y-1 transition-all active:scale-95 border-b-4 border-yellow-700"
              >
                帶著榮耀返回世界地圖
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <BestiaryModal 
        isOpen={showBestiary} 
        onClose={() => setShowBestiary(false)} 
        clearedDungeons={clearedDungeons} 
      />
    </motion.div>
  );
}

function EndScreen({ result, onRestart }: { result: 'victory' | 'gameover', onRestart: () => void, key?: string }) {
  const isVictory = result === 'victory';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-6 bg-white"
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0.5, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="mb-10"
        >
          {isVictory ? (
            <div className="relative inline-block">
              <Trophy className="w-40 h-40 text-yellow-400 drop-shadow-2xl" />
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"
              />
            </div>
          ) : (
            <Skull className="w-40 h-40 text-gray-300 drop-shadow-2xl" />
          )}
        </motion.div>

        <h1 className={`text-5xl font-black mb-4 tracking-tight ${isVictory ? 'text-yellow-500' : 'text-gray-500'}`}>
          {isVictory ? '大勝利！' : '冒險結束'}
        </h1>
        
        <p className="text-xl font-bold text-gray-400 mb-12">
          {isVictory ? '你成功擊敗了巨石像，守護了公會！' : '別灰心，下次一定能成功的！'}
        </p>

        <button
          onClick={onRestart}
          className={`w-full py-6 rounded-full text-2xl font-black tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4
            ${isVictory ? 'bg-yellow-400 text-white hover:bg-yellow-500' : 'bg-gray-800 text-white hover:bg-gray-900'}`}
        >
          <RefreshCw className="w-8 h-8" />
          再玩一次
        </button>
      </div>
    </motion.div>
  );
}

// --- Bestiary Modal Component ---

function BestiaryModal({ isOpen, onClose, clearedDungeons }: { isOpen: boolean, onClose: () => void, clearedDungeons: string[] }) {
  const monsters = [
    {
      id: 'force',
      name: '重甲石巨像',
      attribute: '生活中的力',
      icon: '🗿',
      info: (
        <>
          力具有<span className="text-red-600 font-bold">方向和大小</span>，可用箭頭表示（長度=大小，指向=方向）。牠的重甲極厚，必須利用『<span className="text-red-600 font-bold">固體、液體或氣體</span>』能傳送動力的特性，操作機關來擊破。注意：受力變形的物品中，像橡皮筋這類具備<span className="text-red-600 font-bold">彈性</span>的物質才能恢復原狀！
        </>
      )
    },
    {
      id: 'water',
      name: '深淵水精靈王・波波',
      attribute: '水的奇妙現象',
      icon: '💧',
      info: (
        <>
          體內水壓極高。破解牠的領域必須運用『<span className="text-red-600 font-bold">連通管原理</span>』（無論容器如何傾斜，靜止水面必保持水平）。若要抽乾牠的毒沼，需使用『<span className="text-red-600 font-bold">虹吸現象</span>』：管內必須先裝滿水，且出水口必須<span className="text-red-600 font-bold">低於</span>水箱液面才能成功引水！
        </>
      )
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#fdf6e3] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl border-8 border-[#8b5e3c] relative p-8 md:p-12"
            style={{
              backgroundImage: 'radial-gradient(#d4a373 0.5px, transparent 0.5px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-[#8b5e3c] text-white rounded-full hover:scale-110 transition-transform shadow-lg z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <header className="text-center mb-12 border-b-4 border-[#8b5e3c]/20 pb-8">
              <div className="flex items-center justify-center gap-4 mb-2">
                <Book className="w-10 h-10 text-[#8b5e3c]" />
                <h2 className="text-4xl font-black text-[#5d3a1a] tracking-tighter">冒險者圖鑑</h2>
              </div>
              <p className="text-[#8b5e3c] font-bold uppercase tracking-widest text-xs">Guild Bestiary & Knowledge Base</p>
            </header>

            <div className="grid grid-cols-1 gap-12">
              {monsters.map((monster) => {
                const isCleared = clearedDungeons.includes(monster.id);
                
                return (
                  <div key={monster.id} className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Monster Icon */}
                    <div className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl flex items-center justify-center text-6xl shadow-xl border-4 border-[#8b5e3c]/30 bg-white/50 shrink-0 ${isCleared ? '' : 'brightness-0 grayscale opacity-30'}`}>
                      {monster.icon}
                    </div>

                    {/* Monster Details */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-3xl font-black text-[#5d3a1a]">
                          {isCleared ? monster.name : '？？？'}
                        </h3>
                        {isCleared && (
                          <span className="px-4 py-1 bg-[#8b5e3c] text-[#fdf6e3] rounded-full text-xs font-black tracking-widest uppercase">
                            {monster.attribute}
                          </span>
                        )}
                      </div>

                      <div className="bg-white/40 rounded-2xl p-6 border-2 border-[#8b5e3c]/10 shadow-inner min-h-[100px]">
                        {isCleared ? (
                          <div className="text-[#5d3a1a] font-bold leading-relaxed text-lg">
                            <span className="text-[#8b5e3c] block mb-2 font-black">【弱點情報與複習重點】</span>
                            {monster.info}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full py-4 text-[#8b5e3c]/50 italic font-bold">
                            <Lock className="w-8 h-8 mb-2" />
                            尚未討伐，情報不明。請前往世界地圖探索。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="mt-12 pt-8 border-t-4 border-[#8b5e3c]/20 text-center">
              <p className="text-[#8b5e3c]/60 text-xs font-bold italic">
                「知識就是最強大的武器。」—— 冒險者公會圖書館
              </p>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- JobSelectionModal Component ---
function JobSelectionModal({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (jobId: string) => void }) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);

  const selectedJob = JOBS.find(j => j.id === selectedJobId);
  const viewingJob = JOBS.find(j => j.id === viewingJobId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-[3rem] max-w-3xl w-full p-8 md:p-12 relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-gray-100 text-gray-500 rounded-full hover:scale-110 transition-transform shadow-sm z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <header className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-800 mb-2">重新選擇你的職業</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Choose Your New Destiny</p>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {JOBS.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setViewingJobId(job.id)}
                  className={`flex flex-col items-center p-5 rounded-3xl border-4 transition-all duration-300 hover:-translate-y-2 ${
                    selectedJobId === job.id 
                      ? `${job.borderColor} ${job.bgColor} shadow-xl scale-105` 
                      : 'border-transparent bg-gray-50 text-gray-400 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'
                  }`}
                >
                  <div className={`mb-3 p-3 rounded-2xl ${selectedJobId === job.id ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                    {job.icon}
                  </div>
                  <span className={`font-black text-lg ${selectedJobId === job.id ? job.accentColor : ''}`}>{job.name}</span>
                </button>
              ))}
            </div>

            {selectedJob && (
              <div className="flex justify-center mb-10">
                <motion.div
                  key={selectedJob.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100 flex items-center gap-4"
                >
                  <MessageCircle className={`w-6 h-6 ${selectedJob.accentColor}`} />
                  <p className="text-lg font-bold text-gray-700 italic">
                    {selectedJob.quote}
                  </p>
                </motion.div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-gray-100 text-gray-400 text-xl font-black rounded-full hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => selectedJobId && onSelect(selectedJobId)}
                disabled={!selectedJobId}
                className={`flex-1 py-4 rounded-full text-xl font-black text-white transition-all active:scale-95 shadow-lg ${
                  selectedJobId ? 'bg-gradient-to-r from-pink-500 to-orange-500 shadow-pink-200' : 'bg-gray-200 cursor-not-allowed'
                }`}
              >
                確認轉換
              </button>
            </div>

            {/* Job Detail Overlay */}
            <AnimatePresence>
              {viewingJob && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-10 bg-white p-10 flex flex-col items-center text-center space-y-6"
                >
                  <button 
                    onClick={() => setViewingJobId(null)}
                    className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className={`p-8 rounded-[2.5rem] ${viewingJob.bgColor} ${viewingJob.borderColor} border-4 shadow-inner`}>
                    {React.cloneElement(viewingJob.icon as React.ReactElement, { className: "w-24 h-24 object-contain" })}
                  </div>

                  <div>
                    <h2 className={`text-4xl font-black mb-2 ${viewingJob.accentColor}`}>{viewingJob.name}</h2>
                    <p className="text-gray-700 font-bold text-lg leading-relaxed">
                      {viewingJob.description}
                    </p>
                  </div>

                  <div className={`bg-gray-50 p-6 rounded-3xl w-full border-2 border-gray-100 flex items-center gap-3 ${viewingJob.accentColor}`}>
                    <Zap className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-widest">特殊技能：{viewingJob.skillName}</p>
                      <p className="text-sm font-bold opacity-80">{viewingJob.skillDescription}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedJobId(viewingJob.id);
                      setViewingJobId(null);
                    }}
                    className={`w-full py-5 rounded-2xl text-xl font-black text-white transition-all active:scale-95 shadow-lg ${
                      viewingJob.id === 'knight' ? 'bg-blue-500 shadow-blue-200' :
                      viewingJob.id === 'fairy' ? 'bg-pink-500 shadow-pink-200' :
                      viewingJob.id === 'healer' ? 'bg-green-500 shadow-green-200' :
                      'bg-purple-500 shadow-purple-200'
                    }`}
                  >
                    選擇此職業
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Shop Modal Component ---

function ShopModal({ isOpen, onClose, medals, onPurchase }: { isOpen: boolean, onClose: () => void, medals: number, onPurchase: (amount: number, hearts: number, type?: 'heart' | 'job_change' | 'double_medals') => void }) {
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const shopItems = [
    {
      id: 'heart_1',
      name: '生命之泉',
      description: '下次戰鬥初始生命 +1',
      icon: '❤️',
      cost: 300,
      hearts: 1,
      type: 'heart' as const
    },
    {
      id: 'heart_2',
      name: '守護符咒',
      description: '下次戰鬥初始生命 +2',
      icon: '🛡️',
      cost: 500,
      hearts: 2,
      type: 'heart' as const
    },
    {
      id: 'heart_3',
      name: '冒險者便當',
      description: '下次戰鬥初始生命 +3',
      icon: '🍱',
      cost: 700,
      hearts: 3,
      type: 'heart' as const
    },
    {
      id: 'job_change',
      name: '職業轉換書',
      description: '立即重新選擇你的冒險職業',
      icon: '📜',
      cost: 1000,
      hearts: 0,
      type: 'job_change' as const
    },
    {
      id: 'double_medals',
      name: '黃金護身符',
      description: '下次通關獲得的勳章翻倍',
      icon: '✨',
      cost: 1500,
      hearts: 0,
      type: 'double_medals' as const
    }
  ];

  const handlePurchase = (item: typeof shopItems[0]) => {
    onPurchase(item.cost, item.hearts, item.type);
    setPurchaseSuccess(item.name);
    setTimeout(() => setPurchaseSuccess(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl border-8 border-yellow-100 relative p-8 md:p-12 max-h-[90vh] overflow-y-auto"
          >
            {/* Success Notification */}
            <AnimatePresence>
              {purchaseSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-8 py-3 rounded-full font-black shadow-xl flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  成功購買 {purchaseSuccess}！
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 bg-gray-100 text-gray-500 rounded-full hover:scale-110 transition-transform shadow-sm z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <header className="text-center mb-10">
              <div className="flex items-center justify-center gap-4 mb-2">
                <Sparkles className="w-10 h-10 text-yellow-500" />
                <h2 className="text-4xl font-black text-gray-800 tracking-tighter">勳章商店</h2>
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Honor Medal Exchange</p>
              
              <div className="mt-6 inline-flex items-center gap-2 bg-yellow-50 px-6 py-3 rounded-full border-2 border-yellow-200 shadow-sm">
                <span className="text-2xl">🌟</span>
                <span className="text-2xl font-black text-yellow-700">{medals}</span>
                <span className="text-xs font-bold text-yellow-600/60 uppercase tracking-widest ml-1">可用勳章</span>
              </div>
            </header>

            <div className="space-y-4">
              {shopItems.map((item) => {
                const canAfford = medals >= item.cost;
                
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all ${
                      canAfford ? 'bg-white border-gray-100 hover:border-yellow-400 hover:shadow-md' : 'bg-gray-50 border-transparent opacity-60'
                    }`}
                  >
                    <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                      {item.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-800">{item.name}</h3>
                      <p className="text-gray-500 font-bold text-sm">{item.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (canAfford) {
                          handlePurchase(item);
                        }
                      }}
                      disabled={!canAfford}
                      className={`px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                        canAfford 
                          ? 'bg-yellow-400 text-yellow-900 shadow-lg hover:shadow-xl' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {item.cost} 🌟
                    </button>
                  </div>
                );
              })}
            </div>

            <footer className="mt-10 flex flex-col items-center gap-6">
              <p className="text-gray-400 text-xs font-bold italic">
                「勳章是勇氣的證明，也是通往勝利的階梯。」
              </p>
              <button
                onClick={onClose}
                className="px-12 py-4 bg-gray-800 text-white text-xl font-black rounded-full shadow-lg hover:bg-gray-700 transition-all active:scale-95"
              >
                關閉商店
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Guild Certificate Screen Component ---

function GuildCertificateScreen({ teamName, playerName, job, wrongQuestions, clearedDungeons, onRestart }: { teamName: string, playerName: string, job: string, wrongQuestions: any[], clearedDungeons: string[], onRestart: () => void }) {
  const [showBestiary, setShowBestiary] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-indigo-950 p-6 md:p-12 flex flex-col items-center relative overflow-hidden"
    >
      {/* Confetti Simulation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, x: Math.random() * 100 + "%", rotate: 0 }}
            animate={{ 
              y: "110vh", 
              x: (Math.random() * 100 - 10) + "%",
              rotate: 360 
            }}
            transition={{ 
              duration: 3 + Math.random() * 5, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5
            }}
            className="w-3 h-3 rounded-sm opacity-70"
            style={{ backgroundColor: ['#fbbf24', '#f472b6', '#60a5fa', '#34d399'][i % 4] }}
          />
        ))}
      </div>

      <div className="max-w-4xl w-full space-y-12 relative z-10">
        {/* Section 1: Certificate */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-amber-50 rounded-[2rem] p-10 md:p-16 border-[12px] border-yellow-600 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Gold Border Ornament */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-yellow-700/30 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-yellow-700/30 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-yellow-700/30 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-yellow-700/30 rounded-br-xl" />

          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-5xl font-black text-yellow-900 tracking-tighter">
              📜 冒險者公會 結業證書
            </h1>
            
            <div className="h-1 w-32 bg-yellow-700/20 mx-auto" />

            <p className="text-xl md:text-2xl font-bold text-yellow-800 leading-loose text-justify md:text-center">
              特此證明 <span className="text-yellow-900 underline decoration-yellow-600/50 underline-offset-8">{job} {playerName}</span> 帶領 <span className="text-yellow-900 font-black">{teamName}</span> 的夥伴們，以無比的勇氣與科學智慧，成功討伐『巨石遺跡』與『幽暗水脈』的所有魔物，守護了世界的和平！
            </p>

            <div className="flex justify-end pt-8">
              <div className="relative">
                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-4 border-red-700 rotate-12">
                  <span className="text-white font-black text-xs text-center leading-tight">
                    公會長<br/>核准
                  </span>
                </div>
                <div className="absolute -bottom-2 right-4 w-4 h-6 bg-red-700 rounded-full rotate-12" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Review */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 md:p-12 border-2 border-white/20"
        >
          <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
            <Sword className="w-8 h-8 text-yellow-400" />
            戰鬥日誌覆盤：公會導師的叮嚀
          </h2>

          {wrongQuestions.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <Trophy className="w-32 h-32 text-yellow-400 mx-auto animate-bounce" />
              <p className="text-2xl font-black text-yellow-100">
                太神啦！無傷通關！你的科學魔法已經達到巔峰境界！
              </p>
              <button
                onClick={() => setShowBestiary(true)}
                className="py-4 px-8 bg-white/20 text-white text-xl font-black rounded-full border-2 border-white/30 hover:bg-white/30 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                <Book className="w-6 h-6" />
                重點複習
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {wrongQuestions.map((q, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-xl border-l-8 border-pink-400">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {q.topic}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-4">{q.question}</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-red-500 font-bold text-sm flex items-center gap-2">
                      ❌ 你的選擇：{q.selectedWrong}
                    </p>
                    <p className="text-green-600 font-bold text-sm flex items-center gap-2">
                      ✅ 正確戰術：{q.correctAnswer}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-blue-700 text-xs leading-relaxed">
                      <span className="font-black">導師筆記：</span>{q.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Section 3: Action */}
        <div className="flex justify-center pb-12">
          <button
            onClick={onRestart}
            className="group relative px-12 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-2xl font-black rounded-full shadow-[0_10px_30px_rgba(245,158,11,0.4)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.6)] hover:-translate-y-2 transition-all active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center gap-3">
              領取證書並返回大廳
              <RefreshCw className="w-6 h-6" />
            </span>
          </button>
        </div>
      </div>

      <BestiaryModal 
        isOpen={showBestiary} 
        onClose={() => setShowBestiary(false)} 
        clearedDungeons={clearedDungeons} 
      />
    </motion.div>
  );
}
