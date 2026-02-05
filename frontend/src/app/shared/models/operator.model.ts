export interface Operator {
  operatorId: number;
  operatorCode: string;
  name: string;
  department?: string;
  shift?: string;
  status: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}
