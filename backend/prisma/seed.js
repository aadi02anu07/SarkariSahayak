import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SCHEMES = [
  {
    name: 'PM-KISAN Samman Nidhi',
    nameHindi: 'पीएम-किसान सम्मान निधि',
    slug: 'pm-kisan-samman-nidhi',
    description: 'Income support of ₹6,000 per year to small and marginal farmer families across India.',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    isCentral: true,
    benefitType: 'CASH',
    benefitAmount: '₹6,000 per year (₹2,000 in 3 installments)',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['ALL'],
      genders: ['ALL'],
      occupations: ['FARMER'],
      maxIncome: 200000,
      requiresBankAccount: true,
      requiresLand: true,
      maxLandAcres: 5,
    },
    documentsNeeded: ['Aadhaar Card', 'Bank Passbook', 'Land Records (Khasra-Khatauni)'],
    applyUrl: 'https://pmkisan.gov.in',
    isRolling: true,
    tags: ['farmer', 'agriculture', 'cash', 'central', 'income-support'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-05-01'),
  },
  {
    name: 'National Scholarship Portal — Post Matric Scholarship (OBC)',
    nameHindi: 'पोस्ट मैट्रिक छात्रवृत्ति (OBC)',
    slug: 'nsp-post-matric-scholarship-obc',
    description: 'Post-matriculation scholarships for OBC students to help them complete higher education.',
    ministry: 'Ministry of Social Justice & Empowerment',
    isCentral: true,
    benefitType: 'SCHOLARSHIP',
    benefitAmount: 'Up to ₹10,000 per year',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['OBC'],
      genders: ['ALL'],
      minAge: 14,
      maxAge: 35,
      minEducation: 'TENTH',
      maxIncome: 100000,
      requiresBankAccount: true,
    },
    documentsNeeded: ['Aadhaar Card', 'OBC Certificate', 'Marksheet (Class 10)', 'Income Certificate', 'Bank Passbook'],
    applyUrl: 'https://scholarships.gov.in',
    openDate: new Date('2026-09-01'),
    closeDate: new Date('2026-11-30'),
    tags: ['student', 'scholarship', 'obc', 'education', 'post-matric'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-04-15'),
  },
  {
    name: 'PM Mudra Yojana — Shishu Loan',
    nameHindi: 'पीएम मुद्रा योजना — शिशु ऋण',
    slug: 'pm-mudra-shishu-loan',
    description: 'Collateral-free micro loans up to ₹50,000 for small and micro enterprises.',
    ministry: 'Ministry of Finance',
    isCentral: true,
    benefitType: 'LOAN',
    benefitAmount: 'Up to ₹50,000 (collateral-free)',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['ALL'],
      genders: ['ALL'],
      occupations: ['BUSINESS'],
      requiresBankAccount: true,
    },
    documentsNeeded: ['Aadhaar Card', 'PAN Card', 'Business Proof', 'Bank Passbook', 'Passport Photo'],
    applyUrl: 'https://www.mudra.org.in',
    isRolling: true,
    tags: ['business', 'loan', 'entrepreneur', 'mudra', 'central'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-05-10'),
  },
  {
    name: 'Stand-Up India — SC/ST & Women Entrepreneurs',
    slug: 'stand-up-india',
    description: 'Bank loans between ₹10 lakh and ₹1 crore for SC/ST and women entrepreneurs setting up greenfield enterprises.',
    ministry: 'Ministry of Finance',
    isCentral: true,
    benefitType: 'LOAN',
    benefitAmount: '₹10 lakh to ₹1 crore',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['SC', 'ST'],
      genders: ['ALL'],
      occupations: ['BUSINESS'],
      requiresBankAccount: true,
      customCriteria: 'OR: Women entrepreneur (regardless of category). Must be setting up a greenfield enterprise.',
    },
    documentsNeeded: ['Aadhaar Card', 'PAN Card', 'Caste Certificate', 'Bank Passbook', 'Business Plan', 'Project Report'],
    applyUrl: 'https://www.standupmitra.in',
    isRolling: true,
    tags: ['business', 'loan', 'woman', 'sc', 'st', 'entrepreneur'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-05-15'),
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    nameHindi: 'प्रधानमंत्री फसल बीमा योजना',
    slug: 'pradhan-mantri-fasal-bima-yojana',
    description: 'Crop insurance scheme that provides financial support to farmers suffering crop loss due to unforeseen events.',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    isCentral: true,
    benefitType: 'INSURANCE',
    benefitAmount: 'Coverage up to sum insured (varies by crop)',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['ALL'],
      genders: ['ALL'],
      occupations: ['FARMER'],
      requiresLand: true,
    },
    documentsNeeded: ['Aadhaar Card', 'Land Records', 'Bank Passbook', 'Sowing Certificate'],
    applyUrl: 'https://pmfby.gov.in',
    openDate: new Date('2026-06-01'),
    closeDate: new Date('2026-07-31'),
    tags: ['farmer', 'insurance', 'agriculture', 'crop', 'central'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-05-01'),
  },
  {
    name: 'Sukanya Samriddhi Yojana',
    nameHindi: 'सुकन्या समृद्धि योजना',
    slug: 'sukanya-samriddhi-yojana',
    description: 'Small savings scheme for parents of a girl child to build a corpus for her education and marriage.',
    ministry: 'Ministry of Finance',
    isCentral: true,
    benefitType: 'SUBSIDY',
    benefitAmount: '8.2% interest rate (tax-free maturity amount)',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['ALL'],
      genders: ['FEMALE'],
      maxAge: 10,
      requiresBankAccount: false,
      customCriteria: 'Account must be opened by a parent or guardian for a girl child below 10 years of age.',
    },
    documentsNeeded: ['Girl Child Birth Certificate', 'Parent/Guardian Aadhaar', 'Parent/Guardian PAN'],
    applyUrl: 'https://www.indiapost.gov.in',
    isRolling: true,
    tags: ['girl', 'child', 'savings', 'education', 'woman', 'central'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-04-01'),
  },
  {
    name: 'National Family Benefit Scheme (NFBS)',
    slug: 'national-family-benefit-scheme',
    description: 'One-time financial assistance of ₹20,000 to BPL households on death of primary breadwinner.',
    ministry: 'Ministry of Rural Development',
    isCentral: true,
    benefitType: 'CASH',
    benefitAmount: '₹20,000 (one-time)',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['ALL'],
      genders: ['ALL'],
      minAge: 18,
      maxAge: 64,
      requiresBPL: true,
      requiresBankAccount: true,
      customCriteria: 'Applicant must be the surviving family member. Deceased must be the primary earner aged 18-64.',
    },
    documentsNeeded: ['Aadhaar Card', 'BPL Card', 'Death Certificate', 'Bank Passbook', 'Income Certificate'],
    applyUrl: 'https://www.nsap.nic.in',
    isRolling: true,
    tags: ['bpl', 'cash', 'family', 'death-benefit', 'rural'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-03-20'),
  },
  {
    name: 'PM Scholarship Scheme for Central Armed Police Forces',
    slug: 'pm-scholarship-capf',
    description: 'Scholarship for wards of ex-servicemen and ex-Coast Guard personnel for pursuing professional degree programmes.',
    ministry: 'Ministry of Home Affairs',
    isCentral: true,
    benefitType: 'SCHOLARSHIP',
    benefitAmount: '₹3,000/month (boys) | ₹3,500/month (girls)',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['ALL'],
      genders: ['ALL'],
      minAge: 18,
      maxAge: 25,
      minEducation: 'TWELFTH',
      customCriteria: 'Ward (son/daughter) of ex-CAPF/Coast Guard personnel. Must have secured minimum 60% in Class 12.',
    },
    documentsNeeded: ['Aadhaar Card', 'Ex-Serviceman Certificate', 'Marksheet (Class 12)', 'Admission Letter', 'Bank Passbook'],
    applyUrl: 'https://scholarships.gov.in',
    openDate: new Date('2026-08-01'),
    closeDate: new Date('2026-10-31'),
    tags: ['student', 'scholarship', 'defence', 'education', 'central'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-05-01'),
  },
  {
    name: 'Indira Gandhi National Disability Pension Scheme',
    slug: 'igndps',
    description: 'Monthly pension to persons with severe/multiple disabilities living below poverty line.',
    ministry: 'Ministry of Rural Development',
    isCentral: true,
    benefitType: 'CASH',
    benefitAmount: '₹300/month (Central share) — states may add more',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['ALL'],
      genders: ['ALL'],
      minAge: 18,
      requiresBPL: true,
      requiresDisability: true,
      customCriteria: 'Disability percentage must be 80% or more (severe/multiple disability).',
    },
    documentsNeeded: ['Aadhaar Card', 'BPL Card', 'Disability Certificate (80%+)', 'Bank Passbook'],
    applyUrl: 'https://www.nsap.nic.in',
    isRolling: true,
    tags: ['disabled', 'pension', 'bpl', 'disability', 'central'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-04-10'),
  },
  {
    name: 'Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (PMJAY)',
    nameHindi: 'आयुष्मान भारत — पीएम जन आरोग्य योजना',
    slug: 'ayushman-bharat-pmjay',
    description: 'Health insurance cover of ₹5 lakh per year per family for secondary and tertiary hospitalization.',
    ministry: 'Ministry of Health & Family Welfare',
    isCentral: true,
    benefitType: 'INSURANCE',
    benefitAmount: '₹5 lakh per family per year (health cover)',
    eligibilityJson: {
      states: ['ALL'],
      categories: ['ALL'],
      genders: ['ALL'],
      requiresBPL: true,
      customCriteria: 'Eligibility based on SECC-2011 database. Auto-identified beneficiaries. Check eligibility at pmjay.gov.in.',
    },
    documentsNeeded: ['Aadhaar Card', 'Ration Card', 'PMJAY e-card (if issued)'],
    applyUrl: 'https://pmjay.gov.in',
    isRolling: true,
    tags: ['health', 'insurance', 'bpl', 'hospital', 'central'],
    status: 'ACTIVE',
    lastVerified: new Date('2026-05-20'),
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sarkarisahayak.com' },
    update: {},
    create: {
      email: 'admin@sarkarisahayak.com',
      passwordHash: adminPassword,
      name: 'SarkariSahayak Admin',
      role: 'ADMIN',
      isVerified: true,
      profile: { create: {} },
      notificationPrefs: { create: {} },
    },
  });

  console.log(`✅ Admin user: ${admin.email} (password: Admin@123456)`);

  // Create test user
  const userPassword = await bcrypt.hash('User@123456', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: userPassword,
      name: 'Ravi Kumar',
      role: 'USER',
      isVerified: true,
      profile: {
        create: {
          state: 'Bihar',
          category: 'OBC',
          age: 22,
          gender: 'MALE',
          occupation: 'STUDENT',
          annualIncome: 80000,
          education: 'TWELFTH',
          hasBankAcct: true,
          isBpl: false,
          isDisabled: false,
          familySize: 5,
          profileScore: 85,
        },
      },
      notificationPrefs: { create: {} },
    },
  });

  console.log(`✅ Test user: ${testUser.email} (password: User@123456)`);

  // Seed schemes
  let schemeCount = 0;
  for (const schemeData of SCHEMES) {
    await prisma.scheme.upsert({
      where: { slug: schemeData.slug },
      update: {},
      create: {
        ...schemeData,
        createdBy: admin.id,
      },
    });
    schemeCount++;
    console.log(`   ✓ ${schemeData.name}`);
  }

  console.log(`\n✅ Seeded ${schemeCount} schemes successfully!`);
  console.log('\n📋 Test credentials:');
  console.log('   Admin: admin@sarkarisahayak.com / Admin@123456');
  console.log('   User:  test@example.com / User@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
