// src/application/usecases/Staff/GetAllStaff.js
export default class GetAllStaff {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute() {
    return await this.userRepository.getAllStaff();
  }
}
