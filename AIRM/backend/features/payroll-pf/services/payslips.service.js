/**
 * Payslips Service
 * Business logic for payslips
 * NO Express objects, NO database queries
 */

import * as payslipModel from '../models/payslips.pg.js';
import * as auditLogModel from '../models/payroll-audit-log.pg.js';
import * as leaveService from '../../leave-calendar/services/leave-calendar.service.js';
import * as pfModel from '../models/pf-details.pg.js';

/**
 * Transform raw payslip to DTO
 */
function transformPayslip(payslip) {
  if (!payslip) return null;

  return {
    id: payslip.id,
    user_id: payslip.user_id,
    employee_id: payslip.employee_id,
    email: payslip.email,
    full_name: payslip.full_name,
    month: payslip.month,
    year: payslip.year,
    basic_pay: parseFloat(payslip.basic_pay || 0),
    hra: parseFloat(payslip.hra || 0),
    special_allowance: parseFloat(payslip.special_allowance || 0),
    bonus: parseFloat(payslip.bonus || 0),
    incentives: parseFloat(payslip.incentives || 0),
    other_earnings: parseFloat(payslip.other_earnings || 0),
    total_earnings: parseFloat(payslip.total_earnings || 0),
    pf_employee: parseFloat(payslip.pf_employee || 0),
    pf_employer: parseFloat(payslip.pf_employer || 0),
    esi_employee: parseFloat(payslip.esi_employee || 0),
    esi_employer: parseFloat(payslip.esi_employer || 0),
    professional_tax: parseFloat(payslip.professional_tax || 0),
    tds: parseFloat(payslip.tds || 0),
    other_deductions: parseFloat(payslip.other_deductions || 0),
    total_deductions: parseFloat(payslip.total_deductions || 0),
    net_pay: parseFloat(payslip.net_pay || 0),
    payslip_id: payslip.payslip_id,
    document_url: payslip.document_url,
    status: payslip.status,
    is_locked: payslip.is_locked,
    released_at: payslip.released_at,
    released_by: payslip.released_by,
    released_by_name: payslip.released_by_name,
    company_name: payslip.company_name,
    company_address: payslip.company_address,
    issue_date: payslip.issue_date,
    created_at: payslip.created_at,
    updated_at: payslip.updated_at,
    created_by: payslip.created_by,
    created_by_name: payslip.created_by_name
  };
}

/**
 * Calculate payslip totals
 */
function calculatePayslipTotals(payslipData) {
  const earnings = (payslipData.basic_pay || 0) +
    (payslipData.hra || 0) +
    (payslipData.special_allowance || 0) +
    (payslipData.bonus || 0) +
    (payslipData.incentives || 0) +
    (payslipData.other_earnings || 0);

  const deductions = (payslipData.pf_employee || 0) +
    (payslipData.pf_employer || 0) +
    (payslipData.esi_employee || 0) +
    (payslipData.esi_employer || 0) +
    (payslipData.professional_tax || 0) +
    (payslipData.tds || 0) +
    (payslipData.other_deductions || 0);

  const netPay = earnings - deductions;

  return {
    total_earnings: earnings,
    total_deductions: deductions,
    net_pay: netPay
  };
}

/**
 * Get payslips
 */
export async function getPayslips(filters = {}) {
  try {
    const payslips = await payslipModel.getPayslips(filters);
    return payslips.map(transformPayslip).filter(p => p !== null);
  } catch (error) {
    console.error('[payroll-pf] Error in getPayslips service:', error);
    throw error;
  }
}

/**
 * Get payslip by ID
 */
export async function getPayslipById(payslipId) {
  try {
    const payslip = await payslipModel.getPayslipById(payslipId);
    return transformPayslip(payslip);
  } catch (error) {
    console.error('[payroll-pf] Error in getPayslipById service:', error);
    throw error;
  }
}

/**
 * Create or update payslip
 */
export async function upsertPayslip(payslipData) {
  try {
    // Calculate totals
    const totals = calculatePayslipTotals(payslipData);
    const finalData = {
      ...payslipData,
      ...totals
    };

    // Generate payslip ID if not provided
    if (!finalData.payslip_id) {
      const monthStr = String(finalData.month).padStart(2, '0');
      finalData.payslip_id = `PS-${finalData.employee_id || finalData.user_id}-${finalData.year}${monthStr}`;
    }

    // Allow admin to override locked payslips
    // Check both isAdmin from payslipData and finalData to ensure we catch it
    const isAdminUser = payslipData.isAdmin === true || payslipData.isAdmin === 'true' ||
      finalData.isAdmin === true || finalData.isAdmin === 'true';
    const hasId = !!(payslipData.id || finalData.id);
    if (isAdminUser && hasId) {
      finalData.allowAdminOverride = true;
      console.log('[payroll-pf] Admin override enabled for payslip:', payslipData.id || finalData.id, 'isAdmin:', payslipData.isAdmin);
    } else {
      console.log('[payroll-pf] Admin override NOT enabled. isAdmin:', payslipData.isAdmin, 'hasId:', hasId, 'payslipData.id:', payslipData.id, 'finalData.id:', finalData.id);
    }

    const payslip = await payslipModel.upsertPayslip(finalData);

    // Add audit log
    await auditLogModel.addPayrollAuditLog({
      user_id: finalData.user_id,
      action: payslipData.id ? 'payslip_updated' : 'payslip_created',
      entity_type: 'payslip',
      entity_id: payslip.id,
      performed_by: finalData.created_by,
      details: { month: finalData.month, year: finalData.year }
    });

    return transformPayslip(payslip);
  } catch (error) {
    console.error('[payroll-pf] Error in upsertPayslip service:', error);
    throw error;
  }
}

