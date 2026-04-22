// src/application/usecases/Staff/EditStaff.js
export default class EditStaff {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id, staffData) {
    // 1. If email is being changed, check if it exists for ANOTHER user
    if (staffData.email) {
      const existingUser = await this.userRepository.findByEmail(staffData.email);
      if (existingUser) {
        // Find if this email belongs to the staff we are currently editing
        const currentUserId = await this.userRepository.getUserIdByStaffId(id);
        if (currentUserId && existingUser.userid !== currentUserId) {
          throw new Error("This email is already registered to another account.");
        }
      }
    }

    // 2. If username is being changed, check if it exists for ANOTHER user
    if (staffData.username) {
      const existingUser = await this.userRepository.findByUsername(staffData.username);
      if (existingUser) {
        const currentUserId = await this.userRepository.getUserIdByStaffId(id);
        if (currentUserId && existingUser.userid !== currentUserId) {
          throw new Error("This username is already taken.");
        }
      }
    }

    const updatedStaff = await this.userRepository.updateStaff(id, staffData);
    if (!updatedStaff) throw new Error("Staff not found or nothing to update");
    return updatedStaff;
  }
}
