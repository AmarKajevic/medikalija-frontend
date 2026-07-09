export interface Analysis {
  _id: string;
  name: string;
  price: number;
  totalPrice: number;
}

export interface Combination {
  _id: string;
  name: string;
  group: string;
  analyses: Analysis[];
}
export interface UsedCombination {
  _id: string;
  combination: {
    _id: string;
    name: string;
    analyses: Analysis[];
    totalPrice: number;
  };
  patient: { _id: string; name: string };
  totalPriceAtTheTime: number;
  createdBy: { _id: string; name: string; role: string };
  createdAt: string;
}
export interface Group {
  _id: string;
  name: string;
  combinations: {
    _id: string;
    name: string;
    totalPrice: number;
    analyses: Analysis[];
  }[];
}
