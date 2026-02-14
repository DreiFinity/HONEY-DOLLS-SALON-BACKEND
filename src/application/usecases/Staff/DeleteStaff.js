// src/application/usecases/Staff/DeleteStaff.js
export default class DeleteStaff {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id) {
    const result = await this.userRepository.deleteStaff(id);
    return result;
  }
}
