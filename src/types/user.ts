export interface CreateUserBody {
  name: string;
  noReg: string;
  email: string;
  noHp: string;
  role: "MEMBER" | "LEADER" | "SPV" | "DPH";
  password: string;
}
