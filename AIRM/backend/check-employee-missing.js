import pool from './shared/database/connection.js';

async function checkEmployeeMissingCols() {
    const desiredCols = [
        'profile_id', 'start_time', 'completion_time', 'email', 'name', 'full_name', 'dob', 'joining_date',
        'designation', 'department', 'marital_status', 'pan', 'adhar_no', 'mobile_no',
        'emergency_contact_no', 'personal_mail_id', 'blood_group', 'bank_name',
        'account_number', 'ifsc', 'bank_branch', 'uan_no', 'current_address', 'permanent_address',
        'language_known', 'name_1', 'relation', 'occupation', 'age', 'contact',
        'name_2', 'relation1', 'occupation1', 'age1', 'contact1',
        'name_3', 'relation2', 'occupation2', 'age2',
        'name_4', 'relation3', 'occupation3', 'age3',
        'qualification_1', 'college_name', 'passout_year', 'grade_percentage',
        'qualification_2', 'college_name1', 'passout_year1', 'grade_percentage1',
        'qualification_3', 'college_name2', 'passout_year2', 'grade_percentage2',
        'previous_employer_name', 'designation1', 'period_of_work', 'reason_of_leaving',
        'reporting_manager_contact_email', 'current_address_proof', 'permanent_address_proof',
        'pan1', 'bank_details_proof', 'ssc_10th_certificate', 'hsc_12th_certificate',
        'graduation_certificate', 'post_graduation', 'previous_employment_experience_letter',
        'previous_employment_offer_letter', 'previous_employment_salary_slip',
        'updated_resume', 'passport_size_photo'
    ];

    try {
        const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'erp' AND table_name = 'employee'
    `);
        const existingCols = new Set(res.rows.map(r => r.column_name));
        const missing = desiredCols.filter(c => !existingCols.has(c));
        console.log('Missing columns in employee:', missing);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkEmployeeMissingCols();
