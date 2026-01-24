
import { Staff, PrizeType, PrizeConfig } from './types';

export const STAFF_LIST: Staff[] = [
  { id: 'KF001', name: '张伟', department: '应用开发科' }, { id: 'KF002', name: '王芳', department: '基础设施科' },
  { id: 'KF003', name: '李静', department: '数据管理科' }, { id: 'KF004', name: '刘洋', department: '信息安全科' },
  { id: 'KF005', name: '陈刚', department: '流程变革科' }, { id: 'KF006', name: '赵艳', department: '综合管理科' },
  { id: 'KF007', name: '黄勇', department: '运维服务科' }, { id: 'KF008', name: '周杰', department: '数字化创新科' },
  { id: 'KF009', name: '徐林', department: '应用开发科' }, { id: 'KF010', name: '孙博', department: '基础设施科' },
  { id: 'KF011', name: '马腾', department: '数据管理科' }, { id: 'KF012', name: '胡可', department: '信息安全科' },
  { id: 'KF013', name: '郭峰', department: '流程变革科' }, { id: 'KF014', name: '林青', department: '综合管理科' },
  { id: 'KF015', name: '何芳', department: '运维服务科' }, { id: 'KF016', name: '高强', department: '数字化创新科' },
  { id: 'KF017', name: '罗娜', department: '应用开发科' }, { id: 'KF018', name: '郑开', department: '基础设施科' },
  { id: 'KF019', name: '谢红', department: '数据管理科' }, { id: 'KF020', name: '韩冰', department: '信息安全科' },
  { id: 'KF021', name: '唐磊', department: '流程变革科' }, { id: 'KF022', name: '冯志', department: '综合管理科' },
  { id: 'KF023', name: '于波', department: '运维服务科' }, { id: 'KF024', name: '董燕', department: '数字化创新科' },
  { id: 'KF025', name: '潘亮', department: '应用开发科' }, { id: 'KF026', name: '田芳', department: '基础设施科' },
  { id: 'KF027', name: '姜华', department: '数据管理科' }, { id: 'KF028', name: '范玮', department: '信息安全科' },
  { id: 'KF029', name: '江琴', department: '流程变革科' }, { id: 'KF030', name: '孟建', department: '综合管理科' },
  { id: 'KF031', name: '白云', department: '运维服务科' }, { id: 'KF032', name: '龙飞', department: '数字化创新科' },
  { id: 'KF033', name: '万科', department: '应用开发科' }, { id: 'KF034', name: '邹明', department: '基础设施科' },
  { id: 'KF035', name: '熊博', department: '数据管理科' }, { id: 'KF036', name: '彭德', department: '信息安全科' },
  { id: 'KF037', name: '崔悦', department: '流程变革科' }, { id: 'KF038', name: '孔繁', department: '综合管理科' },
  { id: 'KF039', name: '任豪', department: '运维服务科' }, { id: 'KF040', name: '廖平', department: '数字化创新科' },
  { id: 'KF041', name: '史强', department: '应用开发科' }, { id: 'KF042', name: '段誉', department: '基础设施科' },
  { id: 'KF043', name: '贾宝', department: '数据管理科' }, { id: 'KF044', name: '武空', department: '信息安全科' },
  { id: 'KF045', name: '秦岚', department: '流程变革科' }, { id: 'KF046', name: '邵云', department: '综合管理科' },
  { id: 'KF047', name: '龚俊', department: '运维服务科' }, { id: 'KF048', name: '常欢', department: '数字化创新科' },
  { id: 'KF049', name: '付强', department: '应用开发科' }, { id: 'KF050', name: '曾益', department: '基础设施科' },
  { id: 'KF051', name: '陈红', department: '应用开发科' }, { id: 'KF052', name: '张伟', department: '基础设施科' },
  { id: 'KF053', name: '李娜', department: '数据管理科' }, { id: 'KF054', name: '王强', department: '信息安全科' },
  { id: 'KF055', name: '刘敏', department: '流程变革科' }, { id: 'KF056', name: '赵雷', department: '综合管理科' },
  { id: 'KF057', name: '孙丽', department: '运维服务科' }, { id: 'KF058', name: '周华', department: '数字化创新科' },
  { id: 'KF059', name: '吴刚', department: '应用开发科' }, { id: 'KF060', name: '郑洁', department: '基础设施科' }
];

export const PRIZES: PrizeConfig[] = [
  // Grand Prize (Total 3, Batch 1 - Special Reveal)
  { 
    id: '0-1', 
    type: PrizeType.GRAND, 
    subName: '888现金红包', 
    total: 3, 
    remaining: 3, 
    batchSize: 1, 
    color: 'from-yellow-400 to-red-600', 
    imageUrl: 'https://images.unsplash.com/photo-1589705232231-15877f240401?q=80&w=600&auto=format&fit=crop' 
  },
  
  // First Prize A (Total 3, Batch 3) - Toothbrush
  { 
    id: '1-1', 
    type: PrizeType.FIRST, 
    subName: '电动牙刷', 
    total: 3, 
    remaining: 3, 
    batchSize: 3, 
    color: 'from-purple-400 to-purple-600', 
    imageUrl: 'https://images.unsplash.com/photo-1553557993-d02167d337d2?q=80&w=600&auto=format&fit=crop' 
  },
  // First Prize B (Total 3, Batch 3) - Microwave
  { 
    id: '1-2', 
    type: PrizeType.FIRST, 
    subName: '微波炉', 
    total: 3, 
    remaining: 3, 
    batchSize: 3, 
    color: 'from-purple-400 to-purple-600', 
    imageUrl: 'https://images.unsplash.com/photo-1585659722983-3a675bad4272?q=80&w=600&auto=format&fit=crop' 
  },

  // Second Prize A (Total 6, Batch 6) - Health Pot
  { 
    id: '2-1', 
    type: PrizeType.SECOND, 
    subName: '养生壶', 
    total: 6, 
    remaining: 6, 
    batchSize: 6, 
    color: 'from-blue-400 to-indigo-600', 
    imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=600&auto=format&fit=crop' 
  },
  // Second Prize B (Total 6, Batch 6) - Gamepad
  { 
    id: '2-2', 
    type: PrizeType.SECOND, 
    subName: '游戏手柄', 
    total: 6, 
    remaining: 6, 
    batchSize: 6, 
    color: 'from-blue-400 to-indigo-600', 
    imageUrl: 'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?q=80&w=600&auto=format&fit=crop' 
  },

  // Third Prize A (Total 7, Batch 7) - Cushion
  { 
    id: '3-1', 
    type: PrizeType.THIRD, 
    subName: '腰靠', 
    total: 7, 
    remaining: 7, 
    batchSize: 7, 
    color: 'from-orange-400 to-orange-600', 
    imageUrl: 'https://images.unsplash.com/photo-1588710929895-6ee6a0a03975?q=80&w=600&auto=format&fit=crop' 
  },
  // Third Prize B (Total 9, Batch 9) - Stew Pot
  { 
    id: '3-2', 
    type: PrizeType.THIRD, 
    subName: '电炖锅', 
    total: 9, 
    remaining: 9, 
    batchSize: 9, 
    color: 'from-orange-400 to-orange-600', 
    imageUrl: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?q=80&w=600&auto=format&fit=crop' 
  },
];
