// src/application/usecases/Staff/EditStaff.js
export default class EditStaff {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id, staffData) {
    const updatedStaff = await this.userRepository.updateStaff(id, staffData);
    if (!updatedStaff) throw new Error("Staff not found or nothing to update");
    return updatedStaff;
  }
}
