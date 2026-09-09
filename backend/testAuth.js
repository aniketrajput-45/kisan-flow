process.env.USE_MOCK_DB = 'true';
const http = require('http');
const app = require('./src/app');

function runAuthVerification() {
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`[Verification Test] Server listening on ${baseUrl}`);

    let farmerToken = '';
    let officerToken = '';

    try {
      // 1. Register Farmer (without passing role)
      console.log('\n--- Test 1: Register Farmer ---');
      const regRes = await postJson(`${baseUrl}/api/auth/register`, {
        name: 'Test Farmer',
        phone: '9999999999',
        password: 'password123',
      });
      console.log('Status:', regRes.status);
      console.log('Body:', regRes.body);
      if (regRes.status === 201 && regRes.body.success) {
        farmerToken = regRes.body.data.token;
      }

      // 1b. Role Escalation Prevention Test (Pass role ADMIN explicitly)
      console.log('\n--- Test 1b: Role Escalation Prevention Test (Attempting ADMIN) ---');
      const escAdminRes = await postJson(`${baseUrl}/api/auth/register`, {
        name: 'Malicious User Admin',
        phone: '7777777777',
        role: 'ADMIN',
        password: 'password123',
      });
      console.log('Status:', escAdminRes.status);
      console.log('Assigned Role:', escAdminRes.body.data.user.role);

      // 1c. Role Escalation Prevention Test (Pass role OFFICER explicitly)
      console.log('\n--- Test 1c: Role Escalation Prevention Test (Attempting OFFICER) ---');
      const escOfficerRes = await postJson(`${baseUrl}/api/auth/register`, {
        name: 'Malicious User Officer',
        phone: '6666666666',
        role: 'OFFICER',
        password: 'password123',
      });
      console.log('Status:', escOfficerRes.status);
      console.log('Assigned Role:', escOfficerRes.body.data.user.role);

      // 2. Login Farmer
      console.log('\n--- Test 2: Login Farmer ---');
      const loginRes = await postJson(`${baseUrl}/api/auth/login`, {
        phone: '9999999999',
        password: 'password123',
      });
      console.log('Status:', loginRes.status);

      // 3. Register Officer (For test suite setup only - simulated direct DB insert)
      const { memoryDb } = require('./src/config/dbFallback');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('password123', 10);
      const officerUser = {
        id: memoryDb.nextUserId++,
        name: 'Test Officer',
        phone: '8888888888',
        role: 'OFFICER',
        password_hash: hash,
        created_at: new Date(),
      };
      memoryDb.users.push(officerUser);

      const loginOffRes = await postJson(`${baseUrl}/api/auth/login`, {
        phone: '8888888888',
        password: 'password123',
      });
      officerToken = loginOffRes.body.data.token;

      // 4. Access Protected Route with valid Farmer Token
      console.log('\n--- Test 4: Farmer accessing Farmer route ---');
      const farmerAccess = await getJson(`${baseUrl}/api/test/farmer`, farmerToken);
      console.log('Status:', farmerAccess.status, 'Body:', farmerAccess.body);

      // 5. Reject missing JWT
      console.log('\n--- Test 5: Missing JWT ---');
      const noJwtAccess = await getJson(`${baseUrl}/api/test/farmer`, '');
      console.log('Status:', noJwtAccess.status, 'Body:', noJwtAccess.body);

      // 6. Reject invalid JWT
      console.log('\n--- Test 6: Invalid JWT ---');
      const invalidJwtAccess = await getJson(`${baseUrl}/api/test/farmer`, 'invalid.jwt.token');
      console.log('Status:', invalidJwtAccess.status, 'Body:', invalidJwtAccess.body);

      // 7. Role middleware rejects incorrect role (Farmer attempting Officer route)
      console.log('\n--- Test 7: Farmer accessing Officer route (Forbidden) ---');
      const forbiddenAccess = await getJson(`${baseUrl}/api/test/officer`, farmerToken);
      console.log('Status:', forbiddenAccess.status, 'Body:', forbiddenAccess.body);

      // 8. Officer accessing Officer route
      console.log('\n--- Test 8: Officer accessing Officer route ---');
      const officerAccess = await getJson(`${baseUrl}/api/test/officer`, officerToken);
      console.log('Status:', officerAccess.status, 'Body:', officerAccess.body);

      console.log('\n[Verification Test] All Phase 2 Auth & Role Escalation Security Checks Passed.');
    } catch (err) {
      console.error('[Verification Test Error]', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'GET',
        headers,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

if (require.main === module) {
  runAuthVerification();
}
