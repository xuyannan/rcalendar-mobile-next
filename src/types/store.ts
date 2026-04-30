export interface StoreService {
  id: number;
  name: string;
  description: string;
  price: number;
  priceHuman: number;
  depositAmount: number;
  depositHuman: number;
  depositType: 'none' | 'cash' | 'physical';
}

export interface StoreOrderItem {
  id: number;
  serviceId: number;
  serviceName: string;
  unitPrice: number;
  unitPriceHuman: number;
  depositAmount: number;
  depositAmountHuman: number;
  depositType: 'none' | 'cash' | 'physical';
  isDepositRefunded: boolean;
  depositRefund: DepositRefund | null;
}

export interface DepositRefund {
  id: number;
  refundAmount: number;
  refundAmountHuman: number;
  refundedAt: string;
  refundedByName: string;
  note: string;
}

export interface StoreOrder {
  id: number;
  orderNo: string;
  member: number | null;
  memberInfo: {
    id: number;
    memberNo: string;
    realName: string;
    phone: string;
  } | null;
  staffName: string;
  totalPrice: number;
  totalPriceHuman: number;
  discountRate: number;
  finalPrice: number;
  finalPriceHuman: number;
  totalDeposit: number;
  totalDepositHuman: number;
  payAmountHuman: number;
  status: 'created' | 'paid' | 'finished' | 'canceled';
  paidAt: string | null;
  note: string;
  items: StoreOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreOrderSimple {
  id: number;
  orderNo: string;
  memberName: string | null;
  memberNo: string | null;
  staffName: string;
  totalPriceHuman: number;
  finalPriceHuman: number;
  totalDepositHuman: number;
  payAmountHuman: number;
  discountRate: number;
  status: 'created' | 'paid' | 'finished' | 'canceled';
  paidAt: string | null;
  itemCount: number;
  createdAt: string;
}

export interface PrepayData {
  code: number;
  msg: string;
  data: {
    prepayId: string;
    nonceStr: string;
    paySign: string;
    timeStamp: string;
  };
}

export interface CreateOrderResponse extends StoreOrder {}

export interface PayOrderResponse {
  prepayData: PrepayData;
  orderNo: string;
}
