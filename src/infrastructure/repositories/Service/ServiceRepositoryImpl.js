import { pool } from "../../db/index.js";

export default class ServiceRepositoryImpl {
  async getAllServices() {
    const result = await pool.query(
      "SELECT * FROM service ORDER BY serviceid ASC"
    );
    return result.rows;
  }

  async getServiceById(serviceId) {
    const result = await pool.query(
      "SELECT * FROM service WHERE serviceid = $1",
      [serviceId]
    );
    return result.rows[0] || null;
  }

  async createService({ servicename, servicetype, amount, image }) {
    const result = await pool.query(
      `INSERT INTO service (servicename, servicetype, amount, image)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [servicename, servicetype, amount, image || null]
    );
    return result.rows[0];
  }

  async updateService(serviceId, { servicename, servicetype, amount, image }) {
    const existing = await pool.query(
      "SELECT * FROM service WHERE serviceid = $1",
      [serviceId]
    );

    if (existing.rows.length === 0) {
      return null;
    }

    const currentService = existing.rows[0];

    const finalServiceName = servicename ?? currentService.servicename;
    const finalServiceType = servicetype ?? currentService.servicetype;
    const finalAmount = amount ?? currentService.amount;
    const finalImage =
      image !== undefined && image !== null && image !== ""
        ? image
        : currentService.image;

    const result = await pool.query(
      `UPDATE service
       SET servicename = $1,
           servicetype = $2,
           amount = $3,
           image = $4
       WHERE serviceid = $5
       RETURNING *`,
      [finalServiceName, finalServiceType, finalAmount, finalImage, serviceId]
    );

    return result.rows[0] || null;
  }

  async deleteService(serviceId) {
    const result = await pool.query(
      "DELETE FROM service WHERE serviceid = $1 RETURNING *",
      [serviceId]
    );

    return result.rows[0] || null;
  }
}