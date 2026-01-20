import React from 'react';

// 消费类别图标映射
// 根据类别名称返回对应的 iconfont 图标类名
export const getCategoryIcon = (categoryName: string): string => {
  const iconMap: Record<string, string> = {
    // 餐饮相关
    '订阅': 'icon-icon_xiaobianfudaoguaxiuxi',
    '餐饮': 'icon-icon_daxiongmaoduanzuomingxiang',
    '交通': 'icon-icon_xiaohaibaowanqiu',
    '购物': 'icon-icon_xiaojiwanhuaban',
    '娱乐': 'icon-icon_xiaohulikanhua',
    '医疗': 'icon-icon_xiaoniaopaozao',
    '教育': 'icon-icon_xiaomaomiguanyu',
    '住房': 'icon-icon_xiaociweibaocaomei',
    '其他': 'icon-icon_xiaowoniu',
  };
  
  // 精确匹配
  if (iconMap[categoryName]) {
    return iconMap[categoryName];
  }
  
  // 模糊匹配（包含关键词）
  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return icon;
    }
  }
  
  // 默认图标
  return 'icon-icon_xiaowuguidanjita';
};

// 获取图标显示组件（使用 iconfont symbol）
export const CategoryIcon: React.FC<{ categoryName: string; size?: number }> = ({ categoryName, size = 24 }) => {
  const iconClass = getCategoryIcon(categoryName);
  return React.createElement(
    'svg',
    {
      className: 'icon',
      style: { width: `${size}px`, height: `${size}px` },
      'aria-hidden': 'true'
    },
    React.createElement('use', { xlinkHref: `#${iconClass}` })
  );
};
