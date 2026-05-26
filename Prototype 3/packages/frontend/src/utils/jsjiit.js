/**
 * jsjiit.js — JIIT WebPortal API Client
 * Based on the working jportal-vhost implementation (https://github.com/J2V-k/jportal-vhost)
 * All API calls use `json:` for payloads (even encrypted ones) because the JIIT API
 * expects Content-Type: application/json with a JSON-stringified body.
 * For encrypted payloads, JSON.stringify(base64string) correctly wraps it in quotes.
 */

const IV = new TextEncoder().encode("dcek9wb8frty1pnm");
const DEFCAPTCHA = { captcha: "phw5n", hidden: "gmBctEffdSg=" };

function generate_date_seq(date = null) {
  if (date === null) {
    date = new Date();
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
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

function base64Encode(data) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(data)));
}

async function generate_key(date = null) {
  const dateSeq = generate_date_seq(date);
  const keyData = new TextEncoder().encode("qa8y" + dateSeq + "ty1pn");
  return window.crypto.subtle.importKey(
    "raw", 
    keyData, 
    { name: "AES-CBC" }, 
    false, 
    ["encrypt", "decrypt"]
  );
}

async function encrypt(data) {
  const key = await generate_key();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv: IV }, 
    key, 
    data
  );
  return new Uint8Array(encrypted);
}

async function serialize_payload(payload) {
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  const pbytes = await encrypt(raw);
  return base64Encode(pbytes);
}

export async function generate_local_name(date = null) {
  const rand4 = k(4);
  const dateSeq = generate_date_seq(date);
  const rand5 = k(5);
  const rawBytes = new TextEncoder().encode(rand4 + dateSeq + rand5);
  const encrypted = await encrypt(rawBytes);
  return base64Encode(encrypted);
}

