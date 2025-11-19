import bcrypt from "bcrypt";

export class BcryptService {
  async hash(password) {
    return await bcrypt.hash(password, 10);
  }

  async compare(password, hashed) {
    return await bcrypt.compare(password, hashed);
  }
}
