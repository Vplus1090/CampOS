const crypto = require('crypto');

const IV = Buffer.from('dcek9wb8frty1pnm', 'utf8');
const DEFCAPTCHA = { captcha: "phw5n", hidden: "gmBctEffdSg=" };

function generate_date_seq(date = null) {
  if (date === null) date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(2);
  const weekday = String(date.getDay());
  return day[0] + month[0] + year[0] + weekday + day[1] + month[1] + year[1];
}

function k(n) {
  let t = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    e = "";
  for (let s = 0; s < n; s++) {
    let i = Math.floor(Math.random() * t.length);
    e += t[i];
  }
  return e;
}

function generate_key(date = null) {
  const dateSeq = generate_date_seq(date);
  const keyStr = "qa8y" + dateSeq + "ty1pn";
  return Buffer.from(keyStr, 'utf8');
}

function encrypt(dataStr, date = null) {
  const key = generate_key(date);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, IV);
  let encrypted = cipher.update(dataStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function serialize_payload(payload, date = null) {
  return encrypt(JSON.stringify(payload), date);
}

function generate_local_name(date = null) {
  const rand4 = k(4);
  const dateSeq = generate_date_seq(date);
  const rand5 = k(5);
  return encrypt(rand4 + dateSeq + rand5, date);
}

async function hit(path, jsonPayload, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'LocalName': generate_local_name()
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`http://localhost:5001/api/webportal/proxy${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(jsonPayload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}

async function run() {
  const username = process.env.LIVE_PORTAL_USERNAME || "2501200031";
  const password = process.env.LIVE_PORTAL_PASSWORD;

  if (!password) {
    console.error("❌ Error: LIVE_PORTAL_PASSWORD environment variable is not set.");
    process.exit(1);
  }

  const pretokenPayload = serialize_payload({
    username,
    usertype: "S",
    captcha: DEFCAPTCHA
  });

  const pretokenRes = await hit('/token/pretoken-check', pretokenPayload);
  const loginData = pretokenRes.response;
  delete loginData.rejectedData;
  loginData.Modulename = "STUDENTMODULE";
  loginData.passwordotpvalue = password;

  const tokenPayload = serialize_payload(loginData);
  const tokenRes = await hit('/token/generatewebtoken', tokenPayload);
  const regData = tokenRes.response.regdata;

  const session = {
    token: regData.token,
    clientid: regData.clientid,
    instituteid: regData.institutelist[0].value,
    membertype: regData.membertype
  };

  const metaRes = await hit('/StudentClassAttendance/getstudentInforegistrationforattendence', {
    clientid: session.clientid,
    instituteid: session.instituteid,
    membertype: session.membertype
  }, session.token);

  const semesters = metaRes.response.semlist || [];
  const latestSem = semesters[0];
  const header = metaRes.response.headerlist?.[0];
  const stynumber = header ? (header.stynumber || '2') : '2';

  // Fetch 2026EVESEM (semesters[1])
  const sem = semesters[1] || semesters[0];
  const attendancePayload = serialize_payload({
    clientid: session.clientid,
    instituteid: session.instituteid,
    registrationcode: sem.registrationcode,
    registrationid: sem.registrationid,
    stynumber: stynumber
  });

  const attRes = await hit('/StudentClassAttendance/getstudentattendancedetail', attendancePayload, session.token);
  const list = attRes.response.studentattendancelist || [];
  
  console.log("Raw Subject Entry JSON sample:");
  console.log(JSON.stringify(list[0], null, 2));
}

run().catch(e => console.error(e));
