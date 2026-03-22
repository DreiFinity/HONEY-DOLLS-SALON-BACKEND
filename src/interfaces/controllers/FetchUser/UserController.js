import CustomerRepositoryImpl from "../../../infrastructure/repositories/Customer/CustomerRepositoryImpl.js";
import StaffRepositoryImpl from "../../../infrastructure/repositories/Staff/StaffRepositoryImpl.js";
import AdminRepositoryImpl from "../../../infrastructure/repositories/Admin/AdminRepositoryImpl.js";
import GetMyProfile from "../../../application/usecases/FetchUser/GetMyProfile.js";

const customerRepo = new CustomerRepositoryImpl();
const staffRepo = new StaffRepositoryImpl();
const adminRepo = new AdminRepositoryImpl();

const getMyProfileUseCase = new GetMyProfile(
  customerRepo,
  staffRepo,
  adminRepo,
);

export default async function getMyProfile(req, res) {
  try {
    const profile = await getMyProfileUseCase.execute(
      req.user.id,
      req.user.role,
    );

    res.json(profile);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
}

export async function getProfile(req, res) {
  try {
    const profile = await getMyProfileUseCase.execute(
      req.user.id,
      req.user.role,
    );

    res.json({
      success: true,
      user: {
        name: profile.fullName,
        firstname: profile.firstname,
        lastname: profile.lastname,
        email: profile.email || "",
        phone: profile.phone || "",
        profileimage: profile.profileimage || null,
      },
    });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // Split full name into first and last
    const parts = name.trim().split(/\s+/);
    const firstname = parts[0] || "";
    const lastname = parts.slice(1).join(" ") || "";

    const updated = await customerRepo.updateProfile(req.user.id, {
      firstname,
      lastname,
      contact: phone || null,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filename = req.file.filename;

    const updated = await customerRepo.updateProfileImage(req.user.id, filename);

    if (!updated) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.json({
      success: true,
      message: "Avatar updated",
      profileimage: filename,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}
