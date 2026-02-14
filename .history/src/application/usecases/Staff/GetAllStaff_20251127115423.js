// src/application/usecases/Staff/GetAllStaff.js
export default class GetAllStaff {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute() {
    const staffList = await this.userRepository.getAllStaff();
    return staffList;
  }
}
