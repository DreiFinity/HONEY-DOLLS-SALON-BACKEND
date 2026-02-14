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
