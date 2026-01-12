
import { Staff, PrizeType, PrizeConfig } from './types';

export const STAFF_LIST: Staff[] = [
  { id: 'KF001', name: '张伟' }, { id: 'KF002', name: '王芳' },
  { id: 'KF003', name: '李静' }, { id: 'KF004', name: '刘洋' },
  { id: 'KF005', name: '陈刚' }, { id: 'KF006', name: '赵艳' },
  { id: 'KF007', name: '黄勇' }, { id: 'KF008', name: '周杰' },
  { id: 'KF009', name: '徐林' }, { id: 'KF010', name: '孙博' },
  { id: 'KF011', name: '马腾' }, { id: 'KF012', name: '胡可' },
  { id: 'KF013', name: '郭峰' }, { id: 'KF014', name: '林青' },
  { id: 'KF015', name: '何芳' }, { id: 'KF016', name: '高强' },
  { id: 'KF017', name: '罗娜' }, { id: 'KF018', name: '郑开' },
  { id: 'KF019', name: '谢红' }, { id: 'KF020', name: '韩冰' },
  { id: 'KF021', name: '唐磊' }, { id: 'KF022', name: '冯志' },
  { id: 'KF023', name: '于波' }, { id: 'KF024', name: '董燕' },
  { id: 'KF025', name: '潘亮' }, { id: 'KF026', name: '田芳' },
  { id: 'KF027', name: '姜华' }, { id: 'KF028', name: '范玮' },
  { id: 'KF029', name: '江琴' }, { id: 'KF030', name: '孟建' },
  { id: 'KF031', name: '白云' }, { id: 'KF032', name: '龙飞' },
  { id: 'KF033', name: '万科' }, { id: 'KF034', name: '邹明' },
  { id: 'KF035', name: '熊博' }, { id: 'KF036', name: '彭德' },
  { id: 'KF037', name: '崔悦' }, { id: 'KF038', name: '孔繁' },
  { id: 'KF039', name: '任豪' }, { id: 'KF040', name: '廖平' },
  { id: 'KF041', name: '史强' }, { id: 'KF042', name: '段誉' },
  { id: 'KF043', name: '贾宝' }, { id: 'KF044', name: '武空' },
  { id: 'KF045', name: '秦岚' }, { id: 'KF046', name: '邵云' },
  { id: 'KF047', name: '龚俊' }, { id: 'KF048', name: '常欢' },
  { id: 'KF049', name: '付强' }, { id: 'KF050', name: '曾益' }
];

export const PRIZES: PrizeConfig[] = [
  { type: PrizeType.THIRD, total: 3, remaining: 3, color: 'from-orange-400 to-orange-600' },
  { type: PrizeType.SECOND, total: 6, remaining: 6, color: 'from-blue-400 to-indigo-600' },
  { type: PrizeType.FIRST, total: 9, remaining: 9, color: 'from-yellow-400 to-red-600' },
];
