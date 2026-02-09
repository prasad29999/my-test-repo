import pool from './shared/database/connection.js';

async function testInsert() {
    try {
        const profileRes = await pool.query('SELECT id FROM erp.profiles LIMIT 1');
        if (profileRes.rows.length === 0) {
            console.log('No profiles found to test with.');
            process.exit(0);
        }
        const profileId = profileRes.rows[0].id;
        console.log(`Testing with profileId: ${profileId}`);

        const rawRow = {
            'Email': 'test@example.com',
            'Full Name': 'Test User'
        };

        const getVal = (keys) => {
            if (!Array.isArray(keys)) keys = [keys];
            for (const k of keys) {
                if (rawRow[k] !== undefined && rawRow[k] !== null) return rawRow[k];
                const norm = String(k).trim().replace(/\s+/g, '_').replace(/[^\w_]/g, '').toLowerCase();
                if (rawRow[norm] !== undefined && rawRow[norm] !== null) return rawRow[norm];
            }
            return null;
        };

        const query = `
      INSERT INTO erp.employee (
        profile_id, start_time, completion_time, email, name, full_name, dob, joining_date,
        designation, department, marital_status, pan, adhar_no, mobile_no,
        emergency_contact_no, personal_mail_id, blood_group, bank_name,
        account_number, ifsc, bank_branch, uan_no, current_address, permanent_address,
        language_known, name_1, relation, occupation, age, contact,
        name_2, relation1, occupation1, age1, contact1,
        name_3, relation2, occupation2, age2,
        name_4, relation3, occupation3, age3,
        qualification_1, college_name, passout_year, grade_percentage,
        qualification_2, college_name1, passout_year1, grade_percentage1,
        qualification_3, college_name2, passout_year2, grade_percentage2,
        previous_employer_name, designation1, period_of_work, reason_of_leaving,
        reporting_manager_contact_email, current_address_proof, permanent_address_proof,
        pan1, bank_details_proof, ssc_10th_certificate, hsc_12th_certificate,
        graduation_certificate, post_graduation, previous_employment_experience_letter,
        previous_employment_offer_letter, previous_employment_salary_slip,
        updated_resume, passport_size_photo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, 
        $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, 
        $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, 
        $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73
      )
    `;

        const params = [
            profileId,
            getVal(['Start time']),
            getVal(['Completion time']),
            getVal(['Email']),
            getVal(['Name']),
            getVal(['Full Name']),
            getVal(['DOB (DD/MM/YY)']),
            getVal(['Joining Date (DD/MM/YY)']),
            getVal(['Designation']),
            getVal(['Department']),
            getVal(['Marital Status']),
            getVal(['PAN']),
            getVal(['Adhar No', 'Aadhaar']),
            getVal(['Mobile No']),
            getVal(['Emergency contact no (name & relation of contact person)']),
            getVal(['Personal Mail ID']),
            getVal(['Blood Group']),
            getVal(['Bank Name']),
            getVal(['Account Number']),
            getVal(['IFSC']),
            getVal(['Bank Branch']),
            getVal(['UAN No (if applicable previously)']),
            getVal(['Current Address\u00A0', 'Current Address']),
            getVal(['Permanent Address']),
            getVal(['Language Known']),
            getVal(['Name 1']),
            getVal(['Relation']),
            getVal(['Occupation']),
            getVal(['Age']),
            getVal(['Contact']),
            getVal(['Name 2\u00A0', 'Name 2']),
            getVal(['Relation1']),
            getVal(['Occupation1']),
            getVal(['Age1']),
            getVal(['Contact1']),
            getVal(['Name 3']),
            getVal(['Relation2']),
            getVal(['Occupation2']),
            getVal(['Age2']),
            getVal(['Name 4']),
            getVal(['Relation3']),
            getVal(['Occupation3']),
            getVal(['Age3']),
            getVal(['Qualification 1']),
            getVal(['College name']),
            getVal(['Passout year']),
            getVal(['Grade / percentage']),
            getVal(['Qualification 2\u00A0', 'Qualification 2']),
            getVal(['College Name1']),
            getVal(['Passout year1']),
            getVal(['Grade / percentage1']),
            getVal(['Qualification 3']),
            getVal(['College Name2']),
            getVal(['Passout Year2']),
            getVal(['Grade / Percentage2']),
            getVal(['Previous Employer Name']),
            getVal(['Designation1']),
            getVal(['Period of work (from - to)']),
            getVal(['Reason of leaving']),
            getVal(['Reporting Manager Contact & Email']),
            getVal(['Current Address Proof']),
            getVal(['Permanent Address Proof']),
            getVal(['PAN1']),
            getVal(['Bank Account Details / Cancelled Cheque / Passbook']),
            getVal(['SSC / 10th - passing certificate\u00A0', 'SSC / 10th - passing certificate']),
            getVal(['HSC / 12th - Passing certificate']),
            getVal(['Graduation Certificate\u00A0', 'Graduation Certificate']),
            getVal(['Post Graduation']),
            getVal(['Previous \nEmployment Experience Letter', 'Employment Experience Letter']),
            getVal(['Previous Employment Offer Letter']),
            getVal(['Previous Employment Salary Slip\u00A0', 'Salary Slip']),
            getVal(['Updated Resume']),
            getVal(['Passport size photo'])
        ];

        await pool.query(query, params);
        console.log('✅ Test insert successful with real profileId');
        process.exit(0);
    } catch (e) {
        console.error('❌ Test insert failed:');
        console.error(e);
        process.exit(1);
    }
}

testInsert();
