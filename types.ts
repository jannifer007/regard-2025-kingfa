
export interface Staff {
  id: string;    // 工号
  name: string;  // 姓名
}

export enum PrizeType {
  FIRST = '一等奖',
  SECOND = '二等奖',
  THIRD = '三等奖'
}

export interface Winner {
  staff: Staff;
  prize: PrizeType;
  timestamp: number;
}

export interface PrizeConfig {
  type: PrizeType;
  total: number;
  remaining: number;
  color: string;
}
