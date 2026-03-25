import { PrismaClient } from '@prisma/client';

async function runTests() {
  const baseUrl = 'http://localhost:3000/api';
  const prisma = new PrismaClient();
  
  console.log('--- Starting API Integration Tests ---');

  const randomEmail = `admin_${Date.now()}@example.com`;

  // 1. Test Registration
  console.log(`1. Testing /auth/register with ${randomEmail}...`);
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: randomEmail, password: 'securepwd123', orgName: 'Test Org' })
  });
  
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  console.log('Registration OK:', regData.message);

  // 2. Test Login (Expected to fail: PENDING_APPROVAL)
  console.log('2. Testing /auth/login for PENDING_APPROVAL status...');
  const loginFailRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: randomEmail, password: 'securepwd123' })
  });
  const loginFailData = await loginFailRes.json();
  if (loginFailRes.status === 403) {
    console.log('Login blocked correctly (Pending Approval):', loginFailData.error);
  } else {

    throw new Error('Login passed unconditionally, expected 403');
  }

  // 3. Manually activate user in DB
  console.log('3. Activating user via direct DB mutation...');
  await prisma.user.update({
    where: { email: randomEmail },
    data: { status: 'ACTIVE' }
  });
  
  // 4. Test Login Success
  console.log('4. Testing /auth/login (Success expected)...');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: randomEmail, password: 'securepwd123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error('Login failed');
  console.log('Login OK:', loginData.message);
  const token = loginData.token;

  // 5. Create Project via Prisma 
  console.log('5. Creating Project via direct DB mutation...');
  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      orgId: loginData.user.orgId,
    }
  });

  // 6. Test Team Creation API
  console.log('6. Testing /api/teams creation endpoint...');
  const teamRes = await fetch(`${baseUrl}/teams`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: 'Backend Team', projectId: project.id })
  });
  const teamData = await teamRes.json();
  if (!teamRes.ok) throw new Error(`Team Creation failed: ${JSON.stringify(teamData)}`);
  console.log('Team Creation OK:', teamData.message);

  // 7. Test Invite API
  console.log('7. Testing /api/auth/invite endpoint...');
  const inviteRes = await fetch(`${baseUrl}/auth/invite`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ email: 'dev1@example.com', role: 'DEVELOPER', projectId: project.id, teamId: teamData.team.id })
  });
  const inviteData = await inviteRes.json();
  if (!inviteRes.ok) throw new Error(`Invite generation failed: ${JSON.stringify(inviteData)}`);
  console.log('Invite Generation OK! Link:', inviteData.inviteLink);

  console.log('\n==================================');
  console.log('✅ ALL API & DB TESTS PASSED!');
  console.log('==================================\n');
  await prisma.$disconnect();
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
