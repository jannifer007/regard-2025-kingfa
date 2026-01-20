
import { Staff, PrizeType, PrizeConfig } from './types';

// Mock departments
const DEPTS = [
  '应用开发科', '基础设施科', '数据管理科', '信息安全科', 
  '流程变革科', '综合管理科', '运维服务科', '数字化创新科'
];

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
  { id: 'KF049', name: '付强', department: '应用开发科' }, { id: 'KF050', name: '曾益', department: '基础设施科' }
];

export const PRIZES: PrizeConfig[] = [
  { type: PrizeType.THIRD, total: 7, remaining: 7, color: 'from-orange-400 to-orange-600', batchSize: 4 },
  { type: PrizeType.SECOND, total: 6, remaining: 6, color: 'from-blue-400 to-indigo-600', batchSize: 3 },
  { type: PrizeType.FIRST, total: 3, remaining: 3, color: 'from-yellow-400 to-red-600', batchSize: 1 },
];
