import bcrypt from "bcrypt"
import type { User, UserRepository } from "../users/types.js"

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async verifyCredentials(loginId: string, password: string): Promise<User | undefined> {
    const user = await this.userRepository.findByLoginId(loginId)
    if (!user || user.status !== "active") {
      return undefined
    }
    const matches = await bcrypt.compare(password, user.passwordHash)
    return matches ? user : undefined
  }
}
