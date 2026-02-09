// Config Entity Models - POC (Lookup only)

export interface HoldReason {
  reasonId: number;
  reasonCode: string;
  reasonDescription: string;
  applicableTo?: string;
  status: string;
}

export interface DelayReason {
  reasonId: number;
  reasonCode: string;
  reasonDescription: string;
  status: string;
}
