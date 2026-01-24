
export interface Staff {
  id: string;    // 工号
  name: string;  // 姓名
  department: string; // 科室
}

export enum PrizeType {
  GRAND = '特等奖',
  FIRST = '一等奖',
  SECOND = '二等奖',
  THIRD = '三等奖'
}

export interface Winner {
  staff: Staff;
  prize: PrizeType;
  subPrizeName: string;
  timestamp: number;
}

export interface PrizeConfig {
  id: string;
  type: PrizeType;
  subName: string;
  total: number;
  remaining: number;
  color: string;
  batchSize: number;
  imageUrl: string;
}
