import { pool } from './src/infrastructure/db/index.js';

pool.query(`SELECT rp.*,
              a.starttime, a.endtime, a.status AS appointment_status,
              COALESCE(a.customerid, q.customerid) AS customerid,
              COALESCE(c.firstname, q.customername, 'Walk-in Customer') AS customer_firstname,
              COALESCE(c.lastname, '') AS customer_lastname,
              u.email AS customer_email,
              COALESCE(s.firstname, qs_staff.firstname) AS staff_firstname, 
              COALESCE(s.lastname, qs_staff.lastname) AS staff_lastname,
              b.branchname AS branch_name,
              COALESCE(apt_totals.total_service_cost, q_totals.total_service_cost, 0) AS total_amount,
              CASE 
                WHEN rp.appointmentid IS NOT NULL THEN (COALESCE(apt_totals.total_service_cost, 0) - rp.reservation_fee)
                ELSE COALESCE(q_totals.total_service_cost, 0)
              END AS balance_amount,
              COALESCE(apt_totals.service_names, q_totals.service_names) AS service_names
       FROM reservationpayment rp
       LEFT JOIN appointment a ON a.appointmentid = rp.appointmentid
       LEFT JOIN queue q ON q.queueid = rp.queueid
       LEFT JOIN customers c ON c.customerid = a.customerid
       LEFT JOIN users u ON u.userid = c.userid
       LEFT JOIN staff s ON s.staffid = a.staffid
       LEFT JOIN staff qs_staff ON qs_staff.staffid = q.staffid
       LEFT JOIN branches b ON b.branchid = COALESCE(s.branchid, qs_staff.branchid)
       LEFT JOIN (
           SELECT aps.appointmentid, 
                  SUM(sv.amount) AS total_service_cost,
                  STRING_AGG(sv.servicename, ', ') AS service_names
           FROM appointmentservice aps
           JOIN service sv ON sv.serviceid = aps.serviceid
           GROUP BY aps.appointmentid
       ) apt_totals ON apt_totals.appointmentid = rp.appointmentid
       LEFT JOIN (
           SELECT qs.queueid, 
                  SUM(sv.amount) AS total_service_cost,
                  STRING_AGG(sv.servicename, ', ') AS service_names
           FROM queueservice qs
           JOIN service sv ON sv.serviceid = qs.serviceid
           GROUP BY qs.queueid
       ) q_totals ON q_totals.queueid = rp.queueid
       ORDER BY rp.created_at DESC`)
  .then(res => { console.log('SUCCESS'); process.exit(0); })
  .catch(err => { console.error('ERROR:', err); process.exit(1); });
