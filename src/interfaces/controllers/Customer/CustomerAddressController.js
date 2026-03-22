import CreateCustomerAddress from "../../../application/usecases/Customer/CreateCustomerAddress.js";
import GetCustomerAddresses from "../../../application/usecases/Customer/GetCustomerAddresses.js";
import UpdateCustomerAddress from "../../../application/usecases/Customer/UpdateCustomerAddress.js";
import DeleteCustomerAddress from "../../../application/usecases/Customer/DeleteCustomerAddress.js";
import CustomerAddressRepositoryImpl from "../../../infrastructure/repositories/Customer/CustomerRepositoryImpl.js";
import { pool } from "../../../infrastructure/db/index.js";

// CREATE address
export const createAddress = async (req, res) => {
  try {
    // 🔹 Get customerid from JWT and fetch corresponding customer row
    const customerRes = await pool.query(
      "SELECT customerid FROM customers WHERE userid = $1",
      [req.user.id],
    );
    if (!customerRes.rows[0])
      return res
        .status(400)
        .json({ success: false, message: "Customer profile not found" });

    const customerid = customerRes.rows[0].customerid;

    const data = { ...req.body, customerid };

    const useCase = new CreateCustomerAddress(
      new CustomerAddressRepositoryImpl(),
    );
    const address = await useCase.execute(data);

    res.status(201).json({ success: true, address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET addresses
export const getAddresses = async (req, res) => {
  try {
    const customerRes = await pool.query(
      "SELECT customerid FROM customers WHERE userid = $1",
      [req.user.id],
    );
    if (!customerRes.rows[0])
      return res
        .status(400)
        .json({ success: false, message: "Customer profile not found" });

    const customerid = customerRes.rows[0].customerid;

    const useCase = new GetCustomerAddresses(
      new CustomerAddressRepositoryImpl(),
    );
    const addresses = await useCase.execute(customerid);

    res.status(200).json({ success: true, addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE address
export const updateAddress = async (req, res) => {
  try {
    const addressid = req.params.id;

    const customerRes = await pool.query(
      "SELECT customerid FROM customers WHERE userid = $1",
      [req.user.id],
    );
    if (!customerRes.rows[0])
      return res
        .status(400)
        .json({ success: false, message: "Customer profile not found" });

    const customerid = customerRes.rows[0].customerid;

    const useCase = new UpdateCustomerAddress(
      new CustomerAddressRepositoryImpl(),
    );
    const updated = await useCase.execute(addressid, customerid, req.body);

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });

    res.status(200).json({ success: true, address: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE address
export const deleteAddress = async (req, res) => {
  try {
    const addressid = req.params.id;

    const customerRes = await pool.query(
      "SELECT customerid FROM customers WHERE userid = $1",
      [req.user.id],
    );
    if (!customerRes.rows[0])
      return res
        .status(400)
        .json({ success: false, message: "Customer profile not found" });

    const customerid = customerRes.rows[0].customerid;

    const useCase = new DeleteCustomerAddress(
      new CustomerAddressRepositoryImpl(),
    );
    const deleted = await useCase.execute(addressid, customerid);

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });

    res.status(200).json({ success: true, message: "Address deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
