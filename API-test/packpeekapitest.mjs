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
        Authorization: 'Basic ' + Buffer.from('username:pw').toString('base64')
      },
      body: new URLSearchParams(formData).toString()
    }
  );

  const data = await resp.text();
  
  console.log(data);
}


run();
console.log("ending script...")