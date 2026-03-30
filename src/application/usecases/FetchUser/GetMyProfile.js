export default class GetMyProfile {
  constructor(customerRepo, staffRepo, adminRepo) {
    this.customerRepo = customerRepo;
    this.staffRepo = staffRepo;
    this.adminRepo = adminRepo;
  }

  async execute(userId, role) {
    let profile = null;

    if (role === "customer") {
      profile = await this.customerRepo.findByUserId(userId);
    }

    if (role === "staff") {
      profile = await this.staffRepo.findByUserId(userId);
    }

    if (role === "admin") {
      profile = await this.adminRepo.findByUserId(userId);
    }

    if (!profile) {
      throw new Error("Profile not found");
    }

    return {
      role,
      firstname: profile.firstname,
      lastname: profile.lastname,
      fullName: `${profile.firstname} ${profile.lastname}`,
      email: profile.email || null,
      phone: profile.contact || null,
      profileimage: profile.profileimage || null,
      branchId: profile.branchid || null,
      branchName: profile.branchname || null,
      branchLocation: profile.branch_location || null,
      image: profile.image || null,
    };
  }
}
