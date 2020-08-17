// Please keep secrets in your backend, this example has
// everything on the front end to simplify the implementation
const clientId = "YOUR_CLIENT_ID";
const clientSecret = "YOUR_CLIENT_SECRET";
const callbackUrl = "YOUR_CALLBACK_URL";

// Since there is no back end in the example, We will store data
// in the browser localStorage, to be prepared for the callback
const demoData = localStorage.getItem("demoData");

// All other methods are called from this function
const downloadWealthReport = async () => {
  const givenName = document.getElementById("givenName").value;
  const familyName = document.getElementById("familyName").value;
  const email = document.getElementById("email").value;

  // first you get an access token
  const { accessToken, sub: adviserId } = await getAccessTokenFromVC();

  // then we create a new client, this can be omitted if client already exists
  const { id: newClientId } = await createNewClient(
    adviserId,
    givenName,
    familyName,
    email,
    accessToken
  );

  // then we create a new assessment, which is how we call a income and expenditure report or Wealth Report
  const { id: assessmentId } = await createAssessment(
    accessToken,
    adviserId,
    newClientId,
    callbackUrl
  );

  // then we get the url for that particular assessment and we redirect the client
  const { url } = await getAssessmentUrl(accessToken, adviserId, assessmentId);
  window.location.href = url;
};

// now the implementation of the already mentioned functions
// just a call to the api
const getAccessTokenFromVC = async () => {
  const response = await fetch(
    "https://api.staging.visiblecapital.io/auth/login/api",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret, realm: "adviser" }),
    }
  );
  const body = await response.json();
  return body.result;
};

const createNewClient = async (
  adviserId,
  givenName,
  familyName,
  email,
  accessToken
) => {
  const response = await fetch(
    `https://api.staging.visiblecapital.io/advisers/${adviserId}/clients`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email, givenName, familyName }),
    }
  );
  const body = await response.json();
  return body.result;
};

const createAssessment = async (
  accessToken,
  adviserId,
  newClientId,
  callbackUrl
) => {
  const response = await fetch(
    `https://api.staging.visiblecapital.io/advisers/${adviserId}/clients/${newClientId}/invite`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ callbackUrl }),
    }
  );
  const body = await response.json();
  return body.result;
};

const getAssessmentUrl = async (accessToken, adviserId, assessmentId) => {
  const response = await fetch(
    `https://api.staging.visiblecapital.io/advisers/${adviserId}/assessments/${assessmentId}/url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const body = await response.json();
  localStorage.setItem("demoData", JSON.stringify({ adviserId, assessmentId }));
  return body.result;
};

// This is the only function that has not been called yet in the code above
// this function only gets called when we are coming back from the callback
const getWealthReport = async (adviserId, assessmentId) => {
  const { accessToken } = await getAccessTokenFromVC();
  const response = await fetch(
    `https://api.staging.visiblecapital.io/advisers/${adviserId}/assessments/${assessmentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const body = await response.json();

  document.getElementById("resultPanel").innerText = JSON.stringify(
    body.result.summary,
    undefined,
    2
  );
  return;
};

// this bit is for the callback, if I see that there is something in local storage, in this example, it means that
// we are waiting for the callback
if (demoData) {
  const { adviserId, assessmentId } = JSON.parse(demoData);
  // so if I have an adviserId, and an assessmentId I can now try to get the wealth report
  if (adviserId && assessmentId) {
    getWealthReport(adviserId, assessmentId);
  }
}
