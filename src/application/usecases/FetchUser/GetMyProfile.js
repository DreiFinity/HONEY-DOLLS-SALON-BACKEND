export default class GetMyProfile {
  constructor(customerRepo, staffRepo, adminRepo) {
    this.customerRepo = customerRepo;
    this.staffRepo = staffRepo;
    this.adminRepo = adminRepo;
  }

  async execute(userId, role) {
    console.log(`[DEBUG] GetMyProfile execution started for userId: ${userId}, role: ${role}`);
    
    let profile = null;
    const normalizedRole = (role || "").toString().trim().toLowerCase();

    try {
      if (normalizedRole === "customer") {
        console.log(`[DEBUG] Attempting customer profile lookup for userId: ${userId}`);
        profile = await this.customerRepo.findByUserId(userId);
      } else if (normalizedRole === "staff") {
        console.log(`[DEBUG] Attempting staff profile lookup for userId: ${userId}`);
        profile = await this.staffRepo.findByUserId(userId);
      } else if (normalizedRole === "admin") {
        console.log(`[DEBUG] Attempting admin profile lookup for userId: ${userId}`);
        profile = await this.adminRepo.findByUserId(userId);
      }

      if (!profile) {
        console.error(`[ERROR] No profile found in ${normalizedRole} table for userId: ${userId}`);
        throw new Error(`Profile not found for role: ${role}`);
      }

      console.log(`[DEBUG] Profile found for ${normalizedRole}: ${profile.firstname} ${profile.lastname}`);

      const fname = profile.firstname || "";
      const lname = profile.lastname || "";
      const fullName = (fname + " " + lname).trim() || "User";

      return {
        role: normalizedRole,
        firstname: fname,
        lastname: lname,
        fullName: fullName,
        email: profile.email || null,
        phone: profile.contact || null,
        profileimage: profile.profileimage || profile.image || null,
        branchId: profile.branchid || null,
        branchName: profile.branchname || null,
        branchLocation: profile.branch_location || null,
        image: profile.image || profile.profileimage || null,
        staffRole: profile.role || null,
      };
    } catch (err) {
      console.error(`[CRITICAL ERROR] GetMyProfile failed for userId ${userId}:`, err.message);
      throw err;
    }
  }
}