/**
 * Release payslip
 */
export async function releasePayslip(payslipId, releasedBy) {
  try {
    const payslip = await payslipModel.updatePayslipStatus(payslipId, 'released', releasedBy);

    // Add audit log
    await auditLogModel.addPayrollAuditLog({
      user_id: payslip.user_id,
      action: 'payslip_released',
      entity_type: 'payslip',
      entity_id: payslipId,
      performed_by: releasedBy
    });

    return transformPayslip(payslip);
  } catch (error) {
    console.error('[payroll-pf] Error in releasePayslip service:', error);
    throw error;
  }
}

/**
 * Lock payslip
 */
export async function lockPayslip(payslipId, lockedBy) {
  try {
    const payslip = await payslipModel.updatePayslipStatus(payslipId, 'locked', null);

    // Add audit log
    await auditLogModel.addPayrollAuditLog({
      user_id: payslip.user_id,
      action: 'payslip_locked',
      entity_type: 'payslip',
      entity_id: payslipId,
      performed_by: lockedBy
    });

    return transformPayslip(payslip);
  } catch (error) {
    console.error('[payroll-pf] Error in lockPayslip service:', error);
    throw error;
  }
}

/**
 * Generate payslips based on attendance
 */
export async function generatePayslipsFromAttendance(month, year, generatedBy, targetUserId = null) {
  try {
    console.log(`[payroll] Generating payslips for ${month}/${year}`);

    // 1. Get Attendance Report (aggregated by SQL logic in leave-calendar, but returns daily rows)
    const report = await leaveService.getMonthlyAttendanceReport(month, year);

    if (!report || report.length === 0) {
      // Return empty result, controller will handle message
      return [];
    }

    // 2. Aggregate per user
    const userStats = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    report.forEach(record => {
      if (!userStats[record.user_id]) {
        userStats[record.user_id] = {
          user_id: record.user_id,
          full_name: record.full_name,
          email: record.email,
          paid_days: 0,
          lop_days: 0
        };
      }

      const stats = userStats[record.user_id];
      const dateObj = new Date(record.date);
      const day = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = day === 0 || day === 6;

      if (record.status === 'present') {
        stats.paid_days += 1;
      } else if (record.status === 'half_day') {
        stats.paid_days += 0.5;
        stats.lop_days += 0.5;
      } else if (record.status === 'on_leave') {
        // Check leave type from record if available, else assume paid
        if (record.leave_type === 'Unpaid Leave') {
          stats.lop_days += 1;
        } else {
          stats.paid_days += 1;
        }
      } else if (record.status === 'absent') {
        stats.lop_days += 1;
      } else {
        // No status (NULL)
        if (isWeekend) {
          stats.paid_days += 1; // Assume paid weekend
        } else {
          // If it's a weekday and no record, treat as absent for generation purposes
          stats.lop_days += 1;
        }
      }
    });

    const results = [];

    // Filter users if targetUserId is specific
    const usersToProcess = targetUserId ? [targetUserId] : Object.keys(userStats);

    // 3. Generate Payslip for each user
    for (const userId of usersToProcess) {
      if (!userStats[userId]) {
        console.warn(`[payroll] No attendance data found for target user ${userId} in ${month}/${year}`);
        continue;
      }
      const stats = userStats[userId];
      const totalDays = stats.paid_days + stats.lop_days;

      // Fetch Base Salary (PF Base)
      const pfDetails = await pfModel.getPfDetails(userId);
      const baseSalary = pfDetails?.pf_base_salary ? parseFloat(pfDetails.pf_base_salary) : 15000; // Default 15k if missing

      // Standard Structure
      const stdBasic = baseSalary;
      const stdHRA = baseSalary * 0.40;
      const stdGross = stdBasic + stdHRA;

      // Proration Ratio
      // Ensure ratio implies standard calendar days (e.g. 30/31)
      const ratio = stats.paid_days / daysInMonth;

      // Actual Earnings
      const actBasic = Math.round(stdBasic * ratio);
      const actHRA = Math.round(stdHRA * ratio);
      const actGross = actBasic + actHRA;

      // Deductions
      const pf = Math.round(actBasic * 0.12);
      const esi = Math.round(actGross * 0.0075);
      const pt = actGross > 15000 ? 200 : 0;
      const totalDeductions = pf + esi + pt;

      const netPay = actGross - totalDeductions;

      // Create Payslip Data
      const payslipData = {
        user_id: userId,
        month: parseInt(month),
        year: parseInt(year),
        basic_pay: actBasic,
        hra: actHRA,
        special_allowance: 0,
        bonus: 0,
        incentives: 0,
        other_earnings: 0,
        total_earnings: actGross,
        pf_employee: pf,
        pf_employer: pf,
        esi_employee: esi,
        esi_employer: Math.round(actGross * 0.0325),
        professional_tax: pt,
        tds: 0,
        other_deductions: 0,
        total_deductions: totalDeductions,
        net_pay: netPay,
        status: 'draft',
        created_by: generatedBy,
        isAdmin: true
      };

      try {
        const payslip = await upsertPayslip(payslipData);
        results.push(payslip);
      } catch (err) {
        console.error(`Failed to generate payslip for user ${userId}:`, err);
      }
    }

    return results;

  } catch (error) {
    console.error('[payroll-pf] Error in generatePayslipsFromAttendance:', error);
    throw error;
  }
}