export class WebPortal {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || "/api/webportal/proxy";
    this.session = null;
  }

  async __hit(method, path, options = {}) {
    const targetUrl = `${this.apiUrl}${path}`;
    
    // Build headers — matches jportal-vhost exactly
    const headers = {
      "Content-Type": "application/json",
    };

    if (options.authenticated && this.session) {
      headers["Authorization"] = `Bearer ${this.session.token}`;
      headers["LocalName"] = await generate_local_name();
    } else {
      headers["LocalName"] = await generate_local_name();
    }

    const fetchOptions = {
      method,
      headers,
    };

    // CRITICAL: Always use JSON.stringify for the body.
    // For encrypted payloads (base64 strings), JSON.stringify wraps them in quotes,
    // producing valid JSON: "base64string". This is what the JIIT API expects.
    // For plain objects, JSON.stringify produces standard JSON: {"key":"value"}.
    if (options.json !== undefined) {
      fetchOptions.body = JSON.stringify(options.json);
    }

    try {
      const response = await fetch(targetUrl, fetchOptions);
      
      if (response.status === 513) {
        throw new Error("JIIT Web Portal server is temporarily unavailable (HTTP 513). Please try again later.");
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim().length === 0) {
        throw new Error(`JIIT Web Portal returned empty response (HTTP ${response.status})`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`JIIT Web Portal returned invalid JSON (HTTP ${response.status}): ${responseText.substring(0, 100)}`);
      }

      if (data.status && data.status.responseStatus !== "Success") {
        const errMsg = (data.status.errors && data.status.errors.length > 0)
          ? data.status.errors.join('; ')
          : (data.status.responseMessage || "API Request Failed");
        throw new Error(errMsg);
      }

      return data;
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        throw new Error("Network error: Cannot reach JIIT Web Portal. Check your connection.");
      }
      throw err;
    }
  }

  async student_login(username, password) {
    const pretokenPath = "/token/pretoken-check";
    const generateTokenPath = "/token/generatewebtoken";

    // Step 1: Pretoken check — encrypted payload via json:
    const pretokenPayload = await serialize_payload({
      username,
      usertype: "S",
      captcha: DEFCAPTCHA
    });

    const pretokenResponse = await this.__hit("POST", pretokenPath, {
      json: pretokenPayload
    });

    // Step 2: Generate token with password
    const loginData = pretokenResponse.response;
    delete loginData.rejectedData;
    loginData.Modulename = "STUDENTMODULE";
    loginData.passwordotpvalue = password;

    const tokenPayload = await serialize_payload(loginData);
    const tokenResponse = await this.__hit("POST", generateTokenPath, {
      json: tokenPayload
    });

    const regData = tokenResponse.response.regdata;
    const inst = regData.institutelist[0];

    this.session = {
      token: regData.token,
      memberid: regData.memberid,
      userid: regData.userid,
      clientid: regData.clientid,
      membertype: regData.membertype,
      name: regData.name,
      enrollmentno: regData.enrollmentno,
      institute: inst.label,
      instituteid: inst.value,
      get_headers: async () => {
        const localName = await generate_local_name();
        return {
          "Authorization": `Bearer ${regData.token}`,
          "LocalName": localName
        };
      }
    };

    return this.session;
  }

  async get_personal_info() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/studentpersinfo/getstudent-personalinformation";
    const payload = {
      clinetid: "SOAU",
      instituteid: this.session.instituteid
    };
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_sgpa_cgpa() {
    if (!this.session) throw new Error("Not logged in");
    
    // First check current semester
    const checkPath = "/studentsgpacgpa/checkIfstudentmasterexist";
    const checkPayload = await serialize_payload({
      instituteid: this.session.instituteid,
      studentid: this.session.memberid,
      name: this.session.name,
      enrollmentno: this.session.enrollmentno
    });
    const checkRes = await this.__hit("POST", checkPath, {
      json: checkPayload,
      authenticated: true
    });
    
    const currentSem = checkRes.response.studentlov.currentsemester;
    
    // Now fetch SGPA list
    const path = "/studentsgpacgpa/getallsemesterdata";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      studentid: this.session.memberid,
      stynumber: currentSem
    });
    
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    
    return res.response;
  }

  async get_attendance_meta() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/StudentClassAttendance/getstudentInforegistrationforattendence";
    const payload = {
      clientid: this.session.clientid,
      instituteid: this.session.instituteid,
      membertype: this.session.membertype
    };
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_attendance(header, semester) {
    if (!this.session) throw new Error("Not logged in");
    const path = "/StudentClassAttendance/getstudentattendancedetail";
    const payload = await serialize_payload({
      clientid: this.session.clientid,
      instituteid: this.session.instituteid,
      registrationcode: semester.registrationcode || semester.registration_code,
      registrationid: semester.registrationid || semester.registration_id,
      stynumber: header.stynumber || header.stynumber
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_semesters_for_grade_card() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/studentgradecard/getregistrationList";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response.registrations;
  }

  async get_grade_card(semester) {
    if (!this.session) throw new Error("Not logged in");
    
    // First get program ID
    const infoPath = "/studentgradecard/getstudentinfo";
    const infoPayload = await serialize_payload({
      instituteid: this.session.instituteid
    });
    const infoRes = await this.__hit("POST", infoPath, {
      json: infoPayload,
      authenticated: true
    });
    
    const programid = infoRes.response.programid;
    
    // Now fetch Grade Card
    const path = "/studentgradecard/showstudentgradecard";
    const payload = await serialize_payload({
      branchid: this.session.branch_id || "CSE",
      instituteid: this.session.instituteid,
      programid: programid,
      registrationid: semester.registrationid || semester.registration_id
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_registered_subjects_and_faculties(semester) {
    if (!this.session) throw new Error("Not logged in");
    const path = "/reqsubfaculty/getfaculties";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      studentid: this.session.memberid,
      registrationid: semester.registrationid || semester.registration_id
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_semesters_for_exam_events() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/studentcommonsontroller/getsemestercode-withstudentexamevents";
    const payload = await serialize_payload({
      clientid: this.session.clientid,
      instituteid: this.session.instituteid,
      memberid: this.session.memberid
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response.semesterCodeinfo.semestercode;
  }

  async get_exam_events(semester) {
    if (!this.session) throw new Error("Not logged in");
    const path = "/studentcommonsontroller/getstudentexamevents";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      registationid: semester.registrationid || semester.registration_id
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response.eventcode.examevent;
  }

  async get_exam_schedule(semester, event) {
    if (!this.session) throw new Error("Not logged in");
    const path = "/studentsttattview/getstudent-examschedule";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      registrationid: semester.registrationid || semester.registration_id,
      exameventid: event.exameventid || event.exam_event_id
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_subject_daily_attendance(semester, subjectid, individualsubjectcode, subjectcomponentids) {
    if (!this.session) throw new Error("Not logged in");
    const path = "/StudentClassAttendance/getstudentsubjectpersentage";
    const payload = await serialize_payload({
      cmpidkey: subjectcomponentids.map(id => ({ subjectcomponentid: id })),
      clientid: this.session.clientid,
      instituteid: this.session.instituteid,
      registrationcode: semester.registrationcode || semester.registration_code,
      registrationid: semester.registrationid || semester.registration_id,
      subjectcode: individualsubjectcode,
      subjectid: subjectid
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_registered_semesters() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/reqsubfaculty/getregistrationList";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      studentid: this.session.memberid
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response.registrations.map(i => ({
      registration_code: i.registrationcode,
      registration_id: i.registrationid
    }));
  }

  async get_semesters_for_marks() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/studentcommonsontroller/getsemestercode-exammarks";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      studentid: this.session.memberid
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response.semestercode.map(i => ({
      registration_code: i.registrationcode,
      registration_id: i.registrationid
    }));
  }

  async get_subject_choices(semester) {
    if (!this.session) throw new Error("Not logged in");
    const path = "/studentchoiceprint/getsubjectpreference";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      clientid: this.session.clientid,
      registrationid: semester.registrationid || semester.registration_id
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_fee_summary() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/studentfeeledger/loadfeesummary";
    const payload = {
      instituteid: this.session.instituteid
    };
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_fines_msc_charges() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/collectionpendingpayments/getpendingpaymentsdata";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      studentid: this.session.memberid
    });
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    return res.response;
  }

  async get_hostel_details() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/myhostelallocationdetail/gethostelallocationdetail";
    const payload = {
      clientid: this.session.clientid,
      instituteid: this.session.instituteid,
      studentid: this.session.memberid
    };
    const res = await this.__hit("POST", path, {
      json: payload,
      authenticated: true
    });
    if (!res?.response) throw new Error("Hostel details not found");
    return res.response;
  }

  async download_fee_receipt() {
    if (!this.session) throw new Error("Not logged in");
    const path = "/feedemandreportcontroller/generatereportforpdf";
    const payload = await serialize_payload({
      instituteid: this.session.instituteid,
      studentid: this.session.memberid
    });
    const headers = await this.session.get_headers();
    const targetUrl = `${this.apiUrl}${path}`;
    
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error("Failed to generate fee report PDF");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fee_Report_${this.session.memberid}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }
}
