import fetch from 'node-fetch';

console.log("starting script...")
async function run() {
  const formData = {
    grant_type: 'client_credentials'
  };

  const resp = await fetch(
    `https://wwwcie.ups.com/security/v1/oauth/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-merchant-id': 'string',
        Authorization: 'Basic ' + Buffer.from('mraIImS1waTlM1gQg94HAVsD7ze2cVTpcLLOSbKhsSj9hjMV:Dp1uCmRGQABvZRDj9yAubZ0a8Tg0wlHrR301NM02fnQG6ciWGo7qFpnF8sLufS9k').toString('base64')
      },
      body: new URLSearchParams(formData).toString()
    }
  );

  const data = await resp.text();
  
  console.log(data);
}


run();
console.log("ending script...")