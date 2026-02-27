export type Locale = 'zh' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  zh: {
    // Main Menu
    'app.subtitle': '提升你的鼠标控制、甩枪速度和追踪精度。',
    'mode.gridshot.desc': '命中网格上出现的3个目标，经典甩枪训练。',
    'mode.spidershot.desc': '从中心目标甩向随机外围目标再返回。',
    'mode.microflick.desc': '小目标出现在屏幕中心附近，训练精准度。',
    'mode.tracking.desc': '追踪移动目标，按住鼠标左键得分。',
    'summary.size': '大小',
    'summary.speed': '速度',
    'summary.sec': '秒',

    // Settings
    'settings.title': '游戏设置',
    'settings.reset': '重置默认',
    'settings.section.game': '游戏参数',
    'settings.section.personal': '个性化',
    'settings.duration': '训练时间',
    'settings.targetSize': '目标大小',
    'settings.speed': '目标速度',
    'settings.shape': '目标形状',
    'settings.cursor': '光标样式',
    'settings.color': '主题配色',
    'settings.background': '背景主题',
    'settings.language': '语言',

    'size.small': '小',
    'size.medium': '中',
    'size.large': '大',
    'speed.slow': '慢速',
    'speed.normal': '正常',
    'speed.fast': '快速',

    'shape.circle': '圆形',
    'shape.diamond': '菱形',
    'shape.star': '星形',
    'shape.hexagon': '六边形',
    'shape.triangle': '三角形',

    'cursor.crosshair': '十字线',
    'cursor.dot': '圆点',
    'cursor.ring': '圆环',
    'cursor.precise': '精确',

    'color.cyan': '青',
    'color.red': '红',
    'color.green': '绿',
    'color.purple': '紫',
    'color.orange': '橙',

    'bg.dark': '暗黑',
    'bg.dark.desc': '纯暗色背景',
    'bg.grid': '网格',
    'bg.grid.desc': '暗色网格线',
    'bg.gradient': '渐变',
    'bg.gradient.desc': '动态渐变',
    'bg.stars': '星空',
    'bg.stars.desc': '闪烁星点',

    // Results
    'results.title': 'RESULTS',
    'results.score': '最终得分',
    'results.accuracy': '精准度',
    'results.hitsMisses': '命中 / 失误',
    'results.duration': '训练时长',
    'results.retry': '再来一局',
    'results.menu': '主菜单',
    'results.star': '觉得好玩？给个 Star 支持一下吧',
  },

  en: {
    'app.subtitle': 'Improve your mouse control, flick speed, and tracking precision.',
    'mode.gridshot.desc': 'Hit 3 targets on a grid. Classic flick training.',
    'mode.spidershot.desc': 'Flick from center target to a random outer target and back.',
    'mode.microflick.desc': 'Small targets appear near the center. Train your precision.',
    'mode.tracking.desc': 'Track a moving target. Hold click to score.',
    'summary.size': 'Size',
    'summary.speed': 'Speed',
    'summary.sec': 's',

    'settings.title': 'Settings',
    'settings.reset': 'Reset',
    'settings.section.game': 'Game',
    'settings.section.personal': 'Personalization',
    'settings.duration': 'Duration',
    'settings.targetSize': 'Target Size',
    'settings.speed': 'Target Speed',
    'settings.shape': 'Target Shape',
    'settings.cursor': 'Cursor Style',
    'settings.color': 'Color Theme',
    'settings.background': 'Background',
    'settings.language': 'Language',

    'size.small': 'S',
    'size.medium': 'M',
    'size.large': 'L',
    'speed.slow': 'Slow',
    'speed.normal': 'Normal',
    'speed.fast': 'Fast',

    'shape.circle': 'Circle',
    'shape.diamond': 'Diamond',
    'shape.star': 'Star',
    'shape.hexagon': 'Hexagon',
    'shape.triangle': 'Triangle',

    'cursor.crosshair': 'Crosshair',
    'cursor.dot': 'Dot',
    'cursor.ring': 'Ring',
    'cursor.precise': 'Precise',

    'color.cyan': 'Cyan',
    'color.red': 'Red',
    'color.green': 'Green',
    'color.purple': 'Purple',
    'color.orange': 'Orange',

    'bg.dark': 'Dark',
    'bg.dark.desc': 'Solid dark background',
    'bg.grid': 'Grid',
    'bg.grid.desc': 'Dark grid lines',
    'bg.gradient': 'Gradient',
    'bg.gradient.desc': 'Animated gradient',
    'bg.stars': 'Stars',
    'bg.stars.desc': 'Twinkling stars',

    'results.title': 'RESULTS',
    'results.score': 'Final Score',
    'results.accuracy': 'Accuracy',
    'results.hitsMisses': 'Hits / Misses',
    'results.duration': 'Duration',
    'results.retry': 'Play Again',
    'results.menu': 'Main Menu',
    'results.star': 'Like it? Give us a Star on GitHub!',
  },
};

export function t(key: string, locale: Locale): string {
  return translations[locale]?.[key] ?? key;
}
