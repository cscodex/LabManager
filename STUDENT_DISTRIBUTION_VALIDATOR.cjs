/**
 * Student Distribution Validator and Corrector
 * Ensures all 20 classes have exactly 6 females and 4 males (10 total per class)
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class StudentDistributionValidator {
  constructor() {
    this.targetPerClass = {
      females: 6,
      males: 4,
      total: 10
    };
    this.totalClasses = 20;
  }

  async analyzeDistribution() {
    console.log('🔍 ANALYZING STUDENT DISTRIBUTION');
    console.log('=================================');

    const query = `
      SELECT 
        c.id as class_id,
        c.display_name,
        c.grade_level,
        c.trade_type,
        c.section,
        COUNT(CASE WHEN u.gender = 'female' THEN 1 END) as female_count,
        COUNT(CASE WHEN u.gender = 'male' THEN 1 END) as male_count,
        COUNT(u.id) as total_students
      FROM classes c
      LEFT JOIN enrollments e ON c.id = e.class_id AND e.is_active = true
      LEFT JOIN users u ON e.student_id = u.id AND u.role = 'student'
      GROUP BY c.id, c.display_name, c.grade_level, c.trade_type, c.section
      ORDER BY c.grade_level, c.trade_type, c.section
    `;

    const result = await pool.query(query);
    
    let analysis = {
      classes: [],
      summary: {
        totalStudents: 0,
        totalFemales: 0,
        totalMales: 0,
        perfectClasses: 0,
        problemClasses: []
      }
    };

    result.rows.forEach(row => {
      const femaleCount = parseInt(row.female_count);
      const maleCount = parseInt(row.male_count);
      const totalCount = parseInt(row.total_students);
      
      const classData = {
        id: row.class_id,
        name: row.display_name,
        gradeLevel: row.grade_level,
        tradeType: row.trade_type,
        section: row.section,
        females: femaleCount,
        males: maleCount,
        total: totalCount,
        isPerfect: femaleCount === this.targetPerClass.females && 
                  maleCount === this.targetPerClass.males && 
                  totalCount === this.targetPerClass.total,
        issues: []
      };

      // Identify specific issues
      if (totalCount !== this.targetPerClass.total) {
        classData.issues.push(`Wrong total: ${totalCount} (expected ${this.targetPerClass.total})`);
      }
      if (femaleCount !== this.targetPerClass.females) {
        classData.issues.push(`Wrong female count: ${femaleCount} (expected ${this.targetPerClass.females})`);
      }
      if (maleCount !== this.targetPerClass.males) {
        classData.issues.push(`Wrong male count: ${maleCount} (expected ${this.targetPerClass.males})`);
      }

      analysis.classes.push(classData);
      analysis.summary.totalStudents += totalCount;
      analysis.summary.totalFemales += femaleCount;
      analysis.summary.totalMales += maleCount;

      if (classData.isPerfect) {
        analysis.summary.perfectClasses++;
      } else {
        analysis.summary.problemClasses.push(classData);
      }
    });

    return analysis;
  }

  async findAvailableStudents(gender, excludeClassId = null) {
    const query = `
      SELECT u.id, u.first_name, u.last_name, u.student_id, u.gender
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.student_id AND e.is_active = true
      WHERE u.role = 'student' 
        AND u.gender = $1
        AND (e.id IS NULL OR ($2 IS NOT NULL AND e.class_id != $2))
      ORDER BY u.created_at ASC
    `;
    
    const result = await pool.query(query, [gender, excludeClassId]);
    return result.rows;
  }

  async createMissingStudent(classData, gender) {
    console.log(`   📝 Creating new ${gender} student for ${classData.name}...`);

    // Find the next available student number for this class
    const existingStudentsQuery = `
      SELECT student_id FROM users
      WHERE role = 'student'
        AND grade_level = $1
        AND trade_type = $2
        AND section = $3
        AND student_id IS NOT NULL
      ORDER BY student_id
    `;

    const existingResult = await pool.query(existingStudentsQuery, [
      classData.gradeLevel, classData.tradeType, classData.section
    ]);

    // Find next available number
    let nextNumber = 1;
    const existingNumbers = existingResult.rows
      .map(row => parseInt(row.student_id.slice(-3)))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    const studentId = `${classData.gradeLevel}${classData.tradeType}${classData.section}${String(nextNumber).padStart(3, '0')}`;

    const femaleNames = [
      'Fatima', 'Aisha', 'Zainab', 'Khadija', 'Maryam', 'Sana', 'Noor', 'Hira', 'Ayesha', 'Rabia'
    ];
    const maleNames = [
      'Muhammad', 'Ali', 'Hassan', 'Ahmad', 'Omar', 'Bilal', 'Usman', 'Hamza', 'Yusuf', 'Ibrahim'
    ];

    const lastNames = [
      'Khan', 'Ahmed', 'Ali', 'Shah', 'Malik', 'Hussain', 'Iqbal', 'Rehman', 'Siddiqui', 'Qureshi'
    ];

    const firstNames = gender === 'female' ? femaleNames : maleNames;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 10000)}@student.edu`;

    // Create user
    const userQuery = `
      INSERT INTO users (
        email, password, role, first_name, last_name, student_id, gender,
        grade_level, trade_type, section
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const userResult = await pool.query(userQuery, [
      email,
      '$2b$12$defaulthashedpassword', // Default password hash
      'student',
      firstName,
      lastName,
      studentId,
      gender,
      classData.gradeLevel,
      classData.tradeType,
      classData.section
    ]);

    const userId = userResult.rows[0].id;

    // Enroll in class
    const enrollQuery = `
      INSERT INTO enrollments (student_id, class_id, is_active)
      VALUES ($1, $2, true)
    `;

    await pool.query(enrollQuery, [userId, classData.id]);

    console.log(`   ✅ Created ${firstName} ${lastName} (${studentId}) and enrolled in ${classData.name}`);
    return userId;
  }

  async correctDistribution() {
    console.log('🔧 CORRECTING STUDENT DISTRIBUTION');
    console.log('==================================');

    const analysis = await this.analyzeDistribution();
    
    if (analysis.summary.problemClasses.length === 0) {
      console.log('✅ All classes already have perfect distribution!');
      return;
    }

    console.log(`Found ${analysis.summary.problemClasses.length} classes needing correction:`);
    
    for (const classData of analysis.summary.problemClasses) {
      console.log(`\n🔧 Fixing ${classData.name}:`);
      console.log(`   Current: ${classData.females}F + ${classData.males}M = ${classData.total}`);
      console.log(`   Target:  ${this.targetPerClass.females}F + ${this.targetPerClass.males}M = ${this.targetPerClass.total}`);
      
      // Calculate what's needed
      const femalesNeeded = this.targetPerClass.females - classData.females;
      const malesNeeded = this.targetPerClass.males - classData.males;
      
      // Add missing female students
      for (let i = 0; i < femalesNeeded; i++) {
        await this.createMissingStudent(classData, 'female');
      }
      
      // Add missing male students
      for (let i = 0; i < malesNeeded; i++) {
        await this.createMissingStudent(classData, 'male');
      }
      
      console.log(`   ✅ ${classData.name} corrected!`);
    }

    console.log('\n🎉 Distribution correction completed!');
  }

  async validateAndReport() {
    const analysis = await this.analyzeDistribution();
    
    console.log('\n📊 DISTRIBUTION REPORT:');
    console.log('=======================');
    
    analysis.classes.forEach(cls => {
      const status = cls.isPerfect ? '✅' : '❌';
      console.log(`${status} ${cls.name}: ${cls.females}F + ${cls.males}M = ${cls.total}`);
      if (!cls.isPerfect) {
        cls.issues.forEach(issue => console.log(`     ⚠️  ${issue}`));
      }
    });

    console.log('\n📈 SUMMARY:');
    console.log(`Perfect Classes: ${analysis.summary.perfectClasses}/${this.totalClasses}`);
    console.log(`Total Students: ${analysis.summary.totalStudents}`);
    console.log(`Gender Ratio: ${analysis.summary.totalFemales}F:${analysis.summary.totalMales}M`);
    
    const expectedTotal = this.totalClasses * this.targetPerClass.total;
    const expectedFemales = this.totalClasses * this.targetPerClass.females;
    const expectedMales = this.totalClasses * this.targetPerClass.males;
    
    const isOverallPerfect = 
      analysis.summary.totalStudents === expectedTotal &&
      analysis.summary.totalFemales === expectedFemales &&
      analysis.summary.totalMales === expectedMales;
    
    console.log(`Overall Status: ${isOverallPerfect ? '✅ PERFECT' : '❌ NEEDS CORRECTION'}`);
    
    return analysis;
  }

  async close() {
    await pool.end();
  }
}

// CLI Interface
async function main() {
  const validator = new StudentDistributionValidator();
  
  try {
    const command = process.argv[2] || 'validate';
    
    switch (command) {
      case 'validate':
        await validator.validateAndReport();
        break;
      case 'correct':
        await validator.correctDistribution();
        await validator.validateAndReport();
        break;
      default:
        console.log('Usage: node STUDENT_DISTRIBUTION_VALIDATOR.js [validate|correct]');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await validator.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = StudentDistributionValidator;
